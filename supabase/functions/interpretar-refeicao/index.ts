/**
 * Interpreta uma frase em linguagem natural ("2 colheres de arroz e um ovo
 * frito") e devolve os alimentos identificados, prontos para o app calcular e
 * registrar.
 *
 * A chave do Gemini nunca sai do servidor: qualquer pessoa que rode o APK
 * consegue ler as requisições que ele faz, e o repositório é público.
 *
 * A IA só escolhe qual linha da tabela `food` corresponde ao que foi escrito e
 * estima a gramagem. Os nutrientes continuam sendo calculados pelo app, por
 * regra de três sobre os valores da própria tabela — deixar o modelo opinar
 * sobre teor de selênio produziria um número que parece certo e não tem fonte.
 *
 * Sem imports: a primeira versão usava `jsr:@supabase/supabase-js`, e o
 * download desse módulo no primeiro boot levou a chamada inicial a 106s
 * (depois disso, 8s). Com `fetch` puro contra a API REST, não há o que baixar.
 */

// gemini-2.0-flash foi descontinuado (404) e gemini-2.5-flash também responde
// 404 nesta chave. 3.1-flash-lite foi o que respondeu e acertou os casos de
// teste, inclusive recusando comida inexistente em vez de forçar um palpite.
const MODELO = 'gemini-3.1-flash-lite';
const TEMPO_LIMITE_IA_MS = 45_000;

type Alimento = {
  id: string;
  name: string;
  category: string;
  default_unit: string | null;
  default_grams: number | null;
};

type ItemInterpretado = {
  food_id: string;
  food_name: string;
  grams: number;
  meal_type: string;
  trecho: string;
  confianca: 'alta' | 'media' | 'baixa';
};

const TIPOS_REFEICAO = ['cafe_da_manha', 'almoco', 'lanche', 'jantar', 'ceia'];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/**
 * Preferência: secret de plataforma. Se não existir, cai no Supabase Vault.
 *
 * A leitura do vault passa por `public.segredo_do_app`, SECURITY DEFINER com
 * execute concedido SOMENTE ao service_role: anônimo recebe 401 e usuário
 * logado recebe 403. Quando o secret de plataforma for cadastrado, ele vence
 * automaticamente e a cópia no vault pode ser apagada.
 */
let chaveEmCache: string | null = null;

async function obterChaveGemini(): Promise<string | null> {
  const doAmbiente = Deno.env.get('GEMINI_API_KEY');
  if (doAmbiente) return doAmbiente;
  if (chaveEmCache) return chaveEmCache;

  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!servico) return null;

  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/segredo_do_app`, {
    method: 'POST',
    headers: { apikey: servico, Authorization: `Bearer ${servico}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'GEMINI_API_KEY' }),
  });
  if (!r.ok) return null;

  const valor = await r.json();
  if (typeof valor !== 'string' || !valor) return null;
  chaveEmCache = valor;
  return chaveEmCache;
}

/** Lê o catálogo com o token de quem chamou — a RLS decide o que ele vê. */
async function lerCatalogo(autorizacao: string): Promise<Alimento[] | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/food?select=id,name,category,default_unit,default_grams&order=name`,
    { headers: { apikey: ANON, Authorization: autorizacao } }
  );
  if (!r.ok) return null;
  return (await r.json()) as Alimento[];
}

function montarPrompt(alimentos: Alimento[], texto: string, horaLocal: number) {
  const catalogo = alimentos
    .map((a) => {
      const medida = a.default_grams ? ` | 1 ${a.default_unit ?? 'unidade'} = ${a.default_grams}g` : '';
      return `${a.id}\t${a.name} (${a.category})${medida}`;
    })
    .join('\n');

  return `Voce interpreta o que uma pessoa escreveu que comeu e associa cada item a um alimento de um catalogo fixo.

CATALOGO (id, nome, categoria e medida caseira padrao):
${catalogo}

REGRAS
1. Use SOMENTE ids que aparecem no catalogo acima. Nunca invente um id.
2. Se algo escrito nao tiver correspondencia razoavel no catalogo, ignore aquele item e liste-o em "nao_encontrados".
3. Estime "grams" a partir da medida caseira citada. Quando houver medida padrao no catalogo, use-a como base ("2 colheres de arroz" = 2 x a medida da colher).
4. Quando a quantidade nao for dita, use a medida padrao do alimento; se nao houver, use 100.
5. "meal_type" deve ser um de: ${TIPOS_REFEICAO.join(', ')}. Se a pessoa nao disser a refeicao, deduza pelo horario local atual (${horaLocal}h).
6. "confianca": "alta" quando o alimento e a quantidade estao claros; "media" quando a quantidade foi estimada; "baixa" quando a correspondencia do alimento e duvidosa.
7. "trecho" e o pedaco do texto original que gerou aquele item.
8. NAO calcule calorias nem nutrientes. Isso e feito depois, fora daqui.

Responda APENAS com JSON valido, sem markdown, neste formato:
{"itens":[{"food_id":"...","food_name":"...","grams":0,"meal_type":"...","trecho":"...","confianca":"alta"}],"nao_encontrados":["..."]}

TEXTO DA PESSOA:
${texto}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);

  const chave = await obterChaveGemini();
  if (!chave) return json({ erro: 'Chave do Gemini nao configurada no projeto.' }, 500);

  let corpo: { texto?: string; hora_local?: number };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Corpo invalido.' }, 400);
  }

  const texto = (corpo.texto ?? '').trim();
  if (!texto) return json({ erro: 'Escreva o que voce comeu.' }, 400);
  if (texto.length > 500) return json({ erro: 'Texto muito longo. Use ate 500 caracteres.' }, 400);

  const autorizacao = req.headers.get('Authorization') ?? '';

  // Lê o catálogo ANTES de chamar a IA: sem sessão de usuário a RLS devolve
  // zero linhas e a função para aqui, sem gastar cota do Gemini.
  const alimentos = await lerCatalogo(autorizacao);
  if (!alimentos) return json({ erro: 'Nao foi possivel ler o catalogo de alimentos.' }, 500);
  if (!alimentos.length) return json({ erro: 'Catalogo de alimentos vazio.' }, 500);

  const horaLocal = Number.isInteger(corpo.hora_local) ? corpo.hora_local! : new Date().getHours();

  let resposta: Response;
  try {
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify({
          contents: [{ parts: [{ text: montarPrompt(alimentos, texto, horaLocal) }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(TEMPO_LIMITE_IA_MS),
      }
    );
  } catch {
    // Sem isto, uma demora da IA viraria um app girando sem fim.
    return json({ erro: 'A IA demorou demais para responder. Tente de novo.' }, 504);
  }

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    // 503 do Gemini é sobrecarga temporária, não erro de configuração.
    const mensagem =
      resposta.status === 503
        ? 'A IA esta sobrecarregada no momento. Tente de novo em alguns segundos.'
        : 'A IA nao respondeu.';
    return json({ erro: mensagem, status: resposta.status, detalhe: detalhe.slice(0, 400) }, 502);
  }

  const bruto = await resposta.json();
  const textoResposta: string | undefined = bruto?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoResposta) return json({ erro: 'A IA devolveu resposta vazia.' }, 502);

  let interpretado: { itens?: ItemInterpretado[]; nao_encontrados?: string[] };
  try {
    interpretado = JSON.parse(textoResposta);
  } catch {
    return json({ erro: 'A IA nao devolveu JSON valido.', resposta: textoResposta.slice(0, 400) }, 502);
  }

  // Validação do lado de cá: o modelo pode alucinar um id, uma gramagem
  // absurda ou um tipo de refeição inexistente. Nada disso pode chegar ao app.
  const porId = new Map(alimentos.map((a) => [a.id, a]));
  const itens: ItemInterpretado[] = [];
  const descartados: string[] = [...(interpretado.nao_encontrados ?? [])];

  for (const item of interpretado.itens ?? []) {
    const alimento = porId.get(item?.food_id);
    if (!alimento) {
      descartados.push(item?.trecho || item?.food_name || 'item nao reconhecido');
      continue;
    }
    const gramas = Number(item.grams);
    if (!Number.isFinite(gramas) || gramas <= 0 || gramas > 3000) {
      descartados.push(`${alimento.name} (quantidade invalida)`);
      continue;
    }
    itens.push({
      food_id: alimento.id,
      food_name: alimento.name, // sempre o nome do banco, nunca o que a IA escreveu
      grams: Math.round(gramas),
      meal_type: TIPOS_REFEICAO.includes(item.meal_type) ? item.meal_type : 'lanche',
      trecho: String(item.trecho ?? '').slice(0, 120),
      confianca: ['alta', 'media', 'baixa'].includes(item.confianca) ? item.confianca : 'baixa',
    });
  }

  return json({ itens, nao_encontrados: descartados, catalogo_tamanho: alimentos.length });
});

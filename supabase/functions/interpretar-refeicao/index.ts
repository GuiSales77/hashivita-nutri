import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Interpreta uma frase em linguagem natural ("2 colheres de arroz e um ovo
 * frito") e devolve os alimentos identificados, prontos para o app calcular e
 * registrar.
 *
 * Por que isto vive no servidor e não no app:
 * a chave do Gemini não pode ir junto com o aplicativo. Qualquer pessoa que
 * rode o APK consegue ler as requisições que ele faz, e o repositório é
 * público. Aqui a chave é um secret do projeto e nunca sai do servidor.
 *
 * O que a IA decide e o que ela NÃO decide:
 * ela só escolhe qual linha da tabela `food` corresponde ao que foi escrito e
 * estima a gramagem. Os nutrientes continuam sendo calculados pelo app, por
 * regra de três sobre os valores da própria tabela. Num app de saúde, deixar o
 * modelo inventar "selênio da castanha-do-pará" produziria um número que
 * parece certo e não tem fonte.
 */

// gemini-2.0-flash foi descontinuado; 2.5-flash responde 404 nesta chave.
// 3.1-flash-lite foi o que respondeu e acertou os casos de teste.
const MODELO = 'gemini-3.1-flash-lite';

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

function montarPrompt(alimentos: Alimento[], texto: string, horaLocal: number) {
  const catalogo = alimentos
    .map((a) => {
      const medida = a.default_grams ? ` | 1 ${a.default_unit ?? 'unidade'} = ${a.default_grams}g` : '';
      return `${a.id}\t${a.name} (${a.category})${medida}`;
    })
    .join('\n');

  return `Você interpreta o que uma pessoa escreveu que comeu e associa cada item a um alimento de um catálogo fixo.

CATÁLOGO (id, nome, categoria e medida caseira padrão):
${catalogo}

REGRAS
1. Use SOMENTE ids que aparecem no catálogo acima. Nunca invente um id.
2. Se algo escrito não tiver correspondência razoável no catálogo, ignore aquele item e liste-o em "nao_encontrados".
3. Estime "grams" a partir da medida caseira citada. Quando houver medida padrão no catálogo, use-a como base ("2 colheres de arroz" = 2 × a medida da colher).
4. Quando a quantidade não for dita, use a medida padrão do alimento; se não houver, use 100.
5. "meal_type" deve ser um de: ${TIPOS_REFEICAO.join(', ')}. Se a pessoa não disser a refeição, deduza pelo horário local atual (${horaLocal}h).
6. "confianca": "alta" quando o alimento e a quantidade estão claros; "media" quando a quantidade foi estimada; "baixa" quando a correspondência do alimento é duvidosa.
7. "trecho" é o pedaço do texto original que gerou aquele item.
8. NÃO calcule calorias nem nutrientes. Isso é feito depois, fora daqui.

Responda APENAS com JSON válido, sem markdown, neste formato:
{"itens":[{"food_id":"...","food_name":"...","grams":0,"meal_type":"...","trecho":"...","confianca":"alta"}],"nao_encontrados":["..."]}

TEXTO DA PESSOA:
${texto}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);

  const chave = Deno.env.get('GEMINI_API_KEY');
  if (!chave) return json({ erro: 'GEMINI_API_KEY não configurada no projeto.' }, 500);

  let corpo: { texto?: string; hora_local?: number };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Corpo inválido.' }, 400);
  }

  const texto = (corpo.texto ?? '').trim();
  if (!texto) return json({ erro: 'Escreva o que você comeu.' }, 400);
  if (texto.length > 500) return json({ erro: 'Texto muito longo. Use até 500 caracteres.' }, 400);

  // A função roda com verify_jwt, então só chega aqui quem está logado. O
  // cliente abaixo usa o token de quem chamou, respeitando a RLS da tabela.
  const autorizacao = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: autorizacao } } }
  );

  const { data: alimentos, error: erroCatalogo } = await supabase
    .from('food')
    .select('id, name, category, default_unit, default_grams')
    .order('name');

  if (erroCatalogo) return json({ erro: 'Não foi possível ler o catálogo: ' + erroCatalogo.message }, 500);
  if (!alimentos?.length) return json({ erro: 'Catálogo de alimentos vazio.' }, 500);

  const horaLocal = Number.isInteger(corpo.hora_local) ? corpo.hora_local! : new Date().getHours();

  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify({
        contents: [{ parts: [{ text: montarPrompt(alimentos as Alimento[], texto, horaLocal) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    return json({ erro: 'A IA não respondeu.', status: resposta.status, detalhe: detalhe.slice(0, 400) }, 502);
  }

  const bruto = await resposta.json();
  const textoResposta: string | undefined = bruto?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoResposta) return json({ erro: 'A IA devolveu resposta vazia.', bruto }, 502);

  let interpretado: { itens?: ItemInterpretado[]; nao_encontrados?: string[] };
  try {
    interpretado = JSON.parse(textoResposta);
  } catch {
    return json({ erro: 'A IA não devolveu JSON válido.', resposta: textoResposta.slice(0, 400) }, 502);
  }

  // Validação do lado de cá: o modelo pode alucinar um id, uma gramagem
  // absurda ou um tipo de refeição inexistente. Nada disso pode chegar ao app.
  const porId = new Map(alimentos.map((a: Alimento) => [a.id, a]));
  const itens: ItemInterpretado[] = [];
  const descartados: string[] = [...(interpretado.nao_encontrados ?? [])];

  for (const item of interpretado.itens ?? []) {
    const alimento = porId.get(item?.food_id);
    if (!alimento) {
      descartados.push(item?.trecho || item?.food_name || 'item não reconhecido');
      continue;
    }
    const gramas = Number(item.grams);
    if (!Number.isFinite(gramas) || gramas <= 0 || gramas > 3000) {
      descartados.push(`${alimento.name} (quantidade inválida)`);
      continue;
    }
    itens.push({
      food_id: alimento.id,
      food_name: alimento.name, // sempre o nome do banco, não o que a IA escreveu
      grams: Math.round(gramas),
      meal_type: TIPOS_REFEICAO.includes(item.meal_type) ? item.meal_type : 'lanche',
      trecho: String(item.trecho ?? '').slice(0, 120),
      confianca: ['alta', 'media', 'baixa'].includes(item.confianca) ? item.confianca : 'baixa',
    });
  }

  return json({ itens, nao_encontrados: descartados, catalogo_tamanho: alimentos.length });
});

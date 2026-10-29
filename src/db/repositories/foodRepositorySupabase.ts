import { supabase } from '../../services/supabaseClient';

export type Food = {
  id: string;
  name: string;
  emoji: string | null;
  category: string;
  energia_kcal: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  sodium_mg: number | null;
  selenium_mcg: number | null;
  iodine_mcg: number | null;
  vitamin_d_mcg: number | null;
  iron_mg: number | null;
  zinc_mg: number | null;
  default_unit: string | null;
  default_grams: number | null;
};

/**
 * Neutraliza os curingas do LIKE. Sem isso, digitar "100%" ou "a_b" na busca
 * casa com qualquer coisa: `%` significa "qualquer sequência" e `_` "qualquer
 * caractere". Não é injeção de SQL (o PostgREST parametriza o valor), é
 * resultado errado. A barra invertida é o escape padrão do Postgres.
 */
function escaparCuringasLike(termo: string): string {
  return termo.replace(/[\\%_]/g, (caractere) => '\\' + caractere);
}

export async function searchFoods(query: string): Promise<Food[]> {
  let request = supabase.from('food').select('*').order('name', { ascending: true }).limit(20);
  if (query.trim()) {
    request = request.ilike('name', `%${escaparCuringasLike(query.trim())}%`);
  }
  try {
    const { data, error } = await request;
    if (error) {
      console.warn('Erro ao buscar alimentos:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    // Rede fora cai no `if (error)` acima, não aqui: o postgrest-js embrulha a
    // rejeição do fetch num `{ error }` (ver `res.catch((fetchError) => ...)`
    // em postgrest-js). Este catch é só rede de segurança para um lançamento
    // inesperado — não existe defeito conhecido que passe por ele.
    console.warn('Falha inesperada ao buscar alimentos:', e);
    return [];
  }
}

/**
 * `null` aqui significa uma coisa só: o alimento não existe no catálogo.
 *
 * Qualquer falha de leitura LANÇA, ao contrário de `searchFoods`, que devolve
 * lista vazia. A diferença é proposital: na busca, lista vazia é um estado de
 * tela legítimo; aqui, quem chama usa o resultado para dizer à pessoa por que o
 * registro não foi salvo, e "não encontrado no banco" seria mentira quando o
 * que caiu foi a conexão.
 */
export async function getFoodById(id: string): Promise<Food | null> {
  let resposta;
  try {
    resposta = await supabase.from('food').select('*').eq('id', id).maybeSingle();
  } catch (e) {
    // Mesmo caso do searchFoods: o caminho real da queda de rede é o
    // `resposta.error` logo abaixo. Isto cobre o lançamento inesperado.
    console.warn('Falha inesperada ao buscar alimento:', e);
    throw new Error('sem conexão com o servidor');
  }
  if (resposta.error) throw new Error(mensagemDeLeitura(resposta.error.message));
  return resposta.data;
}

/**
 * O postgrest-js entrega a queda de rede como `"TypeError: fetch failed"`, que
 * é o que apareceria na tela de confirmação da IA se fosse repassado cru.
 */
function mensagemDeLeitura(mensagem: string): string {
  if (/fetch failed|network|timeout|ENOTFOUND|ECONNREFUSED/i.test(mensagem)) {
    return 'sem conexão com o servidor';
  }
  return mensagem;
}

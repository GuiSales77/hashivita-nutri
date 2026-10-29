import { supabase } from '../../services/supabaseClient';
import { getFoodById } from './foodRepositorySupabase';
import { createMealLog } from './mealRepositorySupabase';
import { MealType } from '../../theme/theme';

export type ItemInterpretado = {
  food_id: string;
  food_name: string;
  grams: number;
  meal_type: MealType;
  trecho: string;
  confianca: 'alta' | 'media' | 'baixa';
};

export type Interpretacao = {
  itens: ItemInterpretado[];
  nao_encontrados: string[];
};

/**
 * Manda a frase para a Edge Function `interpretar-refeicao`, que fala com o
 * Gemini. A chave da IA vive lá, não aqui: o app é distribuído por APK e o
 * repositório é público, então qualquer chave embutida no cliente vaza.
 *
 * A função devolve só a correspondência com a tabela `food` e a gramagem. O
 * cálculo dos nutrientes continua local, por regra de três — a IA não tem voz
 * sobre quanto selênio tem um alimento.
 */
export async function interpretarRefeicao(texto: string): Promise<Interpretacao> {
  const { data, error } = await supabase.functions.invoke('interpretar-refeicao', {
    body: { texto, hora_local: new Date().getHours() },
  });

  if (error) {
    // O corpo da resposta traz a mensagem útil; o error sozinho só diz
    // "non-2xx status code", que não ajuda ninguém.
    const detalhe = (data as any)?.erro ?? (await lerErro(error));
    throw new Error(detalhe ?? 'Não foi possível interpretar o texto.');
  }
  if ((data as any)?.erro) throw new Error((data as any).erro);

  return {
    itens: (data as any)?.itens ?? [],
    nao_encontrados: (data as any)?.nao_encontrados ?? [],
  };
}

async function lerErro(error: unknown): Promise<string | null> {
  const contexto = (error as any)?.context;
  if (contexto && typeof contexto.json === 'function') {
    try {
      const corpo = await contexto.json();
      if (corpo?.erro) return corpo.erro;
    } catch {
      /* resposta sem JSON — cai no texto padrão */
    }
  }
  return (error as any)?.message ?? null;
}

/**
 * Grava os itens já revisados pelo usuário. Busca cada alimento no banco de
 * novo em vez de confiar no que veio da IA: os valores nutricionais usados no
 * cálculo têm que ser os da tabela, não os de uma resposta de modelo.
 */
export async function registrarItensInterpretados(
  userId: string,
  itens: ItemInterpretado[]
): Promise<{ registrados: number; falhas: string[] }> {
  const falhas: string[] = [];
  let registrados = 0;

  for (const item of itens) {
    try {
      const food = await getFoodById(item.food_id);
      if (food == null) {
        // Aqui `null` é ausência de verdade: o id veio da IA e o alimento pode
        // ter sido removido do catálogo entre a interpretação e a confirmação.
        falhas.push(`${item.food_name} (não encontrado no banco)`);
        continue;
      }
      await createMealLog(userId, food, undefined, `${item.grams}g`, item.grams, item.meal_type);
      registrados++;
    } catch (e: any) {
      falhas.push(`${item.food_name} (${e?.message ?? 'erro ao salvar'})`);
    }
  }

  return { registrados, falhas };
}

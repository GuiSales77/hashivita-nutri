import { supabase } from '../../services/supabaseClient';
import { Food } from './foodRepositorySupabase';
import { MealType, TIPOS_REFEICAO } from '../../theme/theme';

export type MealLog = {
  id: string;
  foodId: string | null;
  foodName: string;
  foodEmoji: string | null;
  quantity: number | null;
  unit: string | null;
  grams: number;
  loggedAt: string;
  nutrients: Record<string, number>;
  mealType: MealType;
};

/**
 * Regra de três simples sobre os valores da TACO (sempre por 100g):
 *   100g → valor_por_100g
 *   Qg   → X
 *   X = (valor_por_100g * Q) / 100
 */
export function calcularNutriente(valorPor100g: number | null, quantidadeGramas: number): number {
  if (!valorPor100g) return 0;
  return (valorPor100g * quantidadeGramas) / 100;
}

export function calcularNutrientesDoAlimento(food: Food, gramas: number) {
  return {
    energia_kcal: calcularNutriente(food.energia_kcal, gramas),
    proteina_g: calcularNutriente(food.proteina_g, gramas),
    carboidrato_g: calcularNutriente(food.carboidrato_g, gramas),
    sodium_mg: calcularNutriente(food.sodium_mg, gramas),
    selenium_mcg: calcularNutriente(food.selenium_mcg, gramas),
    iodine_mcg: calcularNutriente(food.iodine_mcg, gramas),
    vitamin_d_mcg: calcularNutriente(food.vitamin_d_mcg, gramas),
    iron_mg: calcularNutriente(food.iron_mg, gramas),
    zinc_mg: calcularNutriente(food.zinc_mg, gramas),
  };
}

export async function createMealLog(
  userId: string,
  food: Food,
  quantity: number | undefined,
  unit: string | undefined,
  grams: number,
  mealType: MealType
): Promise<void> {
  const nutrients = calcularNutrientesDoAlimento(food, grams);
  const linha = {
    user_id: userId,
    food_id: food.id,
    food_name: food.name,
    food_emoji: food.emoji,
    quantity: quantity ?? null,
    unit: unit ?? null,
    grams,
    nutrients,
    logged_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('meal_log').insert({ ...linha, meal_type: mealType });
  if (!error) return;

  // O app é distribuído por APK e o patch supabase/05_meal_type.sql é aplicado
  // à mão — a ordem entre os dois não é garantida. Se a coluna ainda não
  // existe, registrar o alimento sem o tipo é muito melhor do que impedir o
  // usuário de registrar. Assim que o patch rodar, o caminho normal volta
  // sozinho, sem precisar de nova versão do app.
  const colunaAusente = /meal_type/i.test(error.message) &&
    /column|schema cache|does not exist/i.test(error.message);
  if (!colunaAusente) throw new Error(error.message);

  const { error: erroSemTipo } = await supabase.from('meal_log').insert(linha);
  if (erroSemTipo) throw new Error(erroSemTipo.message);
}

export async function listTodayMealLogs(userId: string): Promise<MealLog[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('meal_log')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay.toISOString())
    // Ascendente: dentro de cada refeição, a ordem cronológica é a que faz
    // sentido para quem lê "o que eu comi no almoço".
    .order('logged_at', { ascending: true });
  if (error) {
    console.warn('Erro ao listar refeições:', error.message);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    foodId: row.food_id,
    foodName: row.food_name,
    foodEmoji: row.food_emoji,
    quantity: row.quantity,
    unit: row.unit,
    grams: row.grams,
    loggedAt: row.logged_at,
    nutrients: row.nutrients ?? {},
    // Se o patch 05_meal_type.sql ainda não foi aplicado, a coluna não existe
    // e o app continua funcionando, tratando tudo como lanche.
    mealType: (row.meal_type ?? 'lanche') as MealType,
  }));
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase.from('meal_log').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function totalDiarioPorNutriente(entries: MealLog[], nutriente: string): number {
  return entries.reduce((total, entry) => total + (entry.nutrients[nutriente] ?? 0), 0);
}

/**
 * Agrupa as refeições do dia por tipo, na ordem cronológica do dia.
 *
 * O agrupamento acontece aqui, em JS, e não na query: um dia inteiro de
 * registros é um conjunto pequeno, e uma consulta só evita cinco idas ao
 * servidor (uma por tipo) que não trariam nenhum ganho. A Home recebe a
 * estrutura pronta e só desenha.
 *
 * Grupos vazios são omitidos — quem não jantou não precisa ver "Jantar".
 */
export function agruparPorTipoDeRefeicao(entries: MealLog[]): { key: MealType; label: string; emoji: string; itens: MealLog[] }[] {
  return TIPOS_REFEICAO.map((tipo) => ({
    ...tipo,
    itens: entries.filter((e) => e.mealType === tipo.key),
  })).filter((grupo) => grupo.itens.length > 0);
}

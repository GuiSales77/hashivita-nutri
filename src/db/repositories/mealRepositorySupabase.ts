import { supabase } from '../../services/supabaseClient';
import { Food } from './foodRepositorySupabase';

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

export async function createMealLog(userId: string, food: Food, quantity: number | undefined, unit: string | undefined, grams: number): Promise<void> {
  const nutrients = calcularNutrientesDoAlimento(food, grams);
  const { error } = await supabase.from('meal_log').insert({
    user_id: userId,
    food_id: food.id,
    food_name: food.name,
    food_emoji: food.emoji,
    quantity: quantity ?? null,
    unit: unit ?? null,
    grams,
    nutrients,
    logged_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function listTodayMealLogs(userId: string): Promise<MealLog[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('meal_log')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay.toISOString())
    .order('logged_at', { ascending: false });
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
  }));
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase.from('meal_log').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function totalDiarioPorNutriente(entries: MealLog[], nutriente: string): number {
  return entries.reduce((total, entry) => total + (entry.nutrients[nutriente] ?? 0), 0);
}

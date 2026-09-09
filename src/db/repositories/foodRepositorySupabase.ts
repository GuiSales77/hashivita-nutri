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

export async function searchFoods(query: string): Promise<Food[]> {
  let request = supabase.from('food').select('*').order('name', { ascending: true }).limit(20);
  if (query.trim()) {
    request = request.ilike('name', `%${query.trim()}%`);
  }
  const { data, error } = await request;
  if (error) {
    console.warn('Erro ao buscar alimentos:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getFoodById(id: string): Promise<Food | null> {
  const { data, error } = await supabase.from('food').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.warn('Erro ao buscar alimento:', error.message);
    return null;
  }
  return data;
}

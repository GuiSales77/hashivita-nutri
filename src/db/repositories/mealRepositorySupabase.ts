import { supabase } from '../../services/supabaseClient';
import { Food } from './foodRepositorySupabase';
import { MealType, TIPOS_REFEICAO, NUTRIENTES_DO_REGISTRO } from '../../theme/theme';

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
  return (data ?? []).map(paraMealLog);
}

function paraMealLog(row: any): MealLog {
  return {
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
  };
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

// ------------------------------------------------------------------ Histórico

export type GrupoDeRefeicao = { key: MealType; label: string; emoji: string; itens: MealLog[] };

export type DiaDoHistorico = {
  /** `AAAA-MM-DD` no fuso do aparelho — é a identidade do dia na lista. */
  dia: string;
  rotulo: string;
  itens: MealLog[];
  grupos: GrupoDeRefeicao[];
  /** Soma de cada um dos nove nutrientes da base, no dia. */
  totais: Record<string, number>;
};

/**
 * A data do dia no fuso de quem usa o app, não em UTC.
 *
 * `logged_at` é gravado em UTC. Usar a data de UTC jogaria tudo que foi
 * registrado depois das 21h no Brasil (UTC-3) para o dia seguinte — a ceia
 * apareceria no dia errado. `getFullYear/getMonth/getDate` já devolvem o
 * horário local, então a conversão acontece sozinha aqui.
 */
function chaveDoDia(iso: string): string {
  const d = new Date(iso);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function rotuloDoDia(iso: string): string {
  const d = new Date(iso);
  const hoje = chaveDoDia(new Date().toISOString());
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const chave = chaveDoDia(iso);
  if (chave === hoje) return 'Hoje';
  if (chave === chaveDoDia(ontem.toISOString())) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function somarNutrientesDoDia(itens: MealLog[]): Record<string, number> {
  const totais: Record<string, number> = {};
  for (const nutriente of NUTRIENTES_DO_REGISTRO) {
    totais[nutriente.key] = totalDiarioPorNutriente(itens, nutriente.key);
  }
  return totais;
}

/**
 * Agrupa uma lista de registros por dia, do mais recente para o mais antigo, e
 * dentro de cada dia por tipo de refeição.
 *
 * Função pura, separada da consulta, para poder ser testada sem banco.
 */
export function agruparPorDia(entries: MealLog[]): DiaDoHistorico[] {
  const porDia = new Map<string, MealLog[]>();
  for (const entry of entries) {
    const chave = chaveDoDia(entry.loggedAt);
    const lista = porDia.get(chave);
    if (lista) lista.push(entry);
    else porDia.set(chave, [entry]);
  }

  return [...porDia.entries()]
    // Ordem decrescente por data: o dia de hoje é o que interessa primeiro.
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([dia, itens]) => {
      // Dentro do dia, cronológico — a consulta pode vir em qualquer ordem.
      const ordenados = [...itens].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
      return {
        dia,
        rotulo: rotuloDoDia(ordenados[0].loggedAt),
        itens: ordenados,
        grupos: agruparPorTipoDeRefeicao(ordenados),
        totais: somarNutrientesDoDia(ordenados),
      };
    });
}

/**
 * Histórico dos últimos `dias` dias (o dia de hoje conta como um deles).
 *
 * A janela começa à meia-noite local do primeiro dia, para que o recorte
 * coincida com o que a pessoa chama de "últimos 30 dias" no calendário dela.
 */
export async function listarHistorico(userId: string, dias = 30): Promise<DiaDoHistorico[]> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from('meal_log')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', inicio.toISOString())
      .order('logged_at', { ascending: false });
    if (error) {
      console.warn('Erro ao carregar o histórico:', error.message);
      return [];
    }
    return agruparPorDia((data ?? []).map(paraMealLog));
  } catch (e) {
    // Mesmo motivo do foodRepository: o supabase-js lança em falha de rede.
    console.warn('Falha de rede ao carregar o histórico:', e);
    return [];
  }
}

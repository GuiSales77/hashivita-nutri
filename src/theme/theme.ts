export const colors = {
  green900: '#1B4332',
  green700: '#2D6A4F',
  green500: '#52B788',
  green300: '#95D5B2',
  green100: '#D8F3DC',
  paper: '#F8FBF9',
  white: '#FFFFFF',
  ink700: '#22302A',
  ink500: '#5B6E64',
  amber500: '#E2A73E',
  amberBg: '#FBF0DB',
  border: '#E3EFE7',
};

export const radius = { sm: 12, md: 16, lg: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const COMORBIDADES = [
  { key: 'diabetes_tipo1', label: 'Diabetes tipo 1' },
  { key: 'diabetes_tipo2', label: 'Diabetes tipo 2' },
  { key: 'diabetes_gestacional', label: 'Diabetes gestacional' },
  { key: 'pressao_alta', label: 'Pressão alta' },
  { key: 'pressao_baixa', label: 'Pressão baixa' },
] as const;

// As metas diárias vivem em src/domain/metasNutricionais.ts, porque dependem do
// sexo e da idade da pessoa. Antes havia aqui um bloco METAS_PADRAO com um valor
// único para todo mundo (ferro 14 mg, zinco 9 mg) — errado para a maioria dos
// perfis e sem fonte verificável. Foi removido de propósito: deixar os números
// antigos no projeto era convite para alguém reusá-los.

export type MealType = 'cafe_da_manha' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

// A ordem aqui é a ordem cronológica natural do dia, e é ela que a Home usa
// para montar os grupos — não a ordem em que o usuário registrou.
export const TIPOS_REFEICAO: { key: MealType; label: string; emoji: string }[] = [
  { key: 'cafe_da_manha', label: 'Café da manhã', emoji: '🌅' },
  { key: 'almoco', label: 'Almoço', emoji: '🍽️' },
  { key: 'lanche', label: 'Lanche', emoji: '🥪' },
  { key: 'jantar', label: 'Jantar', emoji: '🌙' },
  { key: 'ceia', label: 'Ceia', emoji: '🌜' },
];

/** Pré-seleciona o tipo pelo horário, para o caso comum ser só confirmar. */
export function sugerirTipoRefeicao(agora: Date = new Date()): MealType {
  const hora = agora.getHours();
  if (hora < 10) return 'cafe_da_manha';
  if (hora < 14) return 'almoco';
  if (hora < 18) return 'lanche';
  if (hora < 22) return 'jantar';
  return 'ceia';
}

/**
 * Todos os nutrientes que a tabela de alimentos realmente carrega, na ordem em
 * que o histórico os mostra.
 *
 * São nove colunas, e entre as vitaminas existe apenas a D — a base de
 * alimentos não traz B12, folato, C, A, E nem K. O histórico diz isso na tela
 * em vez de deixar a pessoa supor que a lista é completa: inventar colunas
 * daria somas que parecem exatas e não são.
 */
export const NUTRIENTES_DO_REGISTRO: { key: string; label: string; unidade: string; casas: number }[] = [
  { key: 'energia_kcal', label: 'Energia', unidade: 'kcal', casas: 0 },
  { key: 'proteina_g', label: 'Proteínas', unidade: 'g', casas: 1 },
  { key: 'carboidrato_g', label: 'Carboidratos', unidade: 'g', casas: 1 },
  { key: 'sodium_mg', label: 'Sódio', unidade: 'mg', casas: 0 },
  { key: 'selenium_mcg', label: 'Selênio', unidade: 'mcg', casas: 1 },
  { key: 'iodine_mcg', label: 'Iodo', unidade: 'mcg', casas: 1 },
  { key: 'vitamin_d_mcg', label: 'Vitamina D', unidade: 'mcg', casas: 1 },
  { key: 'zinc_mg', label: 'Zinco', unidade: 'mg', casas: 1 },
  { key: 'iron_mg', label: 'Ferro', unidade: 'mg', casas: 1 },
];

export type NutrienteKey = 'selenium_mcg' | 'iodine_mcg' | 'vitamin_d_mcg' | 'zinc_mg' | 'iron_mg';

export const NUTRIENTES_PRIORITARIOS: { key: NutrienteKey; label: string; unidade: string }[] = [
  { key: 'selenium_mcg', label: 'Selênio', unidade: 'mcg' },
  { key: 'iodine_mcg', label: 'Iodo', unidade: 'mcg' },
  { key: 'vitamin_d_mcg', label: 'Vitamina D', unidade: 'mcg' },
  { key: 'zinc_mg', label: 'Zinco', unidade: 'mg' },
  { key: 'iron_mg', label: 'Ferro', unidade: 'mg' },
];

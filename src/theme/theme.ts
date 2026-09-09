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

// Metas diárias de referência — ver docs/03-Calculo-Nutricional.md para fontes
// (IDR ANVISA RDC 269/2005, ajustado pela pesquisa específica de Hashimoto).
export const METAS_PADRAO = {
  selenium_mcg: 55,
  iodine_mcg: 150,
  vitamin_d_mcg: 15,
  zinc_mg: 9,
  iron_mg: 14,
};

export const LIMITES_SUPERIORES = {
  selenium_mcg: 400,
  iodine_mcg: 1100,
  vitamin_d_mcg: 100,
  zinc_mg: 40,
  iron_mg: 45,
};

export const META_SODIO_HIPERTENSAO_MG = 2000;

export type NutrienteKey = 'selenium_mcg' | 'iodine_mcg' | 'vitamin_d_mcg' | 'zinc_mg' | 'iron_mg';

export const NUTRIENTES_PRIORITARIOS: { key: NutrienteKey; label: string; unidade: string }[] = [
  { key: 'selenium_mcg', label: 'Selênio', unidade: 'mcg' },
  { key: 'iodine_mcg', label: 'Iodo', unidade: 'mcg' },
  { key: 'vitamin_d_mcg', label: 'Vitamina D', unidade: 'mcg' },
  { key: 'zinc_mg', label: 'Zinco', unidade: 'mg' },
  { key: 'iron_mg', label: 'Ferro', unidade: 'mg' },
];

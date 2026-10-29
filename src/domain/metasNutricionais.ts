import { NutrienteKey } from '../theme/theme';

/**
 * Metas diárias por perfil, a partir das tabelas do Manual MSD (fonte primária:
 * Institute of Medicine — Dietary Reference Intakes).
 *
 * - Minerais: "Diretrizes para ingestão diária de oligoelementos"
 *   https://www.msdmanuals.com/pt/profissional/multimedia/table/diretrizes-para-ingestão-diária-de-oligoelementos
 * - Vitaminas: "Ingestões diárias recomendadas de vitaminas"
 *   https://www.msdmanuals.com/pt/profissional/multimedia/table/ingestões-diárias-recomendadas-de-vitaminas
 *
 * Antes deste módulo o app usava um valor único para todo mundo, o que estava
 * errado para a maioria dos perfis: ferro 14 mg para todos, quando a referência
 * é 18 mg para mulher de 19 a 50 anos e 8 mg para homem adulto.
 *
 * ⚠️ IDR é referência populacional, pensada para cobrir 97–98% das pessoas
 * saudáveis. Não é prescrição. Quem prescreve é o profissional que acompanha a
 * pessoa — ainda mais numa condição de tireoide em tratamento.
 */

export const FONTE_CURTA = 'Manual MSD / Institute of Medicine (DRI)';

export type Sexo = 'homem' | 'mulher';

export type PerfilNutricional = {
  sex: Sexo | null;
  age: number | null;
  ageRange: 'ate-18' | '19-50' | '50+' | null;
  hasHashimoto: boolean;
  hashimotoMedicationTime: string | null;
  healthConditions: string[];
};

export type MetaNutriente = {
  key: NutrienteKey;
  label: string;
  unidade: string;
  meta: number;
  limiteSuperior: number | null;
  /** Como esta linha da tabela foi escolhida, para mostrar ao usuário. */
  base: string;
};

/** Faixas da tabela do MSD. A do app ('ate-18' etc.) é mais grossa que a da fonte. */
type Faixa = '9-13' | '14-18' | '19-50' | '51+';

/**
 * A idade em anos é mais precisa que a faixa escolhida no onboarding, então ela
 * manda quando existe. A fonte separa em 51+, o onboarding em 50+ — para quem
 * só marcou a faixa, 50+ cai na linha de 51+.
 */
function faixaDe(perfil: PerfilNutricional): Faixa {
  const { age, ageRange } = perfil;
  if (age != null && age > 0) {
    if (age <= 13) return '9-13';
    if (age <= 18) return '14-18';
    if (age <= 50) return '19-50';
    return '51+';
  }
  if (ageRange === 'ate-18') return '14-18';
  if (ageRange === '50+') return '51+';
  return '19-50';
}

const ROTULO_FAIXA: Record<Faixa, string> = {
  '9-13': '9 a 13 anos',
  '14-18': '14 a 18 anos',
  '19-50': '19 a 50 anos',
  '51+': '51 anos ou mais',
};

// ---------------------------------------------------------------- Minerais
// Tabela de oligoelementos do MSD. Selênio e iodo não variam por sexo.
const SELENIO_MCG: Record<Faixa, number> = { '9-13': 40, '14-18': 55, '19-50': 55, '51+': 55 };
const IODO_MCG: Record<Faixa, number> = { '9-13': 120, '14-18': 150, '19-50': 150, '51+': 150 };

const FERRO_MG: Record<Sexo, Record<Faixa, number>> = {
  homem: { '9-13': 8, '14-18': 11, '19-50': 8, '51+': 8 },
  mulher: { '9-13': 8, '14-18': 15, '19-50': 18, '51+': 8 },
};

const ZINCO_MG: Record<Sexo, Record<Faixa, number>> = {
  homem: { '9-13': 8, '14-18': 11, '19-50': 11, '51+': 11 },
  mulher: { '9-13': 8, '14-18': 9, '19-50': 8, '51+': 8 },
};

// --------------------------------------------------------------- Vitaminas
// Tabela de vitaminas do MSD, em UI. 200 UI = 5 mcg de colecalciferol, então
// 600 UI = 15 mcg e 800 UI = 20 mcg. A própria tabela indica 800 UI para ≥ 70.
const VITAMINA_D_MCG_PADRAO = 15;
const VITAMINA_D_MCG_IDOSO = 20;

/**
 * Limites superiores toleráveis (UL) para adultos. Valores de referência do
 * IOM; o MSD confirma 40 mg/dia para o zinco. A tabela de UL por faixa etária
 * não está nas páginas consultadas, então estes são os valores de adulto —
 * para menores de 18 anos o limite real é mais baixo.
 */
const LIMITES_ADULTO: Record<NutrienteKey, number> = {
  selenium_mcg: 400,
  iodine_mcg: 1100,
  vitamin_d_mcg: 100,
  zinc_mg: 40,
  iron_mg: 45,
};

/** Sódio: 2000 mg/dia é a recomendação para quem tem pressão alta. */
export const META_SODIO_HIPERTENSAO_MG = 2000;

export function metasPara(perfil: PerfilNutricional): MetaNutriente[] {
  const faixa = faixaDe(perfil);
  const sexo: Sexo = perfil.sex ?? 'mulher'; // sem sexo informado, usa o valor mais alto de ferro
  const rotulo = ROTULO_FAIXA[faixa];
  const porSexo = `${sexo === 'homem' ? 'Homens' : 'Mulheres'}, ${rotulo}`;
  const idadeEmAnos = perfil.age ?? null;

  const vitaminaD = idadeEmAnos != null && idadeEmAnos >= 70 ? VITAMINA_D_MCG_IDOSO : VITAMINA_D_MCG_PADRAO;

  return [
    {
      key: 'selenium_mcg',
      label: 'Selênio',
      unidade: 'mcg',
      meta: SELENIO_MCG[faixa],
      limiteSuperior: LIMITES_ADULTO.selenium_mcg,
      base: rotulo,
    },
    {
      key: 'iodine_mcg',
      label: 'Iodo',
      unidade: 'mcg',
      meta: IODO_MCG[faixa],
      limiteSuperior: LIMITES_ADULTO.iodine_mcg,
      base: rotulo,
    },
    {
      key: 'vitamin_d_mcg',
      label: 'Vitamina D',
      unidade: 'mcg',
      meta: vitaminaD,
      limiteSuperior: LIMITES_ADULTO.vitamin_d_mcg,
      base: vitaminaD === VITAMINA_D_MCG_IDOSO ? '70 anos ou mais' : 'Adultos',
    },
    {
      key: 'zinc_mg',
      label: 'Zinco',
      unidade: 'mg',
      meta: ZINCO_MG[sexo][faixa],
      limiteSuperior: LIMITES_ADULTO.zinc_mg,
      base: porSexo,
    },
    {
      key: 'iron_mg',
      label: 'Ferro',
      unidade: 'mg',
      meta: FERRO_MG[sexo][faixa],
      limiteSuperior: LIMITES_ADULTO.iron_mg,
      base: porSexo,
    },
  ];
}

// ------------------------------------------------- Acompanhamentos por condição

export type Acompanhamento = {
  key: 'sodio' | 'carboidrato';
  titulo: string;
  motivo: string;
  meta: number | null;
  unidade: string;
};

export function acompanhamentosPara(perfil: PerfilNutricional): Acompanhamento[] {
  const fora: Acompanhamento[] = [];
  const condicoes = perfil.healthConditions ?? [];

  if (condicoes.includes('pressao_alta')) {
    fora.push({
      key: 'sodio',
      titulo: 'Sódio',
      motivo: 'Você marcou pressão alta',
      meta: META_SODIO_HIPERTENSAO_MG,
      unidade: 'mg',
    });
  }
  if (condicoes.some((c) => c.startsWith('diabetes'))) {
    fora.push({
      key: 'carboidrato',
      titulo: 'Carboidratos hoje',
      // Sem meta: a quantidade de carboidrato no diabetes é individual e vem do
      // profissional que acompanha. Inventar um número aqui seria pior que não ter.
      motivo: 'Você marcou diabetes — acompanhe com quem te atende',
      meta: null,
      unidade: 'g',
    });
  }
  return fora;
}

// --------------------------------------------- Levotiroxina x absorção

/**
 * O MSD lista cálcio, ferro e magnésio entre as substâncias que diminuem a
 * absorção da levotiroxina. A página fala de medicamentos e suplementos, não de
 * alimentos — então o aviso aqui é sobre proximidade de horário, não uma
 * proibição, e está escrito como algo a conferir com quem acompanha a pessoa.
 *
 * O horário da medicação já era coletado no onboarding e nunca tinha sido usado.
 */
export const JANELA_MEDICACAO_MINUTOS = 60;
export const FERRO_MG_RELEVANTE = 2;

function minutosDe(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutosAteMedicacao(horarioMedicacao: string, quando: Date): number | null {
  const alvo = minutosDe(horarioMedicacao);
  if (alvo == null) return null;
  const agora = quando.getHours() * 60 + quando.getMinutes();
  const bruto = Math.abs(agora - alvo);
  return Math.min(bruto, 24 * 60 - bruto); // trata a virada da meia-noite
}

export type AvisoMedicacao = { foodName: string; motivo: string };

/**
 * Devolve um aviso por refeição registrada perto do horário da medicação cujo
 * conteúdo possa interferir na absorção.
 */
export function avisosDeMedicacao(
  perfil: PerfilNutricional,
  refeicoes: { foodName: string; loggedAt: string; nutrients: Record<string, number>; categoria?: string | null }[]
): AvisoMedicacao[] {
  if (!perfil.hasHashimoto || !perfil.hashimotoMedicationTime) return [];

  const avisos: AvisoMedicacao[] = [];
  for (const r of refeicoes) {
    const distancia = minutosAteMedicacao(perfil.hashimotoMedicationTime, new Date(r.loggedAt));
    if (distancia == null || distancia > JANELA_MEDICACAO_MINUTOS) continue;

    const ferro = Number(r.nutrients?.iron_mg ?? 0);
    if (ferro >= FERRO_MG_RELEVANTE) {
      avisos.push({
        foodName: r.foodName,
        motivo: `${ferro.toFixed(1)} mg de ferro, a ${distancia} min da medicação`,
      });
    }
  }
  return avisos;
}

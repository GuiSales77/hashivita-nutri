import React, { useState } from 'react';
import { View } from 'react-native';
import { LabeledInput, Chip, SectionLabel } from './ui';
import { COMORBIDADES } from '../theme/theme';
import type { AppUser } from '../context/AuthContext';

/**
 * Campos de saúde compartilhados entre o onboarding e a edição no Perfil.
 *
 * As duas telas fazem a mesma pergunta e gravam nas mesmas colunas — a única
 * diferença é que a edição chega com os valores já preenchidos e o onboarding
 * chega em branco. Por isso o formulário mora aqui, e não duplicado nas duas.
 */

export type Sexo = 'homem' | 'mulher';
export type FaixaEtaria = 'ate-18' | '19-50' | '50+';

export type HealthInfoForm = {
  idade: string;
  setIdade: (v: string) => void;
  sexo: Sexo | null;
  setSexo: (v: Sexo) => void;
  faixaEtaria: FaixaEtaria | null;
  setFaixaEtaria: (v: FaixaEtaria) => void;
  tomaMedicacao: boolean | null;
  setTomaMedicacao: (v: boolean) => void;
  horario: string;
  setHorario: (v: string) => void;
  comorbidades: string[];
  toggleComorbidade: (key: string) => void;
};

/** `inicial` vem preenchido na edição e vazio no onboarding. */
export function useHealthInfoForm(inicial?: Partial<AppUser> | null): HealthInfoForm {
  const [idade, setIdade] = useState(inicial?.age != null ? String(inicial.age) : '');
  const [sexo, setSexo] = useState<Sexo | null>(inicial?.sex ?? null);
  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtaria | null>(inicial?.ageRange ?? null);
  const [tomaMedicacao, setTomaMedicacao] = useState<boolean | null>(
    inicial?.hasHashimoto != null ? inicial.hasHashimoto : null
  );
  const [horario, setHorario] = useState(inicial?.hashimotoMedicationTime ?? '07:00');
  const [comorbidades, setComorbidades] = useState<string[]>(inicial?.healthConditions ?? []);

  function toggleComorbidade(key: string) {
    setComorbidades((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return {
    idade, setIdade,
    sexo, setSexo,
    faixaEtaria, setFaixaEtaria,
    tomaMedicacao, setTomaMedicacao,
    horario, setHorario,
    comorbidades, toggleComorbidade,
  };
}

type Validacao =
  | { ok: true; dados: Partial<AppUser> }
  | { ok: false; titulo: string; mensagem: string };

/** Mesmas regras nas duas telas: campo faltando vira alerta, não um save pela metade. */
export function validarHealthInfo(form: HealthInfoForm): Validacao {
  const idadeNum = parseInt(form.idade, 10);
  if (!idadeNum || idadeNum <= 0 || idadeNum > 120) {
    return { ok: false, titulo: 'Idade inválida', mensagem: 'Digite sua idade em anos.' };
  }
  if (!form.sexo) {
    return { ok: false, titulo: 'Selecione o sexo', mensagem: 'Isso ajusta suas metas nutricionais.' };
  }
  if (!form.faixaEtaria) {
    return { ok: false, titulo: 'Selecione a faixa etária', mensagem: 'Escolha uma das opções.' };
  }
  if (form.tomaMedicacao === null) {
    return { ok: false, titulo: 'Responda sobre a medicação', mensagem: 'Você toma remédio para Hashimoto?' };
  }
  return {
    ok: true,
    dados: {
      age: idadeNum,
      sex: form.sexo,
      ageRange: form.faixaEtaria,
      hasHashimoto: form.tomaMedicacao,
      hashimotoMedicationTime: form.tomaMedicacao ? form.horario : null,
      healthConditions: form.comorbidades,
    },
  };
}

export function HealthInfoFields({ form }: { form: HealthInfoForm }) {
  return (
    <>
      <LabeledInput
        label="IDADE"
        value={form.idade}
        onChangeText={form.setIdade}
        placeholder="32"
        keyboardType="number-pad"
      />

      <SectionLabel>Sexo</SectionLabel>
      <View style={{ flexDirection: 'row' }}>
        <Chip label="Homem" active={form.sexo === 'homem'} onPress={() => form.setSexo('homem')} />
        <Chip label="Mulher" active={form.sexo === 'mulher'} onPress={() => form.setSexo('mulher')} />
      </View>

      <SectionLabel>Faixa etária</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Até 18" active={form.faixaEtaria === 'ate-18'} onPress={() => form.setFaixaEtaria('ate-18')} />
        <Chip label="19–50" active={form.faixaEtaria === '19-50'} onPress={() => form.setFaixaEtaria('19-50')} />
        <Chip label="50+" active={form.faixaEtaria === '50+'} onPress={() => form.setFaixaEtaria('50+')} />
      </View>

      <SectionLabel>Toma medicação para Hashimoto?</SectionLabel>
      <View style={{ flexDirection: 'row' }}>
        <Chip label="Sim" active={form.tomaMedicacao === true} onPress={() => form.setTomaMedicacao(true)} />
        <Chip label="Não" active={form.tomaMedicacao === false} onPress={() => form.setTomaMedicacao(false)} />
      </View>
      {form.tomaMedicacao && (
        <View style={{ marginTop: 10 }}>
          <LabeledInput label="HORÁRIO (HH:MM)" value={form.horario} onChangeText={form.setHorario} placeholder="07:00" />
        </View>
      )}

      <SectionLabel>Possui outra condição de saúde?</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {COMORBIDADES.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            active={form.comorbidades.includes(c.key)}
            onPress={() => form.toggleComorbidade(c.key)}
          />
        ))}
      </View>
    </>
  );
}

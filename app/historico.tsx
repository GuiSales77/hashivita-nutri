import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, NUTRIENTES_DO_REGISTRO } from '../src/theme/theme';
import { metasPara, FONTE_CURTA } from '../src/domain/metasNutricionais';
import { Card, SectionLabel } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { listarHistorico, DiaDoHistorico } from '../src/db/repositories/mealRepositorySupabase';

const DIAS_DA_JANELA = 30;

export default function HistoricoScreen() {
  const { appUser, session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dias, setDias] = useState<DiaDoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const dados = await listarHistorico(session.user.id, DIAS_DA_JANELA);
    setDias(dados);
    // O dia mais recente já vem aberto: é o que a pessoa quer ver primeiro.
    setAbertos(dados.length > 0 ? { [dados[0].dia]: true } : {});
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // As metas dependem do perfil (sexo, idade, condições), igual à Home — é o
  // mesmo cálculo, para que o histórico não mostre um alvo diferente do que a
  // pessoa viu no dia.
  const metas = useMemo(
    () =>
      metasPara({
        sex: appUser?.sex ?? null,
        age: appUser?.age ?? null,
        ageRange: appUser?.ageRange ?? null,
        hasHashimoto: appUser?.hasHashimoto ?? false,
        hashimotoMedicationTime: appUser?.hashimotoMedicationTime ?? null,
        healthConditions: appUser?.healthConditions ?? [],
      }),
    [appUser]
  );
  const metaPorNutriente = useMemo(
    () => new Map(metas.map((m) => [m.key as string, m])),
    [metas]
  );

  const totalDeRegistros = dias.reduce((soma, dia) => soma + dia.itens.length, 0);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.green700} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 13.5, color: colors.green700, fontWeight: '600' }}>‹ Voltar</Text>
      </Pressable>

      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900 }}>Histórico diário</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, marginTop: 2 }}>
        Últimos {DIAS_DA_JANELA} dias · {dias.length} {dias.length === 1 ? 'dia com registro' : 'dias com registro'} ·{' '}
        {totalDeRegistros} {totalDeRegistros === 1 ? 'alimento' : 'alimentos'}
      </Text>

      {dias.length === 0 && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>Nada registrado ainda</Text>
          <Text style={{ fontSize: 12.5, color: colors.ink500, marginTop: 4, lineHeight: 18 }}>
            Assim que você registrar alimentos, cada dia aparece aqui com tudo o que foi consumido e a soma dos
            nutrientes.
          </Text>
        </Card>
      )}

      {dias.map((dia) => {
        const aberto = abertos[dia.dia] === true;
        return (
          <View key={dia.dia} style={{ marginTop: spacing.md }}>
            <Pressable
              onPress={() => setAbertos((atual) => ({ ...atual, [dia.dia]: !atual[dia.dia] }))}
              accessibilityRole="button"
              accessibilityLabel={`${aberto ? 'Recolher' : 'Abrir'} o dia ${dia.rotulo}`}
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.green900, textTransform: 'capitalize' }}>
                  {dia.rotulo}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 2 }}>
                  {dia.itens.length} {dia.itens.length === 1 ? 'alimento' : 'alimentos'} ·{' '}
                  {dia.totais.energia_kcal.toFixed(0)} kcal
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.ink500 }}>{aberto ? '▲' : '▼'}</Text>
            </Pressable>

            {aberto && (
              <View style={{ paddingTop: spacing.xs }}>
                <SectionLabel>Nutrientes consumidos no dia</SectionLabel>
                <Card>
                  {NUTRIENTES_DO_REGISTRO.map((nutriente, indice) => {
                    const total = dia.totais[nutriente.key] ?? 0;
                    const meta = metaPorNutriente.get(nutriente.key);
                    const acimaDoLimite =
                      meta?.limiteSuperior != null && total > meta.limiteSuperior;
                    return (
                      <View
                        key={nutriente.key}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 7,
                          borderTopWidth: indice === 0 ? 0 : 1,
                          borderTopColor: colors.border,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 13, color: colors.ink700 }}>{nutriente.label}</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: acimaDoLimite ? colors.amber500 : colors.ink700,
                          }}
                        >
                          {total.toFixed(nutriente.casas)} {nutriente.unidade}
                          {acimaDoLimite ? ' ⚠️' : ''}
                        </Text>
                        {/* A meta só aparece onde existe uma: a base de alimentos
                            tem nove colunas, e a tabela do MSD dá alvo para cinco
                            delas. Inventar um alvo para energia ou carboidrato
                            seria dar um número sem fonte. */}
                        <Text style={{ width: 86, textAlign: 'right', fontSize: 11.5, color: colors.ink500 }}>
                          {meta ? `meta ${meta.meta}` : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </Card>

                <SectionLabel>Alimentos do dia</SectionLabel>
                {dia.grupos.map((grupo) => (
                  <View key={grupo.key}>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '700',
                        color: colors.green900,
                        marginTop: spacing.sm,
                        marginBottom: spacing.xs,
                      }}
                    >
                      {grupo.emoji} {grupo.label}
                    </Text>
                    {grupo.itens.map((item) => (
                      <Card key={item.id}>
                        <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>
                          {item.foodEmoji ? `${item.foodEmoji} ` : ''}
                          {item.foodName}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 2 }}>
                          {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : `${item.grams}g`}
                          {'  ·  '}
                          {new Date(item.loggedAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Card>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={{ fontSize: 11, color: colors.ink500, marginTop: spacing.xl, lineHeight: 16 }}>
        As somas vêm dos valores por 100 g da tabela de alimentos, aplicados à quantidade registrada. Entre as
        vitaminas, a base traz apenas a vitamina D — B12, folato, C, A, E e K não estão nos dados, então não
        aparecem aqui. As metas seguem o {FONTE_CURTA}, pelo seu perfil.
      </Text>
    </ScrollView>
  );
}

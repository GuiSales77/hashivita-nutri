import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { metasPara, acompanhamentosPara, avisosDeMedicacao } from '../../src/domain/metasNutricionais';
import { Card, NutrientBar, SectionLabel } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { listTodayMealLogs, totalDiarioPorNutriente, deleteMealLog, agruparPorTipoDeRefeicao, MealLog } from '../../src/db/repositories/mealRepositorySupabase';

export default function HomeScreen() {
  const { appUser, session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const data = await listTodayMealLogs(session.user.id);
    setEntries(data);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const primeiroNome = appUser?.fullName?.split(' ')[0] ?? '';
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const grupos = agruparPorTipoDeRefeicao(entries);

  // Metas vindas das tabelas do MSD, escolhidas pelo sexo e pela idade do perfil
  // — antes o app usava um valor único para todo mundo.
  const perfil = {
    sex: appUser?.sex ?? null,
    age: appUser?.age ?? null,
    ageRange: appUser?.ageRange ?? null,
    hasHashimoto: appUser?.hasHashimoto ?? false,
    hashimotoMedicationTime: appUser?.hashimotoMedicationTime ?? null,
    healthConditions: appUser?.healthConditions ?? [],
  };
  const metas = metasPara(perfil);
  const acompanhamentos = acompanhamentosPara(perfil);
  const avisosMedicacao = avisosDeMedicacao(perfil, entries);

  // Confirmação sempre: os cartões ficam próximos e a exclusão não tem volta.
  function handleRemove(entry: MealLog) {
    Alert.alert('Remover alimento', `Remover ${entry.foodName} do registro de hoje?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removerConfirmado(entry.id) },
    ]);
  }

  async function removerConfirmado(id: string) {
    setRemovendoId(id);
    try {
      await deleteMealLog(id);
    } catch (e: any) {
      // Sem isso o item some da lista e reaparece no reload, sem explicação.
      Alert.alert('Não foi possível remover', e?.message ?? 'Verifique sua conexão e tente de novo.');
      return;
    } finally {
      setRemovendoId(null);
    }
    reload();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.green700} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: 100 }}>
      <Text style={{ fontSize: 26, fontWeight: '600', color: colors.green900 }}>Olá, {primeiroNome} 🌱</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, marginBottom: 8, textTransform: 'capitalize' }}>{hoje}</Text>

      <SectionLabel>Seus nutrientes hoje</SectionLabel>
      {metas.map((m) => {
        const total = totalDiarioPorNutriente(entries, m.key);
        const pct = total / m.meta;
        const passouLimite = m.limiteSuperior ? total > m.limiteSuperior : false;
        return (
          <NutrientBar
            key={m.key}
            label={m.label}
            pct={pct}
            valueLabel={`${total.toFixed(1)}/${m.meta} ${m.unidade}${passouLimite ? ' ⚠️' : ''}`}
            color={passouLimite ? colors.amber500 : pct >= 0.8 ? colors.green500 : colors.amber500}
          />
        );
      })}

      {avisosMedicacao.length > 0 && (
        <>
          <SectionLabel>Perto do horário da sua medicação</SectionLabel>
          <Card style={{ backgroundColor: colors.amberBg, borderColor: colors.amber500 }}>
            <Text style={{ fontSize: 13, color: colors.ink700, lineHeight: 19 }}>
              O Manual MSD lista <Text style={{ fontWeight: '700' }}>cálcio, ferro e magnésio</Text> entre as
              substâncias que diminuem a absorção da levotiroxina. Estes registros ficaram perto das{' '}
              {appUser?.hashimotoMedicationTime}:
            </Text>
            {avisosMedicacao.map((aviso, i) => (
              <Text key={i} style={{ fontSize: 12.5, color: colors.ink700, marginTop: 6 }}>
                • {aviso.foodName} — {aviso.motivo}
              </Text>
            ))}
            <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 8, lineHeight: 16 }}>
              Espaçar o horário é algo a combinar com quem acompanha seu tratamento. Isto é um lembrete, não
              uma orientação médica.
            </Text>
          </Card>
        </>
      )}

      {acompanhamentos.length > 0 && (
        <>
          <SectionLabel>Acompanhamento extra (pelo seu perfil)</SectionLabel>
          {acompanhamentos.map((a) => {
            const total = totalDiarioPorNutriente(entries, a.key === 'sodio' ? 'sodium_mg' : 'carboidrato_g');
            if (a.meta == null) {
              // Sem meta de referência: mostra o total, sem fingir que existe um alvo.
              return (
                <Card key={a.key}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>{a.titulo}</Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.green900, marginTop: 4 }}>
                    {total.toFixed(1)}{a.unidade}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 4 }}>{a.motivo}</Text>
                </Card>
              );
            }
            return (
              <NutrientBar
                key={a.key}
                label={a.titulo}
                pct={total / a.meta}
                valueLabel={`${total.toFixed(0)}/${a.meta} ${a.unidade}`}
                color={total > a.meta ? colors.amber500 : colors.green500}
              />
            );
          })}
        </>
      )}

      <SectionLabel>Refeições de hoje</SectionLabel>
      {entries.length === 0 && (
        <Card>
          <Text style={{ color: colors.ink500, fontSize: 13 }}>Nenhum alimento registrado ainda hoje.</Text>
        </Card>
      )}
      {grupos.map((grupo) => (
        <View key={grupo.key}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.green900, marginTop: spacing.md, marginBottom: spacing.xs }}>
            {grupo.emoji} {grupo.label}
          </Text>
          {grupo.itens.map((entry) => (
            <Card key={entry.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>
                    {entry.foodEmoji ? `${entry.foodEmoji} ` : ''}{entry.foodName}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.ink500 }}>
                    {entry.quantity ? `${entry.quantity} ${entry.unit ?? ''}` : `${entry.grams}g`}
                    {'  ·  '}
                    {new Date(entry.loggedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Lixeira visível. Antes a exclusão era um toque longo sem
                    nenhuma indicação de que existia. */}
                <Pressable
                  onPress={() => handleRemove(entry)}
                  disabled={removendoId === entry.id}
                  hitSlop={12}
                  accessibilityLabel={`Remover ${entry.foodName}`}
                  style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
                >
                  {removendoId === entry.id ? (
                    <ActivityIndicator color={colors.ink500} size="small" />
                  ) : (
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  )}
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      ))}

      <Pressable
        onPress={() => router.push('/add-food')}
        style={{ backgroundColor: colors.green700, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 8 }}
      >
        <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700', marginRight: 6 }}>+</Text>
        <Text style={{ color: colors.white, fontSize: 14.5, fontWeight: '600' }}>Adicionar alimento</Text>
      </Pressable>
    </ScrollView>
  );
}

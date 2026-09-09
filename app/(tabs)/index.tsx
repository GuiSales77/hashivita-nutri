import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, NUTRIENTES_PRIORITARIOS, METAS_PADRAO, LIMITES_SUPERIORES, META_SODIO_HIPERTENSAO_MG } from '../../src/theme/theme';
import { Card, NutrientBar, SectionLabel } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { listTodayMealLogs, totalDiarioPorNutriente, deleteMealLog, MealLog } from '../../src/db/repositories/mealRepositorySupabase';

export default function HomeScreen() {
  const { appUser, session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

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
  const temPressaoAlta = appUser?.healthConditions.includes('pressao_alta');
  const temDiabetes = appUser?.healthConditions.some((c) => c.startsWith('diabetes'));

  async function handleRemove(id: string) {
    await deleteMealLog(id);
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
      {NUTRIENTES_PRIORITARIOS.map((n) => {
        const total = totalDiarioPorNutriente(entries, n.key);
        const meta = METAS_PADRAO[n.key];
        const limite = LIMITES_SUPERIORES[n.key as keyof typeof LIMITES_SUPERIORES];
        const pct = total / meta;
        const passouLimite = limite ? total > limite : false;
        return (
          <NutrientBar
            key={n.key}
            label={n.label}
            pct={pct}
            valueLabel={`${total.toFixed(1)}/${meta} ${n.unidade}${passouLimite ? ' ⚠️' : ''}`}
            color={passouLimite ? colors.amber500 : pct >= 0.8 ? colors.green500 : colors.amber500}
          />
        );
      })}

      {(temPressaoAlta || temDiabetes) && (
        <>
          <SectionLabel>Acompanhamento extra (pelo seu perfil)</SectionLabel>
          {temPressaoAlta && (
            <NutrientBar
              label="Sódio"
              pct={totalDiarioPorNutriente(entries, 'sodium_mg') / META_SODIO_HIPERTENSAO_MG}
              valueLabel={`${totalDiarioPorNutriente(entries, 'sodium_mg').toFixed(0)}/${META_SODIO_HIPERTENSAO_MG} mg`}
              color={totalDiarioPorNutriente(entries, 'sodium_mg') > META_SODIO_HIPERTENSAO_MG ? colors.amber500 : colors.green500}
            />
          )}
          {temDiabetes && (
            <Card>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>Carboidratos hoje</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.green900, marginTop: 4 }}>
                {totalDiarioPorNutriente(entries, 'carboidrato_g').toFixed(1)}g
              </Text>
            </Card>
          )}
        </>
      )}

      <SectionLabel>Refeições de hoje</SectionLabel>
      {entries.length === 0 && (
        <Card>
          <Text style={{ color: colors.ink500, fontSize: 13 }}>Nenhum alimento registrado ainda hoje.</Text>
        </Card>
      )}
      {entries.map((entry) => (
        <Pressable key={entry.id} onLongPress={() => handleRemove(entry.id)}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>
                  {entry.foodEmoji ? `${entry.foodEmoji} ` : ''}{entry.foodName}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.ink500 }}>
                  {entry.quantity ? `${entry.quantity} ${entry.unit ?? ''}` : `${entry.grams}g`}
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: colors.ink500 }}>
                {new Date(entry.loggedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </Card>
        </Pressable>
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

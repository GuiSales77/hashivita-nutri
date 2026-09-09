import React, { useState } from 'react';
import { Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../src/theme/theme';
import { PrimaryButton } from '../src/components/ui';
import { HealthInfoFields, useHealthInfoForm, validarHealthInfo } from '../src/components/HealthInfoFields';
import { useAuth } from '../src/context/AuthContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const form = useHealthInfoForm();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const validacao = validarHealthInfo(form);
    if (!validacao.ok) {
      Alert.alert(validacao.titulo, validacao.mensagem);
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(validacao.dados);
    } catch (e: any) {
      // Só avança se os dados realmente chegaram no banco — senão o usuário
      // entraria no app com o perfil vazio e teria que refazer tudo.
      Alert.alert('Não foi possível salvar', e?.message ?? 'Verifique sua conexão e tente de novo.');
      return;
    } finally {
      setLoading(false);
    }
    router.replace('/(tabs)');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl }}>
      <Text style={{ fontSize: 26, fontWeight: '600', color: colors.green900 }}>Vamos te conhecer</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, marginBottom: 20 }}>
        5 perguntas rápidas para calcular suas metas nutricionais
      </Text>

      <HealthInfoFields form={form} />

      <PrimaryButton title="Continuar" onPress={handleSubmit} loading={loading} style={{ marginTop: 24, marginBottom: 40 }} />
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../src/theme/theme';
import { PrimaryButton } from '../src/components/ui';
import { HealthInfoFields, useHealthInfoForm, validarHealthInfo } from '../src/components/HealthInfoFields';
import { useAuth } from '../src/context/AuthContext';

export default function EditHealthInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appUser, updateHealthInfo } = useAuth();
  // Pré-preenche com o que já está salvo: é edição, não recadastro.
  const form = useHealthInfoForm(appUser);
  const [loading, setLoading] = useState(false);

  if (!appUser) return null;

  async function handleSave() {
    const validacao = validarHealthInfo(form);
    if (!validacao.ok) {
      Alert.alert(validacao.titulo, validacao.mensagem);
      return;
    }

    setLoading(true);
    try {
      await updateHealthInfo(validacao.dados);
    } catch (e: any) {
      // Não fecha a tela se o save falhou — as edições continuam ali pra tentar de novo.
      Alert.alert('Não foi possível salvar', e?.message ?? 'Verifique sua conexão e tente de novo.');
      return;
    } finally {
      setLoading(false);
    }
    // updateHealthInfo já recarregou o appUser, então o Perfil aparece atualizado.
    router.back();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900 }}>Informações de saúde</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.green700 }}>Cancelar</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 13, color: colors.ink500, marginTop: 4 }}>
        Esses dados definem suas metas diárias de nutrientes.
      </Text>

      <HealthInfoFields form={form} />

      <PrimaryButton title="Salvar alterações" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

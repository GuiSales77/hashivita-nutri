import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, COMORBIDADES } from '../../src/theme/theme';
import { Card, SectionLabel } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { metasPara, FONTE_CURTA } from '../../src/domain/metasNutricionais';
import { uploadAvatar } from '../../src/db/repositories/avatarRepositorySupabase';

export default function ProfileScreen() {
  const { appUser, logout, refreshAppUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);
  if (!appUser) return null;

  const metas = metasPara({
    sex: appUser.sex,
    age: appUser.age,
    ageRange: appUser.ageRange,
    hasHashimoto: appUser.hasHashimoto,
    hashimotoMedicationTime: appUser.hashimotoMedicationTime,
    healthConditions: appUser.healthConditions,
  });

  const labelsComorbidades = appUser.healthConditions
    .map((key) => COMORBIDADES.find((c) => c.key === key)?.label ?? key)
    .join(', ');

  async function handlePickAvatar() {
    if (!appUser || uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Para escolher uma foto, libere o acesso à galeria nas configurações do aparelho.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Não foi possível ler a imagem', 'Tente escolher outra foto.');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(appUser.id, asset.base64, asset.mimeType ?? 'image/jpeg');
      await refreshAppUser();
    } catch (e: any) {
      Alert.alert('Não foi possível enviar a foto', e?.message ?? 'Verifique sua conexão e tente de novo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    await logout();
    // Vai direto pro cadastro (e não pro login) porque é a home de entrada do app.
    // O replace é obrigatório: sem ele o usuário fica parado nesta tela, já que
    // signOut() sozinho não navega.
    router.replace('/(auth)/signup');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 90 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Pressable onPress={handlePickAvatar} disabled={uploading} style={{ marginRight: 12 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.green100,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {appUser.avatarUrl ? (
              <Image source={{ uri: appUser.avatarUrl }} style={{ width: 56, height: 56 }} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '600', color: colors.green900 }}>
                {appUser.fullName.charAt(0).toUpperCase()}
              </Text>
            )}

            {uploading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(27, 67, 50, 0.55)',
                }}
              >
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </View>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.green900 }}>{appUser.fullName}</Text>
          <Text style={{ fontSize: 12, color: colors.ink500 }}>{appUser.email}</Text>
          <Text style={{ fontSize: 11, color: colors.ink500, marginTop: 2 }}>
            {uploading ? 'Enviando foto...' : 'Toque na foto para trocar'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>Seus dados</SectionLabel>
        <Pressable onPress={() => router.push('/edit-health-info')} hitSlop={10}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.green700 }}>Editar informações de saúde</Text>
        </Pressable>
      </View>
      <Card>
        <Row label="Idade" value={`${appUser.age ?? '—'} anos`} />
        <Row label="Sexo" value={appUser.sex === 'homem' ? 'Homem' : appUser.sex === 'mulher' ? 'Mulher' : '—'} />
        <Row label="Faixa etária" value={appUser.ageRange ?? '—'} />
        <Row label="Medicação Hashimoto" value={appUser.hasHashimoto ? `Sim, às ${appUser.hashimotoMedicationTime}` : 'Não'} />
        <Row label="Outras condições" value={labelsComorbidades || 'Nenhuma'} last />
      </Card>

      {/* Mostrar a origem de cada número importa: são referências populacionais,
          não uma prescrição feita para esta pessoa. */}
      <SectionLabel>Suas metas diárias</SectionLabel>
      <Card>
        {metas.map((m, i) => (
          <View
            key={m.key}
            style={{
              paddingVertical: 10,
              borderBottomWidth: i === metas.length - 1 ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.ink700, fontWeight: '600' }}>{m.label}</Text>
              <Text style={{ fontSize: 14, color: colors.green900, fontWeight: '700' }}>
                {m.meta} {m.unidade}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.ink500, marginTop: 2 }}>
              {m.base}
              {m.limiteSuperior ? `  ·  limite ${m.limiteSuperior} ${m.unidade}` : ''}
            </Text>
          </View>
        ))}
      </Card>
      <Text style={{ fontSize: 11, color: colors.ink500, lineHeight: 16, marginBottom: spacing.md }}>
        Valores de referência do {FONTE_CURTA}, escolhidos pelo seu sexo e pela sua idade. Cobrem a
        necessidade de 97 a 98% das pessoas saudáveis — são referência populacional, não prescrição.
        Quem ajusta isso para você é o profissional que acompanha seu tratamento.
      </Text>

      <Pressable onPress={handleLogout}>
        <Card>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>Sair da conta</Text>
        </Card>
      </Pressable>

      <Text style={{ fontSize: 11, color: colors.ink500, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
        Seus dados ficam salvos com segurança no Supabase, sincronizados entre dispositivos.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 11, color: colors.ink500, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.ink700, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

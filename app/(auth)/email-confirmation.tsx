import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';

export default function EmailConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendConfirmationEmail } = useAuth();
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await resendConfirmationEmail(email);
      Alert.alert('E-mail reenviado', 'Confira sua caixa de entrada (e o spam).');
    } catch (e: any) {
      Alert.alert('Não foi possível reenviar', e.message ?? 'Tente novamente em instantes.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}>
      <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>✉️</Text>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Confirme seu e-mail</Text>
      <Text style={{ fontSize: 14, color: colors.ink500, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 }}>
        Enviamos um link de confirmação para{'\n'}
        <Text style={{ fontWeight: '700', color: colors.ink700 }}>{email}</Text>
        {'\n\n'}Depois de confirmar, volte aqui e entre normalmente.
      </Text>

      <PrimaryButton title="Já confirmei — Entrar" onPress={() => router.replace('/(auth)/login')} />
      <View style={{ marginTop: 16 }}>
        <TextButton title={sending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'} onPress={handleResend} />
      </View>
    </View>
  );
}

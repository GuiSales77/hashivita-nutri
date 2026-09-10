import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton, LabeledInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { emailParecaValido } from '../../src/services/passwordPolicy';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSend() {
    if (!emailParecaValido(email)) {
      Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      // Mostra sucesso mesmo se o e-mail não tiver conta. Dizer "esse e-mail
      // não existe" entregaria a qualquer um a lista de quem tem cadastro.
      setEnviado(true);
    } catch (e: any) {
      Alert.alert('Aguarde um pouco', e?.message ?? 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}>
        <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>✉️</Text>
        <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Verifique seu e-mail</Text>
        <Text style={{ fontSize: 14, color: colors.ink500, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 }}>
          Se existir uma conta para{'\n'}
          <Text style={{ fontWeight: '700', color: colors.ink700 }}>{email.trim()}</Text>
          {'\n\n'}enviamos um link para criar uma senha nova. Ele vale por pouco tempo — se demorar, confira também a caixa de spam.
        </Text>
        <PrimaryButton title="Voltar para o login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔑</Text>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Esqueceu a senha?</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
        Digite seu e-mail e enviamos um link para criar uma nova
      </Text>

      <LabeledInput
        label="E-MAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="sophia@email.com"
        keyboardType="email-address"
      />

      <PrimaryButton title="Enviar link" onPress={handleSend} loading={loading} style={{ marginTop: 8 }} />
      <View style={{ marginTop: 16 }}>
        <TextButton title="Voltar para o login" onPress={() => router.back()} />
      </View>
    </KeyboardAvoidingView>
  );
}

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

  async function handleSend() {
    if (!emailParecaValido(email)) {
      Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      // Segue para a tela do código mesmo se o e-mail não tiver conta. Dizer
      // "esse e-mail não existe" entregaria a lista de quem tem cadastro.
      router.replace({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } catch (e: any) {
      Alert.alert('Aguarde um pouco', e?.message ?? 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔑</Text>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Esqueceu a senha?</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
        Digite seu e-mail e enviamos um código de 6 dígitos
      </Text>

      <LabeledInput
        label="E-MAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="sophia@email.com"
        keyboardType="email-address"
      />

      <PrimaryButton title="Enviar código" onPress={handleSend} loading={loading} style={{ marginTop: 8 }} />
      <View style={{ marginTop: 16 }}>
        <TextButton title="Voltar para o login" onPress={() => router.back()} />
      </View>
    </KeyboardAvoidingView>
  );
}

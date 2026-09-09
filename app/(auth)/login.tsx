import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton, LabeledInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha) {
      Alert.alert('Preencha os campos', 'E-mail e senha são obrigatórios.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), senha);
    setLoading(false);

    if (result === 'ok') {
      router.replace('/');
      return;
    }
    if (result === 'email_nao_confirmado') {
      Alert.alert(
        'E-mail ainda não confirmado',
        'Verifique sua caixa de entrada, ou toque em reenviar.',
        [
          { text: 'Reenviar e-mail', onPress: () => resendConfirmationEmail(email.trim()) },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } else if (result === 'senha_incorreta') {
      Alert.alert('Senha incorreta', 'Confira o e-mail e a senha e tente novamente.');
    } else if (typeof result === 'object') {
      Alert.alert('Erro ao entrar', result.erro);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🌿</Text>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Bem-vindo de volta</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
        Entre com seu e-mail e senha
      </Text>

      <LabeledInput label="E-MAIL" value={email} onChangeText={setEmail} placeholder="sophia@email.com" keyboardType="email-address" />
      <LabeledInput label="SENHA" value={senha} onChangeText={setSenha} placeholder="••••••••" secure />

      <PrimaryButton title="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
      <View style={{ marginTop: 16 }}>
        <TextButton title="Não tem conta? Criar agora" onPress={() => router.push('/(auth)/signup')} />
      </View>
    </KeyboardAvoidingView>
  );
}

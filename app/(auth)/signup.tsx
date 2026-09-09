import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, LabeledInput, TextButton } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!nome.trim()) {
      Alert.alert('Digite seu nome', 'Precisamos saber como te chamar.');
      return;
    }
    if (senha.length < 8) {
      Alert.alert('Senha fraca', 'Use pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      Alert.alert('As senhas não coincidem', 'Confira e tente novamente.');
      return;
    }
    setLoading(true);
    const result = await signup({ fullName: nome.trim(), email: email.trim(), password: senha });
    setLoading(false);

    if (!result.ok) {
      Alert.alert('Não foi possível criar a conta', result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      router.push({ pathname: '/(auth)/email-confirmation', params: { email: email.trim() } });
    } else {
      router.replace('/');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}>
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🌱</Text>
        <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>HashiVita Nutri</Text>
        <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
          Crie sua conta para começar
        </Text>

        <LabeledInput label="SEU NOME" value={nome} onChangeText={setNome} placeholder="Sophia Pinheiro" />
        <LabeledInput label="E-MAIL" value={email} onChangeText={setEmail} placeholder="sophia@email.com" keyboardType="email-address" />
        <LabeledInput label="SENHA" value={senha} onChangeText={setSenha} placeholder="••••••••" secure />
        <LabeledInput label="CONFIRMAR SENHA" value={confirmar} onChangeText={setConfirmar} placeholder="••••••••" secure />

        <PrimaryButton title="Criar conta" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
        <View style={{ marginTop: 16 }}>
          <TextButton title="Já tem conta? Entrar" onPress={() => router.push('/(auth)/login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

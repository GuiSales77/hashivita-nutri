import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton, LabeledInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { validarSenha, SENHA_MIN_CARACTERES } from '../../src/services/passwordPolicy';

/**
 * Chegada: `app/auth-callback.tsx` manda pra cá quando o link do e-mail é de
 * recuperação (`type=recovery`), depois de já ter criado a sessão temporária.
 * Sem essa sessão o `updateUser` não teria em quem aplicar a senha nova.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, updatePassword, logout } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const politica = validarSenha(senha, confirmar);
    if (!politica.ok) {
      Alert.alert(politica.titulo, politica.mensagem);
      return;
    }
    if (!session) {
      Alert.alert(
        'Link expirado',
        'Abra novamente o link do e-mail — ele vale por pouco tempo e só pode ser usado uma vez.'
      );
      return;
    }

    setLoading(true);
    try {
      await updatePassword(senha);
    } catch (e: any) {
      Alert.alert('Não foi possível trocar a senha', e?.message ?? 'Tente novamente.');
      return;
    } finally {
      setLoading(false);
    }

    // Encerra a sessão criada pelo link e obriga a entrar com a senha nova —
    // é o que confirma, para o próprio usuário, que a troca funcionou.
    await logout();
    Alert.alert('Senha alterada', 'Entre com a sua nova senha.');
    router.replace('/(auth)/login');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔒</Text>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Criar nova senha</Text>
      <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
        Mínimo {SENHA_MIN_CARACTERES} caracteres, com pelo menos um número
      </Text>

      <LabeledInput label="NOVA SENHA" value={senha} onChangeText={setSenha} placeholder="••••••••" secure />
      <LabeledInput label="CONFIRMAR NOVA SENHA" value={confirmar} onChangeText={setConfirmar} placeholder="••••••••" secure />

      <PrimaryButton title="Salvar nova senha" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
      <View style={{ marginTop: 16 }}>
        <TextButton title="Cancelar" onPress={() => router.replace('/(auth)/login')} />
      </View>
    </KeyboardAvoidingView>
  );
}

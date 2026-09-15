import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton, LabeledInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { validarSenha, SENHA_MIN_CARACTERES } from '../../src/services/passwordPolicy';

/**
 * Chegada: app/auth-callback.tsx manda pra cá quando o link do e-mail é de
 * recuperação (`type=recovery`), depois de já ter criado a sessão de
 * recuperação. Por isso aqui não se pede código nem e-mail — só a senha nova.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, updatePassword, logout } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function handleSave() {
    const politica = validarSenha(senha, confirmar);
    if (!politica.ok) {
      Alert.alert(politica.titulo, politica.mensagem);
      return;
    }
    if (!session) {
      Alert.alert(
        'Link expirado',
        'Peça um novo link em "Esqueci minha senha" e abra só o e-mail mais recente.'
      );
      return;
    }

    setLoading(true);
    try {
      await updatePassword(senha);
    } catch (e: any) {
      Alert.alert('Não foi possível trocar a senha', e?.message ?? 'Verifique sua conexão e tente de novo.');
      return;
    } finally {
      setLoading(false);
    }

    // Encerra a sessão aberta pelo link: quem entra depois precisa usar a senha
    // nova, o que confirma para o próprio usuário que a troca funcionou.
    await logout();
    setConcluido(true);
  }

  // Tela de confirmação inequívoca. Sem ela, o usuário tende a voltar no e-mail
  // e clicar de novo "para garantir" — e o link, já usado, mostra erro,
  // parecendo que a troca falhou quando na verdade deu certo.
  if (concluido) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}>
        <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 12 }}>✅</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.green900, textAlign: 'center' }}>Senha alterada!</Text>
        <Text style={{ fontSize: 15, color: colors.ink700, textAlign: 'center', marginTop: 10, marginBottom: 8, lineHeight: 22 }}>
          Você já pode fechar esta tela e entrar com a senha nova.
        </Text>
        <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginBottom: 28, lineHeight: 19 }}>
          Não precisa clicar no link do e-mail de novo — ele já foi usado e agora mostraria erro, mesmo com tudo certo.
        </Text>
        <PrimaryButton title="Entrar com a senha nova" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
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
        <TextButton
          title="Cancelar"
          onPress={async () => {
            // A sessão aberta pelo link não pode sobrar: sem senha definida, o
            // usuário ficaria logado por um link de e-mail.
            await logout();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

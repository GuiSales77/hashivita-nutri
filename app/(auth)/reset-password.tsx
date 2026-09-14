import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme/theme';
import { PrimaryButton, TextButton, LabeledInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { emailParecaValido, validarSenha, SENHA_MIN_CARACTERES } from '../../src/services/passwordPolicy';

/**
 * Recuperação de senha por código, tudo numa tela só: e-mail, código de 6
 * dígitos e senha nova. Não existe link — scanners de e-mail pré-visitavam o
 * link e consumiam o token antes do usuário clicar.
 *
 * Ordem: valida a senha localmente → verifyOtp (cria sessão de recuperação) →
 * updateUser → signOut. A senha é validada ANTES do código porque o código é
 * de uso único: se ele fosse gasto e a senha recusada em seguida, o usuário
 * teria que pedir outro e-mail.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset, verifyRecoveryCode, updatePassword, logout } = useAuth();

  const [email, setEmail] = useState(params.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  // Depois de verificado, o código já foi consumido. Se a troca da senha falhar
  // por outro motivo (rede), a nova tentativa pula direto para o updateUser.
  const [codigoVerificado, setCodigoVerificado] = useState(false);

  async function handleSave() {
    if (!emailParecaValido(email)) {
      Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
      return;
    }
    // O Supabase usa 6 dígitos por padrão, mas o tamanho é configurável no
    // projeto — aceitar de 6 a 10 evita quebrar se alguém mudar a configuração.
    if (!codigoVerificado && !/^\d{6,10}$/.test(codigo.trim())) {
      Alert.alert('Código inválido', 'Digite o código de 6 dígitos que chegou no seu e-mail.');
      return;
    }
    const politica = validarSenha(senha, confirmar);
    if (!politica.ok) {
      Alert.alert(politica.titulo, politica.mensagem);
      return;
    }

    setLoading(true);
    try {
      if (!codigoVerificado) {
        try {
          await verifyRecoveryCode(email, codigo);
        } catch {
          Alert.alert(
            'Código incorreto ou expirado',
            'Confira os dígitos. Se o código for antigo, toque em "Reenviar código".'
          );
          return;
        }
        setCodigoVerificado(true);
      }

      try {
        await updatePassword(senha);
      } catch (e: any) {
        Alert.alert('Não foi possível trocar a senha', e?.message ?? 'Verifique sua conexão e tente de novo.');
        return;
      }
    } finally {
      setLoading(false);
    }

    // Encerra a sessão de recuperação e obriga a entrar com a senha nova — é o
    // que prova para o próprio usuário que a troca funcionou.
    await logout();
    Alert.alert('Senha alterada', 'Entre com a sua nova senha.');
    router.replace('/(auth)/login');
  }

  async function handleResend() {
    if (!emailParecaValido(email)) {
      Alert.alert('E-mail inválido', 'Confira o endereço digitado.');
      return;
    }
    setReenviando(true);
    try {
      await sendPasswordReset(email);
      setCodigo('');
      setCodigoVerificado(false);
      Alert.alert('Código reenviado', 'Confira seu e-mail. Só o código mais recente vale.');
    } catch (e: any) {
      Alert.alert('Aguarde um pouco', e?.message ?? 'Tente novamente em instantes.');
    } finally {
      setReenviando(false);
    }
  }

  async function handleCancel() {
    // Se o código chegou a ser verificado, há uma sessão de recuperação aberta.
    // Sem o logout, o usuário acabaria logado sem ter definido senha nenhuma.
    if (codigoVerificado) await logout();
    router.replace('/(auth)/login');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔒</Text>
        <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>Criar nova senha</Text>
        <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4, marginBottom: 24, lineHeight: 19 }}>
          Digite o código de 6 dígitos que enviamos por e-mail.{'\n'}Se não chegar, confira a caixa de spam.
        </Text>

        <LabeledInput label="E-MAIL" value={email} onChangeText={setEmail} placeholder="sophia@email.com" keyboardType="email-address" />
        {!codigoVerificado && (
          <LabeledInput label="CÓDIGO DO E-MAIL" value={codigo} onChangeText={setCodigo} placeholder="123456" keyboardType="number-pad" />
        )}
        <LabeledInput label={`NOVA SENHA (MÍN. ${SENHA_MIN_CARACTERES}, COM NÚMERO)`} value={senha} onChangeText={setSenha} placeholder="••••••••" secure />
        <LabeledInput label="CONFIRMAR NOVA SENHA" value={confirmar} onChangeText={setConfirmar} placeholder="••••••••" secure />

        <PrimaryButton title="Salvar nova senha" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        <View style={{ marginTop: 14 }}>
          <TextButton title={reenviando ? 'Reenviando...' : 'Reenviar código'} onPress={handleResend} />
        </View>
        <View style={{ marginTop: 14 }}>
          <TextButton title="Cancelar" onPress={handleCancel} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing } from '../src/theme/theme';

export default function Index() {
  const { session, appUser, loading, profileLoaded, profileError, refreshAppUser } = useAuth();
  const [tentandoDeNovo, setTentandoDeNovo] = useState(false);

  // Enquanto há sessão mas o perfil não voltou do banco, não dá pra decidir
  // a rota: `appUser` nulo aqui significaria "não fez onboarding", que é
  // falso para quem já se cadastrou.
  if (loading || (session && !profileLoaded)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.green700} size="large" />
      </View>
    );
  }

  // Perfil não carregou por falha de leitura (rede, normalmente). Mandar para o
  // onboarding aqui seria pedir que a pessoa preencha tudo outra vez por causa
  // de uma queda de conexão; ficar no spinner seria pior ainda.
  if (session && !appUser && profileError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, padding: spacing.xxl }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>
          Não conseguimos carregar seus dados
        </Text>
        <Text style={{ fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 }}>
          {profileError}
        </Text>
        <Pressable
          onPress={async () => {
            setTentandoDeNovo(true);
            try {
              await refreshAppUser();
            } finally {
              setTentandoDeNovo(false);
            }
          }}
          disabled={tentandoDeNovo}
          style={{
            marginTop: spacing.xl,
            backgroundColor: colors.green700,
            borderRadius: 14,
            height: 48,
            paddingHorizontal: spacing.xxl,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: tentandoDeNovo ? 0.6 : 1,
          }}
        >
          {tentandoDeNovo ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, fontSize: 14.5, fontWeight: '600' }}>Tentar de novo</Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!appUser?.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

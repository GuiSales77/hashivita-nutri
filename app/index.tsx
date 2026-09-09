import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/theme';

export default function Index() {
  const { session, appUser, loading, profileLoaded } = useAuth();

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

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!appUser?.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

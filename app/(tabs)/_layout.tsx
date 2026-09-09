import React from 'react';
import { Tabs } from 'expo-router';
import { View, Image, type ImageSourcePropType } from 'react-native';
import { colors, radius, spacing } from '../../src/theme/theme';

const ICONE_INICIO = require('../../assets/icon-inicio.png');
const ICONE_PERFIL = require('../../assets/icon-perfil.png');

// Pílula verde atrás do ícone quando a aba está ativa. Os ícones vêm do Figma
// (assets/icon-inicio.png e assets/icon-perfil.png) e já trazem a paleta do app,
// então não recebem tint — a marcação de ativo é o fundo, não a cor do ícone.
function TabIcon({ focused, source }: { focused: boolean; source: ImageSourcePropType }) {
  return (
    <View
      style={{
        backgroundColor: focused ? colors.green100 : 'transparent',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
      }}
    >
      <Image
        source={source}
        style={{ width: 22, height: 22, opacity: focused ? 1 : 0.55 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green900,
        tabBarInactiveTintColor: colors.ink500,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, height: 70, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={ICONE_INICIO} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={ICONE_PERFIL} />,
        }}
      />
    </Tabs>
  );
}

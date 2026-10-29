import React from 'react';
import { View, Text, Pressable, ActivityIndicator, ViewStyle, TextInput } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';
import { estadoDaBarra } from '../domain/metasNutricionais';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: colors.green700,
          borderRadius: radius.sm + 2,
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>{title}</Text>}
    </Pressable>
  );
}

export function TextButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={{ color: colors.green700, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}) {
  return (
    <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.ink500, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{ fontSize: 15, color: colors.ink700 }}
      />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.green700 : colors.green100,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? colors.white : colors.green900, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.ink500, marginTop: spacing.lg, marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

export function NutrientBar({
  label,
  total,
  meta,
  limiteSuperior,
  unidade,
}: {
  label: string;
  total: number;
  meta: number;
  limiteSuperior?: number | null;
  unidade: string;
}) {
  const barra = estadoDaBarra(total, meta, limiteSuperior ?? null);

  // Três estados, três leituras. Antes "abaixo da meta" e "acima do limite"
  // usavam a mesma cor âmbar, então 10% de selênio e 800% de selênio eram
  // desenhados igual.
  const corAteMeta = barra.estado === 'abaixo' ? colors.green300 : colors.green500;
  const corExcesso = barra.estado === 'acima_do_limite' ? colors.amber500 : colors.green300;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink700 }}>
          {label}
          {barra.estado === 'acima_do_limite' ? ' ⚠️' : ''}
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink500 }}>
          {total.toFixed(1)} {unidade} · {barra.rotulo}
        </Text>
      </View>

      {/* A escala acompanha o total, então passar muito do limite enche a barra
          de âmbar em vez de parar em 100% como antes. */}
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.green100, flexDirection: 'row', overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${barra.fracaoAteMeta * 100}%`, backgroundColor: corAteMeta }} />
        <View style={{ height: 8, width: `${barra.fracaoExcesso * 100}%`, backgroundColor: corExcesso }} />
      </View>

      {barra.estado === 'acima_do_limite' && (
        <Text style={{ fontSize: 11.5, color: colors.amber500, fontWeight: '600', marginTop: 6 }}>
          Acima do limite superior de referência. Vale conversar com quem acompanha você.
        </Text>
      )}
    </Card>
  );
}

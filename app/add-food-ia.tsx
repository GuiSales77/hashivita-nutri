import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, TIPOS_REFEICAO } from '../src/theme/theme';
import { Card, PrimaryButton, SectionLabel, TextButton } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import {
  interpretarRefeicao,
  registrarItensInterpretados,
  ItemInterpretado,
} from '../src/db/repositories/aiMealRepositorySupabase';

const EXEMPLOS = [
  'Duas colheres de arroz, um bife e salada de alface',
  'Um ovo frito e uma fatia de pão integral no café',
  'Iogurte natural com granola e uma banana',
];

export default function AddFoodIAScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [texto, setTexto] = useState('');
  const [interpretando, setInterpretando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [itens, setItens] = useState<ItemInterpretado[] | null>(null);
  const [naoEncontrados, setNaoEncontrados] = useState<string[]>([]);

  async function handleInterpretar() {
    if (!texto.trim()) return;
    setInterpretando(true);
    try {
      const resultado = await interpretarRefeicao(texto);
      if (resultado.itens.length === 0) {
        Alert.alert(
          'Nada reconhecido',
          resultado.nao_encontrados.length
            ? `Não encontrei no catálogo: ${resultado.nao_encontrados.join(', ')}.`
            : 'Tente escrever de outro jeito, citando o alimento e a quantidade.'
        );
        return;
      }
      setItens(resultado.itens);
      setNaoEncontrados(resultado.nao_encontrados);
    } catch (e: any) {
      Alert.alert('Não foi possível interpretar', e?.message ?? 'Tente novamente.');
    } finally {
      setInterpretando(false);
    }
  }

  function alterarGramas(indice: number, valor: string) {
    const gramas = parseFloat(valor.replace(',', '.'));
    setItens((atual) =>
      atual
        ? atual.map((item, i) => (i === indice ? { ...item, grams: Number.isFinite(gramas) ? gramas : 0 } : item))
        : atual
    );
  }

  function removerItem(indice: number) {
    setItens((atual) => (atual ? atual.filter((_, i) => i !== indice) : atual));
  }

  async function handleRegistrar() {
    if (!session || !itens?.length) return;
    const invalido = itens.find((i) => !(i.grams > 0));
    if (invalido) {
      Alert.alert('Quantidade inválida', `Informe os gramas de ${invalido.food_name}.`);
      return;
    }

    setSalvando(true);
    try {
      const { registrados, falhas } = await registrarItensInterpretados(session.user.id, itens);
      if (falhas.length) {
        Alert.alert(
          registrados ? 'Registrado em parte' : 'Não foi possível registrar',
          `${registrados} de ${itens.length} salvos.\n\nFalhou: ${falhas.join('; ')}`
        );
        if (!registrados) return;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900 }}>Escrever a refeição</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.green700 }}>Cancelar</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 13, color: colors.ink500, marginTop: 4 }}>
        Descreva o que você comeu. A IA identifica os alimentos no catálogo — você confere antes de registrar.
      </Text>

      <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginTop: 16 }}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Ex.: duas colheres de arroz, um ovo frito e um copo de leite"
          multiline
          maxLength={500}
          style={{ fontSize: 15, color: colors.ink700, minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      {!itens && (
        <>
          <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 4 }}>{texto.length}/500</Text>
          <PrimaryButton
            title="Interpretar"
            onPress={handleInterpretar}
            loading={interpretando}
            disabled={!texto.trim()}
            style={{ marginTop: 12 }}
          />

          <SectionLabel>Exemplos</SectionLabel>
          {EXEMPLOS.map((exemplo) => (
            <Pressable key={exemplo} onPress={() => setTexto(exemplo)}>
              <Card>
                <Text style={{ fontSize: 13, color: colors.ink500 }}>{exemplo}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {itens && (
        <>
          {/* Confirmação obrigatória: a IA erra medida caseira com frequência, e
              aqui um erro de gramagem vira meta nutricional errada. */}
          <SectionLabel>Confira antes de registrar</SectionLabel>

          {itens.map((item, indice) => {
            const tipo = TIPOS_REFEICAO.find((t) => t.key === item.meal_type);
            return (
              <Card key={`${item.food_id}-${indice}`}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink700 }}>{item.food_name}</Text>
                    <Text style={{ fontSize: 11.5, color: colors.ink500, marginTop: 2 }}>
                      {tipo ? `${tipo.emoji} ${tipo.label}` : item.meal_type}
                      {item.trecho ? `  ·  "${item.trecho}"` : ''}
                    </Text>
                    {item.confianca !== 'alta' && (
                      <Text style={{ fontSize: 11.5, color: colors.amber500, fontWeight: '600', marginTop: 4 }}>
                        {item.confianca === 'media' ? '⚠️ Quantidade estimada — confira' : '⚠️ Correspondência duvidosa — confira'}
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => removerItem(indice)} hitSlop={12} style={{ paddingHorizontal: spacing.sm }}>
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.ink500, marginRight: 8 }}>GRAMAS</Text>
                  <TextInput
                    value={String(item.grams)}
                    onChangeText={(v) => alterarGramas(indice, v)}
                    keyboardType="decimal-pad"
                    style={{
                      fontSize: 15,
                      color: colors.ink700,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.sm,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      minWidth: 90,
                    }}
                  />
                </View>
              </Card>
            );
          })}

          {naoEncontrados.length > 0 && (
            <Card style={{ backgroundColor: colors.amberBg, borderColor: colors.amber500 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.ink700, marginBottom: 4 }}>
                Fora do catálogo
              </Text>
              <Text style={{ fontSize: 12.5, color: colors.ink700, lineHeight: 18 }}>
                {naoEncontrados.join(', ')}. Esses itens não existem na base de alimentos e não serão registrados.
              </Text>
            </Card>
          )}

          <PrimaryButton
            title={`Registrar ${itens.length} ${itens.length === 1 ? 'alimento' : 'alimentos'}`}
            onPress={handleRegistrar}
            loading={salvando}
            style={{ marginTop: 8 }}
          />
          <View style={{ marginTop: 14 }}>
            <TextButton
              title="Escrever de novo"
              onPress={() => {
                setItens(null);
                setNaoEncontrados([]);
              }}
            />
          </View>
        </>
      )}

      {interpretando && (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <ActivityIndicator color={colors.green700} />
          <Text style={{ fontSize: 12, color: colors.ink500, marginTop: 6 }}>Lendo o que você escreveu...</Text>
        </View>
      )}
    </ScrollView>
  );
}

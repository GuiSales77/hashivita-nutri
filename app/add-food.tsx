import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, NUTRIENTES_PRIORITARIOS, TIPOS_REFEICAO, sugerirTipoRefeicao, MealType } from '../src/theme/theme';
import { Card, PrimaryButton, SectionLabel, Chip } from '../src/components/ui';
import { searchFoods, Food } from '../src/db/repositories/foodRepositorySupabase';
import { createMealLog, calcularNutrientesDoAlimento } from '../src/db/repositories/mealRepositorySupabase';
import { useAuth } from '../src/context/AuthContext';

export default function AddFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [useGramsExact, setUseGramsExact] = useState(false);
  const [gramsInput, setGramsInput] = useState('100');
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);
  // Pré-selecionado pelo horário: no caso comum o usuário só confirma.
  const [mealType, setMealType] = useState<MealType>(() => sugerirTipoRefeicao());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSearching(true);
    searchFoods(query).then((data) => {
      setResults(data);
      setSearching(false);
    });
  }, [query]);

  function handleSelectFood(food: Food) {
    setSelectedFood(food);
    setUseGramsExact(!food.default_grams);
    setQuantityMultiplier(1);
  }

  const quantidadeGramas = useMemo(() => {
    if (useGramsExact) return parseFloat(gramsInput.replace(',', '.')) || 0;
    return (selectedFood?.default_grams ?? 0) * quantityMultiplier;
  }, [useGramsExact, gramsInput, selectedFood, quantityMultiplier]);

  async function handleConfirm() {
    if (!selectedFood || quantidadeGramas <= 0 || !session) return;
    setSaving(true);
    try {
      await createMealLog(
        session.user.id,
        selectedFood,
        useGramsExact ? undefined : quantityMultiplier,
        useGramsExact ? `${quantidadeGramas}g` : selectedFood.default_unit ?? undefined,
        quantidadeGramas,
        mealType
      );
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.green900 }}>Adicionar alimento</Text>

      {!selectedFood && (
        <>
          <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, marginTop: 16, marginBottom: 12 }}>
            <TextInput value={query} onChangeText={setQuery} placeholder="🔍  Buscar alimento..." style={{ fontSize: 14 }} />
          </View>
          {searching && <ActivityIndicator color={colors.green700} />}
          {results.map((food) => (
            <Pressable key={food.id} onPress={() => handleSelectFood(food)}>
              <Card>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink700 }}>
                  {food.emoji ? `${food.emoji} ` : ''}{food.name}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.ink500 }}>{food.category}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {selectedFood && (
        <>
          <Card style={{ backgroundColor: colors.green100, borderWidth: 0, marginTop: 16 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '600', color: colors.green900 }}>
              {selectedFood.emoji ? `${selectedFood.emoji} ` : ''}{selectedFood.name}
            </Text>
            <Text style={{ fontSize: 11.5, color: colors.green900, marginTop: 2 }}>
              Selênio {selectedFood.selenium_mcg ?? 0}mcg · Ferro {selectedFood.iron_mg ?? 0}mg — por 100g
            </Text>
          </Card>

          {/* Depois de escolher o alimento, e não antes: a pergunta que o
              usuário tem na cabeça ao abrir a tela é "o que eu comi", não
              "em que refeição". Perguntar o tipo primeiro cria uma etapa
              entre ele e a ação principal, que é a busca. */}
          <SectionLabel>Refeição</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {TIPOS_REFEICAO.map((tipo) => (
              <Chip
                key={tipo.key}
                label={`${tipo.emoji} ${tipo.label}`}
                active={mealType === tipo.key}
                onPress={() => setMealType(tipo.key)}
              />
            ))}
          </View>

          <SectionLabel>Quantidade</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {selectedFood.default_grams && (
              <>
                <Chip label={`1 ${selectedFood.default_unit ?? 'unidade'} (${selectedFood.default_grams}g)`} active={!useGramsExact && quantityMultiplier === 1} onPress={() => { setUseGramsExact(false); setQuantityMultiplier(1); }} />
                <Chip label={`2 ${selectedFood.default_unit ?? 'unidades'} (${selectedFood.default_grams * 2}g)`} active={!useGramsExact && quantityMultiplier === 2} onPress={() => { setUseGramsExact(false); setQuantityMultiplier(2); }} />
              </>
            )}
            <Chip label="Gramas exatas" active={useGramsExact} onPress={() => setUseGramsExact(true)} />
          </View>

          {useGramsExact && (
            <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.ink500, marginBottom: 4 }}>GRAMAS</Text>
              <TextInput value={gramsInput} onChangeText={setGramsInput} keyboardType="decimal-pad" style={{ fontSize: 15 }} />
            </View>
          )}

          <SectionLabel>Você vai receber</SectionLabel>
          <Card>
            {(() => {
              const nutrientes = calcularNutrientesDoAlimento(selectedFood, quantidadeGramas);
              const relevantes = NUTRIENTES_PRIORITARIOS.filter((n) => nutrientes[n.key] > 0);
              if (relevantes.length === 0) {
                return <Text style={{ fontSize: 12.5, color: colors.ink500 }}>Sem dados relevantes dos nutrientes prioritários para este alimento.</Text>;
              }
              return relevantes.map((n) => (
                <Text key={n.key} style={{ fontSize: 13, color: colors.ink700, marginBottom: 2 }}>
                  +{nutrientes[n.key].toFixed(1)} {n.unidade} de {n.label.toLowerCase()}
                </Text>
              ));
            })()}
          </Card>

          <PrimaryButton title="Confirmar" onPress={handleConfirm} loading={saving} style={{ marginTop: 8 }} />
          <View style={{ marginTop: 12 }}>
            <Pressable onPress={() => setSelectedFood(null)}>
              <Text style={{ textAlign: 'center', color: colors.ink500, fontSize: 13 }}>Escolher outro alimento</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

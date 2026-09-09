import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../src/theme/theme';
import { PrimaryButton } from '../src/components/ui';
import { supabase } from '../src/services/supabaseClient';

/**
 * Destino do link de confirmação de e-mail (ver src/services/authRedirect.ts).
 *
 * O Supabase pode devolver o resultado de duas formas, dependendo do fluxo:
 *   - PKCE:     ?code=...                     -> troca por sessão
 *   - implícito: #access_token=...&refresh_token=...  -> vira sessão direto
 * E em caso de erro (link expirado, já usado): ?error_description=...
 *
 * Tratamos as três, porque o formato depende de configuração do projeto e não do
 * app — assumir um só deixaria o retorno quebrado sem aviso.
 */

function extrairParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const adicionar = (query: string) => {
    for (const par of query.split('&')) {
      if (!par) continue;
      const [chave, valor] = par.split('=');
      if (chave) params[decodeURIComponent(chave)] = decodeURIComponent(valor ?? '');
    }
  };
  let restante = url;
  const fragmento = restante.indexOf('#');
  if (fragmento >= 0) {
    adicionar(restante.slice(fragmento + 1));
    restante = restante.slice(0, fragmento);
  }
  const query = restante.indexOf('?');
  if (query >= 0) adicionar(restante.slice(query + 1));
  return params;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelado = false;

    (async () => {
      const params = extrairParams(url);

      if (params.error_description || params.error) {
        if (!cancelado) setErro(params.error_description ?? params.error);
        return;
      }

      try {
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        } else if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) throw error;
        } else {
          // Confirmação feita no navegador sem devolver sessão: o e-mail está
          // validado, só falta entrar. É o caminho mais comum.
          if (!cancelado) router.replace('/(auth)/login');
          return;
        }
      } catch (e: any) {
        if (!cancelado) setErro(e?.message ?? 'Não foi possível concluir a confirmação.');
        return;
      }

      // Com sessão criada, app/index.tsx decide entre onboarding e abas.
      if (!cancelado) router.replace('/');
    })();

    return () => {
      cancelado = true;
    };
  }, [url, router]);

  if (erro) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ fontSize: 22, fontWeight: '600', color: colors.green900, textAlign: 'center' }}>
          Link inválido ou expirado
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink500, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>
          {erro}
        </Text>
        <PrimaryButton title="Voltar para o login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <ActivityIndicator color={colors.green700} size="large" />
      <Text style={{ fontSize: 14, color: colors.ink500, marginTop: 12 }}>Confirmando seu e-mail...</Text>
    </View>
  );
}

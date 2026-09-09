# HashiVita Nutri

App mobile de registro alimentar com feedback nutricional para pessoas com
tireoidite de Hashimoto — cálculo por regra de três sobre a Tabela TACO,
autenticação com verificação de e-mail, backend Supabase.

## Status — validado de verdade (não só documentado)

- ✅ `npx tsc --noEmit` — zero erros
- ✅ `npx expo export --platform android` — bundle compila (1264 módulos, Expo Router)
- ⬜ RLS/schema ainda precisa ser rodado no seu projeto Supabase (arquivo `.sql` fornecido à parte)
- ⬜ Fluxos reais (cadastro → e-mail → login → onboarding → registrar alimento) ainda
  não foram testados num dispositivo/emulador de verdade — só a compilação foi validada

## Requisitos

- Node.js 20+
- npm
- Expo Go (Android/iOS) para desenvolvimento
- Conta no [Supabase](https://supabase.com)
- EAS CLI (`npm install -g eas-cli`) — só necessário para gerar builds de produção

## Instalação

```bash
npm install
```

## Configuração — Supabase

1. Crie um projeto no Supabase (ou reutilize um existente).
2. Rode o arquivo `hashivita-nutri-supabase-schema.sql` (fornecido separadamente) no
   **SQL Editor** do projeto — ele cria as tabelas `food`, `app_user`, `meal_log`, o
   trigger que cria o perfil automaticamente no cadastro, e todas as políticas de RLS.
3. Em **Authentication → Providers → Email**, ative **"Confirm email"** — esse app
   depende da verificação de e-mail estar ligada (diferente de outros protótipos que
   você possa ter testado com essa opção desligada).
4. Em **Project Settings → API**, copie a **Project URL** e a **Publishable key**.

## Configuração — variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUACHAVEAQUI
```

Nunca coloque a **secret key** (service_role) aqui — essa chave nunca deve estar no
app, só em funções de servidor (Edge Functions), que este projeto não usa por enquanto.

## Desenvolvimento — Expo Go

```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go**. Se o celular e o computador não conseguirem
se conectar (erro comum em redes de faculdade/empresa), use:

```bash
npx expo start --tunnel
```

## Testando o fluxo completo

1. Cadastre-se com nome, e-mail e senha.
2. Confirme o e-mail (link enviado pelo Supabase) — sem isso o login não funciona.
3. Faça login.
4. Responda as 5 perguntas do onboarding.
5. Na Home, toque em "Adicionar alimento", busque um alimento, escolha a quantidade,
   confirme — as barras de nutriente da Home devem atualizar.

## Build para produção (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure   # gera/atualiza o projectId em app.json — rode uma vez
```

**Build de teste (APK, instala direto no Android sem passar pela loja):**
```bash
eas build --profile preview --platform android
```

**Build para a Google Play (AAB):**
```bash
eas build --profile production --platform android
```

**Build para a App Store (iOS):**
```bash
eas build --profile production --platform ios
```
Diferente do Android, o resultado do build iOS não é instalável direto por
QR code/APK — a distribuição passa pela App Store (ou TestFlight para testes).

## Estrutura do projeto

```
app/                     → rotas (Expo Router, file-based)
  _layout.tsx             → layout raiz, providers
  index.tsx                → decide pra onde redirecionar (login/onboarding/tabs)
  (auth)/                  → login, cadastro, confirmação de e-mail
  onboarding.tsx
  (tabs)/                  → Início (Home) e Perfil
  add-food.tsx              → modal de adicionar alimento

src/
  theme/        → design tokens, metas nutricionais, comorbidades
  context/      → AuthContext (sessão Supabase, onboarding)
  services/     → supabaseClient, secureStoreAdapter
  db/repositories/ → foodRepositorySupabase, mealRepositorySupabase
  components/   → Card, PrimaryButton, Chip, NutrientBar etc.
```

## Segurança

- A sessão do usuário é persistida via `expo-secure-store` (não AsyncStorage — evita
  o erro "Native module is null" que apareceu num projeto anterior).
- Toda proteção de dados roda via RLS no Postgres, não só na interface — um usuário
  não consegue ler/editar dados de outro mesmo manipulando o app.
- A `publishable key` no `.env` é segura de expor (foi feita para isso); a
  `service_role key` nunca deve entrar neste projeto.

## Limitações conhecidas (honestas, não escondidas)

- A base de alimentos (`food`) precisa ser populada — o schema está pronto, mas os
  dados em si (nomes, categorias, valores por 100g) ainda não foram inseridos em massa.
- Selênio, iodo e vitamina D **não são colunas oficiais da Tabela TACO** — valores para
  esses três nutrientes, quando inseridos, devem vir de fontes complementares (USDA,
  literatura científica), não da TACO propriamente dita.
- `eas.json` está configurado, mas `eas build:configure` ainda não foi rodado (precisa
  da sua conta EAS logada, que não está disponível neste ambiente de desenvolvimento).

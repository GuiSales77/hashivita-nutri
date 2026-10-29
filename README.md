# HashVita Nutri

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

## Instalar o APK no Android (e o que fazer quando falha)

Cada push na `main` dispara o GitHub Actions, que builda o APK no EAS, confere o
arquivo e publica em **Releases**. O corpo de cada Release traz tamanho,
SHA-256 e arquiteturas do arquivo publicado.

Quando o celular diz que não instalou, a ordem útil de verificação é:

1. **Desinstale a versão anterior e instale de novo.** Resolve os dois casos
   mais comuns: instalação existente assinada com outra chave, e `versionCode`
   igual ao que já está no aparelho (vários instaladores recusam a troca).
2. **Compare o tamanho** do arquivo baixado com o que o Release informa. Menor
   significa download interrompido — o instalador reclama de "pacote
   inválido", não de download.
3. **Confira a versão do Android.** O app pede 7.0 ou mais novo (minSdk 24).
4. A mensagem exata importa: "aplicativo não instalado" (conflito de pacote),
   "problema ao analisar o pacote" (arquivo corrompido) e "app não compatível"
   (Android antigo ou arquitetura) têm causas diferentes.

Para inspecionar um APK sem Android SDK, o que vale olhar é: zip íntegro,
presenção do bloco `APK Sig Block 42`, certificado (tem que ser o mesmo entre
builds), `versionCode`, `minSdkVersion` e as pastas em `lib/`. Foi assim que o
`versionCode` travado em 2 apareceu — ele estava igual em quatro Releases
seguidos porque `autoIncrement` existia só no perfil `production`, e o CI
builda o `preview`.

## Estrutura do projeto

```
app/                      → rotas (Expo Router, file-based)
  _layout.tsx              → layout raiz, providers
  index.tsx                → decide pra onde redirecionar (login/onboarding/tabs)
  (auth)/                  → login, cadastro, confirmação de e-mail, recuperação de senha
  auth-callback.tsx        → recebe o link de confirmação/redefinição
  onboarding.tsx
  (tabs)/                  → Início (Home) e Perfil
  add-food.tsx             → modal de adicionar alimento (busca na base)
  add-food-ia.tsx          → modal de adicionar escrevendo em texto livre (Gemini)
  edit-health-info.tsx     → edição dos dados de saúde do onboarding
  historico.tsx            → histórico diário (30 dias, nutrientes somados por dia)

src/
  theme/        → design tokens, tipos de refeição, lista de nutrientes
  domain/       → metasNutricionais (metas por perfil, limites, barras)
  context/      → AuthContext (sessão Supabase, onboarding, dados de saúde)
  services/     → supabaseClient, secureStoreAdapter, passwordPolicy
  db/repositories/ → foodRepositorySupabase, mealRepositorySupabase, aiMealRepositorySupabase
  components/   → Card, PrimaryButton, Chip, NutrientBar etc.

supabase/
  *.sql                    → schema, policies e seeds, na ordem de aplicação
  functions/interpretar-refeicao/ → Edge Function que fala com o Gemini
```

## Segurança

- A sessão do usuário é persistida via `expo-secure-store` (não AsyncStorage — evita
  o erro "Native module is null" que apareceu num projeto anterior).
- Toda proteção de dados roda via RLS no Postgres, não só na interface — um usuário
  não consegue ler/editar dados de outro mesmo manipulando o app.
- A `publishable key` no `.env` é segura de expor (foi feita para isso); a
  `service_role key` nunca deve entrar neste projeto.
- A chave da API do Gemini **não fica no app nem no repositório**. Ela vive no Vault
  do Supabase e é lida só de dentro da Edge Function, por uma função
  `SECURITY DEFINER` cujo `execute` só o `service_role` tem. O app chama a Edge
  Function com o JWT de quem está logado; anônimo recebe 401.
- O bucket `avatars` é público para leitura por URL, mas **não é listável**: cada
  pessoa só enxerga o próprio arquivo. Uma policy anterior dava SELECT do bucket
  inteiro ao role `public`, o que permitia listar os uid e as fotos de todos os
  usuários com a chave publishable. Foi corrigido — ver `supabase/03_avatars.sql`.
- Ponto em aberto, só resolvível no painel: **Leaked Password Protection** (Auth →
  Policies) está desligada. Ligar faz o Supabase recusar senhas que já vazaram.

## Limitações conhecidas (honestas, não escondidas)

- A base de alimentos tem 175 itens. É suficiente para o uso real do app, mas não
  cobre a TACO inteira — alimento que não está na base não pode ser registrado, e a
  entrada por texto livre também só consegue casar com o que existe no catálogo.
- Selênio, iodo e vitamina D **não são colunas oficiais da Tabela TACO** — os valores
  desses três vieram de fontes complementares (USDA, literatura), não da TACO.
- A base tem nove colunas de nutrientes, e **a única vitamina entre elas é a D**. B12,
  folato, C, A, E e K não estão nos dados; o histórico diário diz isso na tela em vez
  de mostrar zeros que pareceriam medição.
- As metas do MSD/IOM cobrem cinco dos nove nutrientes. Energia, proteína, carboidrato
  e sódio aparecem como total, sem alvo — sódio ganha teto apenas para quem marcou
  pressão alta no onboarding.
- O app não funciona offline: toda leitura e escrita vai ao Supabase. Sem rede, as
  telas mostram o estado vazio em vez de travar, mas não há fila de sincronização.
- Nada aqui é orientação médica. O app soma o que foi registrado e compara com
  tabelas de referência públicas; decisão de tratamento é de quem acompanha a pessoa.

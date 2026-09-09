-- =============================================================================
-- HashiVita Nutri — schema Supabase
-- Registro alimentar com feedback nutricional para tireoidite de Hashimoto.
--
-- Uso pessoal: um usuario por conta. Sem hierarquia de papeis, sem organizacao,
-- sem clinica. Todo dado de refeicao pertence a exatamente um auth.users.
--
-- Nomes de campo de nutriente seguem o padrao Base44 (selenium_mcg, iodine_mcg,
-- vitamin_d_mcg, iron_mg, zinc_mg) — nunca os nomes em portugues.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- app_user — perfil da conta, 1:1 com auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.app_user (
  id                        uuid primary key references auth.users (id) on delete cascade,
  email                     text not null,
  full_name                 text not null default '',
  role                      text not null default 'user' check (role in ('admin', 'user')),
  age                       integer check (age is null or (age >= 0 and age <= 120)),
  sex                       text check (sex is null or sex in ('homem', 'mulher')),
  age_range                 text check (age_range is null or age_range in ('ate-18', '19-50', '50+')),
  has_hashimoto             boolean not null default false,
  hashimoto_medication_time text,
  health_conditions         text[] not null default '{}',
  onboarded                 boolean not null default false,
  created_date              timestamptz not null default now(),
  updated_date              timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- food — tabela de alimentos. Valores SEMPRE por 100 g (base TACO).
-- Leitura publica para usuarios autenticados; escrita so via painel/service role.
-- -----------------------------------------------------------------------------
create table if not exists public.food (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  emoji          text,
  category       text not null,
  energia_kcal   numeric(10, 3),
  proteina_g     numeric(10, 3),
  carboidrato_g  numeric(10, 3),
  sodium_mg      numeric(10, 3),
  selenium_mcg   numeric(10, 3),
  iodine_mcg     numeric(10, 3),
  vitamin_d_mcg  numeric(10, 3),
  iron_mg        numeric(10, 3),
  zinc_mg        numeric(10, 3),
  default_unit   text,
  default_grams  numeric(10, 2),
  created_at     timestamptz not null default now()
);

create unique index if not exists food_name_unique_idx on public.food (lower(name));
create index if not exists food_name_search_idx on public.food (name text_pattern_ops);

-- -----------------------------------------------------------------------------
-- meal_log — cada alimento registrado pelo usuario.
-- nutrients guarda o resultado ja calculado no app (regra de tres sobre food),
-- congelado no momento do registro para o historico nao mudar se a TACO mudar.
-- food_name/food_emoji sao desnormalizados pelo mesmo motivo.
-- -----------------------------------------------------------------------------
create table if not exists public.meal_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  food_id    uuid references public.food (id) on delete set null,
  food_name  text not null,
  food_emoji text,
  quantity   numeric(10, 2),
  unit       text,
  grams      numeric(10, 2) not null check (grams > 0),
  nutrients  jsonb not null default '{}'::jsonb,
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists meal_log_user_logged_at_idx
  on public.meal_log (user_id, logged_at desc);

-- -----------------------------------------------------------------------------
-- Criacao automatica do perfil no signup.
-- full_name vem do metadata enviado por supabase.auth.signUp({ options: { data } }).
-- Com "Confirm email" ativo a linha ja nasce aqui, antes da confirmacao.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_user (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- updated_date automatico em app_user
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

drop trigger if exists app_user_touch_updated_date on public.app_user;
create trigger app_user_touch_updated_date
  before update on public.app_user
  for each row execute function public.touch_updated_date();

-- =============================================================================
-- RLS — o usuario so enxerga a propria conta e as proprias refeicoes.
-- =============================================================================
alter table public.app_user enable row level security;
alter table public.food     enable row level security;
alter table public.meal_log enable row level security;

drop policy if exists app_user_select_own on public.app_user;
create policy app_user_select_own on public.app_user
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists app_user_update_own on public.app_user;
create policy app_user_update_own on public.app_user
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Rede de seguranca: se o trigger nao rodar, o proprio usuario cria a sua linha.
drop policy if exists app_user_insert_own on public.app_user;
create policy app_user_insert_own on public.app_user
  for insert to authenticated with check (id = (select auth.uid()));

-- food e catalogo compartilhado: qualquer autenticado le, ninguem escreve pelo app.
drop policy if exists food_select_authenticated on public.food;
create policy food_select_authenticated on public.food
  for select to authenticated using (true);

drop policy if exists meal_log_select_own on public.meal_log;
create policy meal_log_select_own on public.meal_log
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists meal_log_insert_own on public.meal_log;
create policy meal_log_insert_own on public.meal_log
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists meal_log_update_own on public.meal_log;
create policy meal_log_update_own on public.meal_log
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists meal_log_delete_own on public.meal_log;
create policy meal_log_delete_own on public.meal_log
  for delete to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Funcoes de trigger nao devem ficar expostas como RPC em /rest/v1/rpc/.
-- (linter do Supabase: 0028/0029 security_definer_function_executable)
-- -----------------------------------------------------------------------------
revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.touch_updated_date() from public, anon, authenticated;

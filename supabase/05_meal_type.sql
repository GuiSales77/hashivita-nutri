-- =============================================================================
-- HashiVita Nutri — tipo de refeição em meal_log
--
-- ⚠️ NÃO APLICADO. Rode você no SQL Editor do painel:
--    https://supabase.com/dashboard/project/fzhzdwwaartjulmqysrs/sql
--
-- ⚠️ ORDEM IMPORTA: aplique este arquivo ANTES de instalar a versão nova do
--    app. O app passa a enviar `meal_type` em todo registro de refeição; sem a
--    coluna, o insert falha e o usuário não consegue registrar nada.
--
-- Idempotente: pode rodar mais de uma vez.
-- =============================================================================

-- `create type` não aceita `if not exists`, daí o bloco.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'meal_type') then
    create type meal_type as enum ('cafe_da_manha', 'almoco', 'lanche', 'jantar', 'ceia');
  end if;
end $$;

-- O default 'lanche' cobre as linhas que já existem: elas foram registradas
-- antes de haver tipo, e "lanche" é o balde mais neutro. Quem quiser
-- reclassificar o histórico pode fazer por UPDATE depois.
alter table public.meal_log
  add column if not exists meal_type meal_type not null default 'lanche';

-- A Home busca "as refeições de hoje deste usuário, agrupadas por tipo".
-- O índice acompanha exatamente esse formato de consulta.
create index if not exists idx_meal_log_type
  on public.meal_log (user_id, meal_type, logged_at);

-- Confere depois de rodar:
select meal_type, count(*) as registros
from public.meal_log
group by meal_type
order by meal_type;

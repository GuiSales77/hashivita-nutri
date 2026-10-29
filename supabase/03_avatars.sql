-- =============================================================================
-- HashVita Nutri — foto de perfil (avatar)
--
-- Já aplicado no projeto (migrations `avatar_url_and_avatars_bucket` e
-- `avatars_select_own_only`).
-- Idempotente: pode rodar de novo no SQL Editor sem duplicar nada.
--   https://supabase.com/dashboard/project/fzhzdwwaartjulmqysrs/sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Coluna que guarda a URL pública da foto
--    O app grava com um ?v=timestamp no fim, pra furar o cache do CDN quando a
--    foto é trocada — o nome do arquivo no bucket é sempre o mesmo.
-- -----------------------------------------------------------------------------
alter table public.app_user add column if not exists avatar_url text;

-- -----------------------------------------------------------------------------
-- 2) Bucket `avatars` — leitura pública, escrita só do dono
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- -----------------------------------------------------------------------------
-- 3) Policies
--
--    O app grava sempre em `{user_id}.png`, então o nome do arquivo é o próprio
--    uid — é isso que amarra a escrita ao dono. Caminho plano (sem pasta), por
--    isso a checagem é no `name` inteiro e não em storage.foldername().
-- -----------------------------------------------------------------------------
-- ⚠️ A policy antiga `avatars_public_read` liberava SELECT do bucket INTEIRO
-- para o role `public`. Isso habilitava o endpoint de listagem: qualquer pessoa
-- com a chave publishable (que vai dentro do APK) conseguia LISTAR o bucket e
-- obter o uid e a foto de todo mundo. Foi removida.
drop policy if exists avatars_public_read on storage.objects;

-- O SELECT voltou restrito ao próprio arquivo. É necessário porque o app envia a
-- foto com upsert, e no Postgres `on conflict do update` exige poder LER a linha
-- em conflito: sem nenhuma policy de SELECT, a troca de foto falha com
-- "new row violates row-level security policy".
-- Listar o bucket agora devolve só o arquivo de quem pediu.
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '.png'
  );

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '.png'
  );

-- update precisa de policy própria porque o app usa upsert: true — sem ela a
-- SEGUNDA troca de foto falha (a primeira é insert, as seguintes são update).
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '.png'
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '.png'
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '.png'
  );

-- -----------------------------------------------------------------------------
-- Nota sobre privacidade
--
-- O bucket é PÚBLICO para leitura — quem tiver a URL vê a foto, sem login. O que
-- mudou é que não dá mais para DESCOBRIR as URLs: sem SELECT para o role
-- `public`, a listagem do bucket volta vazia, e o nome do arquivo é um uuid.
-- É o que o app espera (getPublicUrl). Se foto de perfil for tratada como dado
-- sensível, a alternativa é bucket privado + createSignedUrl com validade curta,
-- mas aí o `avatar_url` salvo expira e precisa ser regerado a cada leitura.
-- -----------------------------------------------------------------------------

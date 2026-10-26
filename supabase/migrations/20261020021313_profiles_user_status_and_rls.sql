-- SPEC 06 — Tabla de usuarios: user_status, preferencias y policies RLS
-- Añade el estado de usuario y preferencias a public.profiles, actualiza el
-- trigger de alta para que los usuarios nuevos nazcan `pending`, crea helpers
-- security definer para evitar recursión de RLS, un trigger anti-escalada y
-- las 4 policies de profiles (SELECT/INSERT/UPDATE/DELETE).

-- ============================================================================
-- Enum de estado de usuario
-- ============================================================================

create type public.user_status as enum ('pending', 'active');

-- ============================================================================
-- Columnas nuevas en profiles
-- ============================================================================

alter table public.profiles
  add column status public.user_status not null default 'active',
  add column avatar_url text,
  add column notify_on_post boolean not null default true,
  add column daily_summary_enabled boolean not null default true;

-- ============================================================================
-- Trigger de alta de usuarios: los nuevos nacen `pending`
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, status)
  values (
    new.id,
    case
      when new.raw_app_meta_data ->> 'role' in ('admin', 'director', 'educator', 'tutor')
        then (new.raw_app_meta_data ->> 'role')::public.user_role
      else 'tutor'::public.user_role
    end,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'pending'::public.user_status
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- Helpers security definer (evitan la recursión de RLS al leer profiles)
-- ============================================================================

create or replace function public.is_active_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'director')
      and p.status = 'active'
  );
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.status = 'active'
  );
$$;

revoke all on function public.is_active_manager() from public, anon;
revoke all on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_manager() to authenticated;
grant execute on function public.is_active_admin() to authenticated;

-- ============================================================================
-- Trigger anti-escalada: un usuario no-manager no cambia su role/status
-- ============================================================================

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id = (select auth.uid())
    and not public.is_active_manager()
    and (
      new.role is distinct from old.role
      or new.status is distinct from old.status
    )
  then
    raise exception 'No puedes cambiar tu propio rol o estado';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_privilege_escalation();

-- ============================================================================
-- Policies RLS de profiles
-- ============================================================================

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (status = 'active' or id = (select auth.uid()));

create policy "profiles_insert_managers"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_active_manager());

create policy "profiles_update_self_or_managers"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()) or public.is_active_manager())
  with check (id = (select auth.uid()) or public.is_active_manager());

create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (public.is_active_admin());

revoke all on table public.profiles from anon;

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_auth_admin', 'service_role') then
    return new;
  end if;

  if new.email is distinct from old.email and not public.is_active_admin() then
    raise exception 'Solo un admin puede cambiar el email';
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
    if new.id = (select auth.uid()) then
      raise exception 'No puedes cambiar tu propio rol o estado';
    end if;
    if new.role is distinct from old.role and not public.is_active_admin() then
      raise exception 'Solo un admin puede cambiar roles';
    end if;
    if not public.is_active_manager() then
      raise exception 'No autorizado para cambiar el estado';
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists "profiles_insert_managers" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (public.is_active_admin());

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_self_or_manager" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_active_manager());

create or replace function public.list_active_staff_profiles()
returns table (id uuid, full_name text, role public.user_role, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.role, p.avatar_url
  from public.profiles p
  where p.status = 'active'
    and p.role in ('admin', 'director', 'educator')
  order by p.full_name;
$$;

revoke all on function public.list_active_staff_profiles() from public, anon;
grant execute on function public.list_active_staff_profiles() to authenticated;

revoke truncate, trigger, references on public.profiles from authenticated;
revoke all on function public.prevent_self_privilege_escalation() from public, anon;

create index if not exists profiles_active_staff_full_name_idx
  on public.profiles (full_name)
  where status = 'active' and role in ('admin', 'director', 'educator');

# SPEC 06 — Tabla de Usuarios: `user_status`, Preferencias y Policies RLS

> **Estado:** aprobado
> **Depende de:** SPEC 05
> **Fecha:** 2026-10-19
> **Objetivo:** Adaptar `public.profiles` como tabla de usuarios, añadiendo `user_status`, preferencias de notificación y policies RLS de lectura global y autoedición segura, sin renombrar la tabla ni crear `daycares`.

## Scope

**In:**

- Nueva migración `supabase/migrations/20261019000000_profiles_user_status_and_rls.sql`.
- Crear el enum `public.user_status` con los valores `pending` y `active`.
- Añadir a `public.profiles`:
  - `status public.user_status not null default 'active'`
  - `avatar_url text`
  - `notify_on_post boolean not null default true`
  - `daily_summary_enabled boolean not null default true`
- Actualizar `public.handle_new_user()` para que los usuarios nuevos de `auth.users` nazcan con `status = 'pending'`.
- Crear helpers `security definer` para evitar recursión de RLS:
  - `public.is_active_manager()` → `admin` o `director` con `status = 'active'`.
  - `public.is_active_admin()` → `admin` con `status = 'active'`.
- Crear el trigger `profiles_prevent_self_privilege_escalation` que impide que un usuario no-manager cambie su propio `role` o `status`.
- Crear las 4 policies de `profiles`:
  - `SELECT`: perfiles activos para cualquier autenticado; el propio perfil siempre visible.
  - `INSERT`: solo `admin`/`director` activos.
  - `UPDATE`: el propio perfil o `admin`/`director` activos.
  - `DELETE`: solo `admin` activo.
- Revocar todo privilegio de tabla sobre `profiles` al rol `anon`.
- Regenerar `types/database.ts` vía MCP.
- Aplicar la migración al proyecto Supabase remoto con `apply_migration`.

**Out of scope (para specs futuros):**

- Renombrar `profiles` a `users` o crear una tabla `users` paralela.
- Cambiar los valores actuales de `user_role` (`admin`, `director`, `educator`, `tutor`).
- Crear `daycares` o añadir `daycare_id` (el proyecto es de un solo centro).
- Policies RLS de las otras 9 tablas: siguen con RLS habilitado y sin policies (deny-all).
- Flujo de activación de usuarios `pending`, invitaciones, Auth real, UI de gestión de usuarios.
- `supabase-js`/`@supabase/ssr`, cliente, reemplazo de mocks por queries.
- Storage, subida real de avatar o migración de fotos.
- Crear un usuario seed nuevo (se mantienen los 11 existentes).

## Data model

### Enum

```sql
create type public.user_status as enum ('pending', 'active');
```

### Columnas nuevas en `profiles`

```sql
alter table public.profiles
  add column status public.user_status not null default 'active',
  add column avatar_url text,
  add column notify_on_post boolean not null default true,
  add column daily_summary_enabled boolean not null default true;
```

Las 11 filas existentes quedan `active` por el default de la columna. El trigger de alta insertará `pending` explícitamente para los usuarios nuevos.

### Trigger de alta de usuarios

```sql
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
```

`status` **no** se lee de `raw_user_meta_data` para evitar que el usuario controle su propio estado en el signup.

### Helpers `security definer`

```sql
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
```

### Trigger anti-escalada

```sql
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
```

### Policies RLS

```sql
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
```

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-06-usuarios-perfiles-status-rls`. Verificar: `git branch --show-current`.
3. **Migración.** Crear `supabase/migrations/20261019000000_profiles_user_status_and_rls.sql` con el enum, columnas, trigger, helpers, trigger anti-escalada y policies. Verificar: revisión del SQL.
4. **Aplicar.** Aplicar vía MCP `apply_migration` con nombre `profiles_user_status_and_rls`. Verificar: `supabase_list_migrations` y `list_tables`.
5. **Tipos.** Regenerar `types/database.ts` vía MCP. Verificar: contiene `user_status` y las 4 columnas nuevas; `npx tsc --noEmit` limpio.
6. **Verificación de esquema.** `execute_sql`: columnas de `profiles`, enum `user_status`, `pg_policies` (4 policies), `pg_proc` de los helpers y del trigger, conteo de profiles (11, todos `active`).
7. **Verificación de seguridad.** Probar `is_active_manager()`/`is_active_admin()` con claims de tutor, director y admin; confirmar que `anon` no tiene grants.
8. **Cierre.** `get_advisors` (sin ERROR), `npm run lint`, `npm run build`, `git status --short`, `git diff`.

## Acceptance criteria

- [ ] La migración `profiles_user_status_and_rls` aparece en `supabase_list_migrations`.
- [ ] El enum `user_status` existe con `pending` y `active` en ese orden.
- [ ] `profiles` tiene `status user_status not null default 'active'`, `avatar_url text`, `notify_on_post boolean not null default true` y `daily_summary_enabled boolean not null default true`.
- [ ] `select count(*) from public.profiles` = 11 y las 11 filas tienen `status = 'active'`.
- [ ] `pg_get_functiondef('public.handle_new_user'::regproc)` contiene `'pending'::public.user_status` y no lee `status` desde `raw_user_meta_data`.
- [ ] `profiles` tiene RLS habilitado y exactamente estas 4 policies, todas `to authenticated`: `profiles_select_authenticated`, `profiles_insert_managers`, `profiles_update_self_or_managers`, `profiles_delete_admin`.
- [ ] `anon` no tiene privilegios de tabla sobre `public.profiles`.
- [ ] `is_active_manager()` e `is_active_admin()` son `security definer`, tienen `search_path=''` y solo `authenticated` puede ejecutarlas.
- [ ] Existe el trigger `profiles_prevent_self_privilege_escalation` (`before update`) y su función contiene la validación de `role`/`status`.
- [ ] Con claim de tutor, `is_active_manager()` = `false`; con claim de director = `true`; con claim de admin, `is_active_admin()` = `true`.
- [ ] `types/database.ts` incluye `user_status` y las 4 columnas nuevas; `npx tsc --noEmit` pasa.
- [ ] `npm run lint` y `npm run build` pasan.
- [ ] `get_advisors` no reporta ningún **ERROR**; los `WARN`/`INFO` se documentan.
- [ ] `git status --short` solo muestra la migración nueva, `types/database.ts` y este spec; no hay cambios en `app/`, `data/`, `references/` ni en otros specs.
- [ ] No se creó ningún usuario seed nuevo: el conteo de `profiles` sigue siendo 11.

## Decisions

- **Sí:** extender `public.profiles` en vez de renombrarla a `users` o crear una tabla paralela. Ya está referenciada por `children`, `classroom_educators`, `child_tutors` y `attendance_records`, y el trigger de Auth ya inserta allí.
- **Sí:** mantener `user_role` con `admin`, `director`, `educator` y `tutor`; solo se crea `user_status`. Los roles actuales mapean a la UI y están sembrados.
- **Sí:** omitir `daycare_id` y no crear `daycares`. El proyecto es de un solo centro; el aislamiento multi-centro queda fuera de alcance.
- **Sí:** añadir `avatar_url`, `notify_on_post` y `daily_summary_enabled`, como pide el schema de referencia.
- **Sí:** las 11 filas existentes quedan `active` por el default de la columna; los usuarios nuevos de `auth.users` nacen `pending` desde el trigger.
- **Sí:** implementar ahora las policies de `profiles` (el usuario lo decidió). Esto satisface el gate de SPEC 05 **solo para `profiles`**; las otras 9 tablas siguen deny-all.
- **Sí:** lectura global para autenticados, con la salvedad de que un perfil `pending` solo se ve a sí mismo. Autoedición permitida; `admin`/`director` gestionan cualquier perfil; solo `admin` elimina.
- **Sí:** helpers `security definer` con `search_path = ''` y grants mínimos para evitar la recursión de RLS.
- **Sí:** trigger anti-escalada para que un usuario no pueda cambiarse `role` o `status` por sí mismo.
- **Sí:** revocar `anon` de `profiles` como defensa en profundidad, aunque RLS ya lo bloquearía.
- **Sí:** una única migración para el cambio completo, aplicada por MCP y versionada en el repo.
- **No:** crear el usuario `fernando@google.com`. Ya hay 11 usuarios de desarrollo suficientes.
- **No:** implementar el flujo de activación de `pending`; queda para el spec de Auth/invitaciones.
- **No:** replicar literalmente las policies del spec de referencia con `daycare_id`; se adaptan al modelo de un solo centro.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Activar policies abre `profiles` a usuarios autenticados | Policies restrictivas por `status` y `role`; `anon` revocado; revisión con `get_advisors` |
| Recursión de RLS en policies que leen `profiles` | Helpers `security definer` con `search_path = ''`; RLS no forzado (`relforcerowsecurity = false`) |
| Un tutor podría autoascenderse a admin editando su perfil | Trigger `prevent_self_privilege_escalation` + policy de UPDATE |
| Usuarios nuevos `pending` sin flujo de activación | Intencional y documentado; se activan manualmente o en el spec de invitaciones |
| Regenerar `types/database.ts` produce diffs amplios | Revisar el diff; solo debe añadir el enum y las 4 columnas |
| El nombre del archivo de migración no coincide exactamente con la versión de MCP | Mismo timestamp en el nombre; el repo es la fuente de verdad |
| Las otras 9 tablas siguen deny-all | Fuera de alcance; el gate de seguridad general sigue vigente |

## What is **not** in this spec

- Renombrar `profiles` a `users` o crear una tabla `users`.
- Cambiar los valores de `user_role`.
- `daycares`, `daycare_id` o multi-centro.
- Policies RLS de las otras 9 tablas.
- Flujo de activación/invitaciones, UI de usuarios, Auth real o cliente Supabase.
- Storage o subida de avatares.
- Un usuario seed nuevo.
- Migrar los mocks a datos reales.

Cada una de esas, si llega, va en su propio spec.

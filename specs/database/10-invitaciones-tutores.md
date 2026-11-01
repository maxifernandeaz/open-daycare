# SPEC 10 — Invitaciones de Tutores y Vínculo con el Niño (Datos)

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 08
> **Fecha:** 2026-11-01
> **Objetivo:** Crear en Supabase la tabla `invitations`, los RPC de invitar/revocar/aceptar y las policies RLS que permiten al staff invitar y al tutor leer a su propio niño, guardando el consentimiento de fotos en `child_tutors`.

## Por qué este spec existe

SPEC 09 dejó explícitamente fuera el código de invitación, `child_tutors` y cualquier vínculo padre-hijo. Hoy `child_tutors` tiene RLS habilitado sin policies (deny-all), no existe una tabla donde guardar una invitación antes de que el tutor tenga cuenta y `child_tutors` no registra el consentimiento de fotos que pide la pantalla de activación.

Este spec resuelve solo la capa de datos. El correo con Resend, el modal de invitación y la pantalla real de `/activar-cuenta` van en SPEC 11.

## Scope

**In:**

- Migración `supabase/migrations/<timestamp>_tutor_invitations_and_tutor_rls.sql`:
  - Enum `public.invitation_status` con `pending`, `accepted`, `revoked`, `expired`.
  - Tabla `public.invitations` con `id`, `child_id`, `email`, `code`, `relationship`, `status`, `invited_by`, `expires_at`, `accepted_at`, `accepted_by`, `created_at`, `updated_at`.
  - Constraints: `email` normalizado a minúsculas y con forma de email, `code` de 5 caracteres del alfabeto permitido, `expires_at` obligatorio.
  - Índices: único en `code`, índice parcial único `(child_id, lower(email)) where status = 'pending'`, índices en `child_id` y `email`.
  - Trigger `invitations_set_updated_at` reutilizando `public.set_updated_at()`.
  - Columnas nuevas en `public.child_tutors`: `photo_consent boolean not null default false` y `photo_consent_at timestamptz`.
  - `alter table public.invitations enable row level security` y `alter table public.child_tutors enable row level security` (idempotente).
  - Policies de `invitations`: `SELECT`, `INSERT` y `UPDATE` solo para staff activo; `INSERT` exige `invited_by = auth.uid()`. Sin `DELETE` y sin `anon`.
  - Policies de `child_tutors`: `SELECT` para el propio tutor (`tutor_id = auth.uid()`) o staff activo. Sin `INSERT`/`UPDATE`/`DELETE` directos; las escrituras pasan por RPC `security definer`.
  - Policies de lectura del tutor en `children`, `child_health` y `child_allergies`, limitadas a los niños vinculados en `child_tutors`.
  - RPC `public.create_tutor_invitation(p_child_id uuid, p_email text, p_relationship text default null)` (`security invoker`, `search_path = ''`): normaliza email, valida staff y niño, reutiliza la invitación `pending` del mismo niño+email renovando 7 días, o genera un código único de 5 caracteres.
  - RPC `public.revoke_tutor_invitation(p_invitation_id uuid)` (`security invoker`, `search_path = ''`): pasa una invitación `pending` a `revoked`.
  - RPC `public.accept_tutor_invitation(p_code text, p_photo_consent boolean default false)` (`security definer`, `search_path = ''`): valida código, estado, expiración y email del JWT; inserta o actualiza `child_tutors` con consentimiento y marca la invitación como `accepted`.
  - RPC `public.get_invitation_preview(p_code text)` (`security definer`, `stable`, `search_path = ''`): devuelve `email`, `child_display_name`, `classroom_name` y `expires_at` para una invitación `pending` y vigente; 0 filas si no existe, venció o ya no está `pending`.
  - Grants: `revoke ... from public` en los cuatro RPC; `create_tutor_invitation`, `revoke_tutor_invitation` y `accept_tutor_invitation` con `grant execute ... to authenticated`; `get_invitation_preview` con `grant execute ... to anon, authenticated`; `anon` sin privilegios de tabla sobre `invitations` ni `child_tutors`.
- Regenerar `types/database.ts` vía MCP después de aplicar la migración.
- Verificación estructural con `supabase_list_migrations`, `list_tables`, `pg_policies`, `pg_proc` e `information_schema`.

**Out of scope (para specs futuros):**

- UI de invitación, modal en `/panel-aula`, envío con Resend y plantilla de correo: SPEC 11.
- `/activar-cuenta` real, `auth.admin.createUser`, `signInWithPassword` y activación de `profiles.status`: SPEC 11.
- Envío de recordatorios, cron de expiración, limpieza de invitaciones vencidas y webhooks de Resend.
- Rate limiting, CAPTCHA o auditoría de intentos de código.
- Revocar el vínculo de un tutor ya aceptado o editar su consentimiento desde la app.
- Invitaciones para staff, multi-centro o varios niños por invitación.
- Asistencia, bitácora, recogidas o cualquier otra lectura del portal de familias.
- Cambiar el seed de `child_tutors`: las filas existentes quedan con `photo_consent = false`.

## Data model

### Enum

```sql
create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);
```

### Tabla `invitations`

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  email text not null,
  code text not null unique,
  relationship text,
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_email_normalized check (email = lower(btrim(email))),
  constraint invitations_email_shape check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint invitations_code_shape check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$')
);

create unique index invitations_pending_child_email_idx
  on public.invitations (child_id, lower(email))
  where status = 'pending';

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (lower(email));
```

El alfabeto del código excluye `0`, `O`, `1`, `I` y `L` para que no se confundan al tipear. El código se guarda sin espacios y en mayúsculas; la UI lo muestra espaciado (`7K4P9` → `7 K 4 P 9`).

### Columnas nuevas en `child_tutors`

```sql
alter table public.child_tutors
  add column photo_consent boolean not null default false,
  add column photo_consent_at timestamptz;
```

Las filas del seed quedan con `photo_consent = false` y `photo_consent_at = null`. El consentimiento se registra al aceptar la invitación.

### RPCs

```sql
public.create_tutor_invitation(
  p_child_id uuid,
  p_email text,
  p_relationship text default null
) returns table (invitation_id uuid, code text, expires_at timestamptz)
language plpgsql
security invoker
set search_path = '';

public.revoke_tutor_invitation(p_invitation_id uuid)
returns void
language plpgsql
security invoker
set search_path = '';

public.accept_tutor_invitation(
  p_code text,
  p_photo_consent boolean default false
) returns uuid
language plpgsql
security definer
set search_path = '';

public.get_invitation_preview(p_code text)
returns table (
  email text,
  child_display_name text,
  classroom_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = '';
```

`get_invitation_preview` se define en SQL, no en PL/pgSQL:

```sql
create or replace function public.get_invitation_preview(p_code text)
returns table (
  email text,
  child_display_name text,
  classroom_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.email,
    coalesce(c.nickname, pg_catalog.split_part(c.full_name, ' ', 1)) as child_display_name,
    cl.name as classroom_name,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.classrooms cl on cl.id = c.classroom_id
  where i.code = pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')))
    and i.status = 'pending'
    and i.expires_at > pg_catalog.now();
$$;
```

Reglas de `create_tutor_invitation`:

- Exige `public.is_active_staff()` y que el niño exista.
- Normaliza `email` con `lower(btrim(...))` y lo valida con la misma expresión del constraint.
- `relationship` se guarda como `nullif(btrim(...), '')`.
- Si ya existe una invitación `pending` para el mismo `child_id` y email, conserva el `code`, actualiza `relationship` (si viene) y renueva `expires_at` a `now() + interval '7 days'`.
- Si no existe, genera 5 caracteres con `pg_catalog.random()` sobre el alfabeto permitido y reintenta hasta 5 veces si choca con el índice único.
- Inserta `invited_by = (select auth.uid())`.
- Todos los built-ins se califican con `pg_catalog.` porque `search_path = ''`.

Reglas de `accept_tutor_invitation`:

- Exige `auth.uid()` no nulo.
- Busca la invitación por `code` normalizado con `upper(btrim(...))` y la bloquea con `for update`.
- Si no existe: `Invitación inválida.`.
- Si está `accepted` y `accepted_by = auth.uid()`: devuelve el `child_id` (idempotente, para reintentos tras un fallo de activación de perfil).
- Si está `accepted` por otro usuario: `Esta invitación ya fue utilizada.`.
- Si está `revoked`: `Esta invitación fue revocada.`.
- Si `expires_at < now()`: lanza directamente `Esta invitación venció. Pedile a la guardería que la reenvíe.`. **No** intenta persistir `status = 'expired'`: un `UPDATE` seguido de `RAISE EXCEPTION` en la misma transacción se revierte, así que el estado se evalúa siempre por `expires_at`.
- Si `lower(invitation.email) <> lower(auth.jwt() ->> 'email')`: `El email de la sesión no coincide con la invitación.`.
- Inserta en `child_tutors` con `relationship` de la invitación, `is_legal_guardian = true`, `is_primary = false`, `photo_consent` del parámetro y `photo_consent_at = now()`. Si el vínculo ya existe, actualiza consentimiento, fecha y `relationship`.
- Marca la invitación como `accepted` con `accepted_at` y `accepted_by`.
- Devuelve el `child_id`.
- **No** cambia `profiles.status`: el trigger `profiles_prevent_self_privilege_escalation` de SPEC 06 bloquea que un tutor se autoactive. Ese cambio lo hace SPEC 11 con el cliente de servicio.

Reglas de `get_invitation_preview`:

- Es `security definer` porque la llama `anon` antes de autenticarse y no puede depender de RLS de `invitations`, `children` o `classrooms`.
- Normaliza el código con `upper(btrim(coalesce(p_code, '')))`.
- Solo devuelve filas con `status = 'pending'` y `expires_at > now()`.
- Devuelve `email` completo (la pantalla lo precarga), `child_display_name` como `coalesce(nickname, split_part(full_name, ' ', 1))` y `classroom_name`.
- No devuelve `child_id`, `invitation_id` ni datos médicos: solo lo mínimo para pintar la pantalla.
- Si no hay fila, devuelve 0 filas; la UI de SPEC 11 muestra el formulario de código manual.
- Solo `anon` y `authenticated` pueden ejecutarla; se revoca de `public`.

### Policies

`invitations`:

```sql
create policy "invitations_select_staff"
  on public.invitations
  for select
  to authenticated
  using (public.is_active_staff());

create policy "invitations_insert_staff"
  on public.invitations
  for insert
  to authenticated
  with check (
    public.is_active_staff()
    and invited_by = (select auth.uid())
  );

create policy "invitations_update_staff"
  on public.invitations
  for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());
```

`child_tutors`:

```sql
create policy "child_tutors_select_own_or_staff"
  on public.child_tutors
  for select
  to authenticated
  using (
    tutor_id = (select auth.uid())
    or public.is_active_staff()
  );
```

`children`, `child_health` y `child_allergies`:

```sql
create policy "children_select_linked_tutor"
  on public.children
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = children.id
      and ct.tutor_id = (select auth.uid())
  ));

create policy "child_health_select_linked_tutor"
  on public.child_health
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = child_health.child_id
      and ct.tutor_id = (select auth.uid())
  ));

create policy "child_allergies_select_linked_tutor"
  on public.child_allergies
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = child_allergies.child_id
      and ct.tutor_id = (select auth.uid())
  ));
```

`classrooms`, `allergies` y `profiles` ya tienen policies de lectura para `authenticated` en SPEC 06 y SPEC 08; no se tocan.

### Contratos TypeScript

```ts
export type InvitationStatus =
  Database["public"]["Enums"]["invitation_status"];

export type InvitationRow =
  Database["public"]["Tables"]["invitations"]["Row"];

export type CreateTutorInvitationResult = {
  invitation_id: string;
  code: string;
  expires_at: string;
};

export type InvitationPreview = {
  email: string;
  child_display_name: string;
  classroom_name: string;
  expires_at: string;
};
```

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-10-invitaciones-tutores`. Verificar: `git branch --show-current`.
3. **Migración.** Crear `<timestamp>_tutor_invitations_and_tutor_rls.sql` con enum, tabla, columnas, trigger, policies, RPCs y grants. Verificar: revisión del SQL.
4. **Aplicar.** Aplicar con MCP `apply_migration` y comprobar `list_migrations` y `list_tables`. Verificar: `invitations` y `invitation_status` existen; `child_tutors` tiene las dos columnas.
5. **Verificación de policies.** Consultar `pg_policies` y `information_schema.role_table_grants`. Verificar: 3 policies de `invitations` + 1 de `child_tutors` + 1 de `children` + 1 de `child_health` + 1 de `child_allergies` = 7 policies nuevas, todas `to authenticated`; `anon` sin grants de tabla en `invitations` ni `child_tutors`.
6. **Verificación de RPCs.** Consultar `pg_proc` y `pg_get_functiondef`. Verificar: firmas, `security invoker`/`definer`, `stable` en `get_invitation_preview`, `search_path = ''`, `pg_catalog.` en built-ins; grants `authenticated` para los tres RPC de escritura y `anon, authenticated` para el preview.
7. **Tipos.** Regenerar `types/database.ts` vía MCP. Verificar: `invitation_status`, `invitations`, las dos columnas de `child_tutors` y las cuatro funciones; `npx tsc --noEmit` limpio.
8. **Seguridad.** Pasar `supabase_get_advisors` (security y performance). Verificar: sin `ERROR`; documentar `WARN`/`INFO`.
9. **Cierre.** `npm run lint`, `npx tsc --noEmit`, `npm run build`; `git diff --name-only` solo migración, `types/database.ts` y este spec.

## Acceptance criteria

- [x] La migración `<timestamp>_tutor_invitations_and_tutor_rls` aparece en `supabase_list_migrations`.
- [x] El enum `public.invitation_status` existe con los valores `pending`, `accepted`, `revoked`, `expired` en ese orden.
- [x] `public.invitations` existe con las 12 columnas del Data model, `id` como PK y FKs a `children`, `profiles` (`invited_by`) y `profiles` (`accepted_by`).
- [x] `invitations.email` tiene `check (email = lower(btrim(email)))` y el check de forma de email; `invitations.code` tiene el check de 5 caracteres del alfabeto permitido.
- [x] Existe el índice único `invitations_pending_child_email_idx` sobre `(child_id, lower(email)) where status = 'pending'` y el índice único de `code`.
- [x] `child_tutors` tiene `photo_consent boolean not null default false` y `photo_consent_at timestamptz`; las filas existentes quedan en `false`/`null`.
- [x] `invitations` tiene RLS habilitado y exactamente las 3 policies `invitations_select_staff`, `invitations_insert_staff` e `invitations_update_staff`, todas `to authenticated`.
- [x] `child_tutors` tiene RLS habilitado y exactamente la policy `child_tutors_select_own_or_staff`, `to authenticated`, con el predicado `tutor_id = auth.uid()` o `is_active_staff()`.
- [x] `children`, `child_health` y `child_allergies` tienen una policy nueva cada una, `to authenticated`, limitada a los niños vinculados al `auth.uid()`.
- [x] `anon` no tiene privilegios de tabla sobre `public.invitations` ni `public.child_tutors`.
- [x] `public.create_tutor_invitation(uuid, text, text)` existe, es `security invoker`, tiene `search_path = ''` y solo `authenticated` puede ejecutarla.
- [x] `public.revoke_tutor_invitation(uuid)` existe, es `security invoker`, tiene `search_path = ''` y solo `authenticated` puede ejecutarla.
- [x] `public.accept_tutor_invitation(text, boolean)` existe, es `security definer`, tiene `search_path = ''` y solo `authenticated` puede ejecutarla.
- [x] `pg_get_functiondef('public.accept_tutor_invitation(text,boolean)'::regprocedure)` contiene `for update`, la validación de `auth.jwt() ->> 'email'`, el `on conflict (child_id, tutor_id)` y el branch idempotente `accepted_by = v_user_id`.
- [x] `pg_get_functiondef('public.accept_tutor_invitation(text,boolean)'::regprocedure)` **no** contiene `status = 'expired'`: al vencer lanza la excepción sin persistir un estado que el rollback revertiría.
- [x] `public.get_invitation_preview(text)` existe, es `security definer`, `stable`, tiene `search_path = ''`, devuelve las 4 columnas del contrato y tiene `execute` para `anon` y `authenticated`.
- [x] `pg_get_functiondef('public.get_invitation_preview(text)'::regprocedure)` contiene `coalesce(c.nickname, pg_catalog.split_part(c.full_name, ' ', 1))`, `i.status = 'pending'` y `i.expires_at > pg_catalog.now()`.
- [x] `pg_get_functiondef('public.create_tutor_invitation(uuid,text,text)'::regprocedure)` contiene `lower(btrim(`, `interval '7 days'`, el alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` y `pg_catalog.random()`.
- [x] `types/database.ts` incluye `invitation_status`, `invitations`, las dos columnas de `child_tutors` y las cuatro funciones; `npx tsc --noEmit` pasa.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] `supabase_get_advisors` no reporta ningún `ERROR`; los `WARN`/`INFO` quedan documentados en el informe.
- [x] `git diff --name-only` solo muestra la migración, `types/database.ts` y este spec; no hay cambios en `app/`, `data/` ni en otros specs.
- [x] No se escribe ninguna fila de prueba con SQL ad-hoc: la migración es la única fuente de cambios.

## Decisions

- **Sí:** tabla `invitations` separada de `child_tutors`. Antes de aceptar no existe un `profiles` al que apuntar `tutor_id`, y hace falta guardar email, código, expiración y estado.
- **Sí:** enum `invitation_status` en vez de `text` con check. Los estados son finitos y el tipo evita valores inválidos desde PostgREST.
- **Sí:** 7 días de vigencia. Es el equilibrio entre seguridad y tiempo real para que una familia abra el correo.
- **Sí:** código de 5 caracteres sin `0/O/1/I/L`. Mantiene el formato del mockup (`7 K 4 P 9`) y reduce errores de tipeo.
- **Sí:** reenviar conserva el mismo código y renueva 7 días. El tutor puede tener el correo viejo abierto y el staff no necesita explicar un código nuevo.
- **Sí:** una sola invitación `pending` por `(child_id, lower(email))` con índice parcial único. Evita duplicados y carreras al reenviar.
- **Sí:** `relationship` opcional. El mockup no lo pide y el staff puede no conocer el parentesco; `child_tutors.relationship` acepta `null`.
- **Sí:** `photo_consent` en `child_tutors`, no en `profiles`. El consentimiento es por niño, no una preferencia global de la cuenta.
- **Sí:** `is_legal_guardian = true` e `is_primary = false` al aceptar. La invitación la envía la guardería a un tutor legal; no se autoasigna primario para no chocar con el índice `child_tutors_one_primary_idx`.
- **Sí:** `accept_tutor_invitation` es `security definer` y exige que el email del JWT coincida con el de la invitación. Es la única forma de que el tutor inserte su vínculo sin abrir `INSERT` directo en `child_tutors`.
- **Sí:** `get_invitation_preview` es `security definer`, `stable` y ejecutable por `anon`. Es la única lectura previa al login: devuelve solo email, nombre visible del niño, aula y vencimiento, nunca IDs ni datos médicos.
- **Sí:** `create_tutor_invitation` y `revoke_tutor_invitation` son `security invoker`. Las policies de staff ya autorizan la fila y así la RLS sigue siendo la última palabra.
- **Sí:** el RPC de aceptación no toca `profiles.status`. El trigger `profiles_prevent_self_privilege_escalation` de SPEC 06 lo bloquearía; SPEC 11 activa el perfil con el cliente de servicio, que no tiene `auth.uid()`.
- **Sí:** el RPC de aceptación es idempotente para el mismo tutor. Si falla la activación del perfil después de vincular, se puede reintentar sin un segundo vínculo.
- **Sí:** lectura del tutor limitada a `children`, `child_health` y `child_allergies`. `classrooms`, `allergies` y `profiles` ya son legibles por `authenticated` desde SPEC 06/08.
- **No:** `DELETE` de invitaciones. Se revocan con `status = 'revoked'` para conservar el historial.
- **No:** cron de expiración. El enum conserva `expired` para uso futuro, pero la vigencia se evalúa por `expires_at` en `get_invitation_preview` y `accept_tutor_invitation`; no se persiste `expired` dentro de una transacción que termina en excepción.
- **No:** rate limiting ni auditoría de códigos. Se documenta como riesgo y se deja para un spec de seguridad si el flujo sale de desarrollo.
- **No:** tocar el seed de `child_tutors`. Los tutores existentes son datos de maqueta y no tienen consentimiento real.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un código de 5 caracteres se puede adivinar por fuerza bruta | Alfabeto de 31 caracteres (~28,6M combinaciones), solo invitaciones `pending`, email del JWT obligatorio y 7 días de vigencia; rate limiting queda fuera y anotado |
| `security definer` en `accept_tutor_invitation` podría saltarse RLS de más | `search_path = ''`, validación explícita de código, estado, expiración y email del JWT, y solo inserta el vínculo del propio `auth.uid()` |
| `get_invitation_preview` es público y permite enumerar códigos | Solo responde a `pending` + vigente, devuelve 4 campos sin IDs ni datos médicos y el código tiene ~28,6M combinaciones; rate limiting queda fuera y anotado |
| El trigger anti-escalada bloquea la activación del perfil | La activación de `profiles.status` se hace en SPEC 11 con el cliente de servicio, donde `auth.uid()` es `null` |
| `search_path = ''` rompe los built-ins sin calificar | Todos los built-ins de las funciones usan `pg_catalog.`; se verifica con `pg_get_functiondef` |
| Reenviar dos veces en paralelo crea dos invitaciones | Índice parcial único `(child_id, lower(email)) where status = 'pending'` y reintento de código solo ante `unique_violation` |
| El tutor ve niños de otro centro o de otra familia | Policies con `EXISTS` contra `child_tutors.tutor_id = auth.uid()`; `anon` revocado |
| Regenerar `types/database.ts` produce un diff amplio | Revisar el diff; solo debe sumar el enum, la tabla, las dos columnas y las cuatro funciones |
| Las filas seed de `child_tutors` quedan sin consentimiento | Es correcto: no hay consentimiento real; el flujo nuevo lo registra al aceptar |

## What is **not** in this spec

- Modal de invitación en `/panel-aula`, envío con Resend y plantilla de correo (SPEC 11).
- `/activar-cuenta` real, creación de usuarios, login y activación de `profiles.status` (SPEC 11).
- Recordatorios, cron de expiración, webhooks de Resend, rate limiting o CAPTCHA.
- Revocar vínculos ya aceptados o editar el consentimiento desde la app.
- Invitaciones de staff, multi-centro o varios niños por invitación.
- Lecturas de asistencia, bitácora o recogidas para tutores.
- Cambios en el seed de `child_tutors`.

Cada una de esas, si llega, va en su propio spec.

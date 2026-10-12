# SPEC 05 — Esquema Inicial de Base de Datos (Supabase)

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03, SPEC 04
> **Fecha:** 2026-10-12
> **Objetivo:** Crear en el proyecto Supabase el esquema inicial de Postgres (perfiles con Auth, aulas, educadores, niños, salud/alergias, tutores, personas autorizadas y asistencia) como migraciones SQL versionadas y sembrarlo con los datos ficticios de SPEC 01–04.

## Scope

**In:**

- `supabase/migrations/20261012000000_init_schema.sql`: enums, 10 tablas, claves foráneas, índices, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (10 tablas) y los triggers `handle_new_user` y `set_updated_at`.
- `supabase/migrations/20261012000100_seed.sql`: seed de `auth.users`, perfiles, catálogos y los datos de los mocks de SPEC 01–04.
- Aplicación de ambas migraciones al proyecto Supabase remoto vía MCP (`apply_migration`).
- `types/database.ts` generado con MCP (`generate_typescript_types`).
- Verificación con MCP: `list_tables`, `execute_sql` (conteos), `list_migrations`, `get_advisors`.

**Out of scope (para specs futuros):**

- Policies RLS: las tablas se crean **con** `enable row level security` y **sin** policies (deny-all). Las policies son el gate previo a integrar la app y van en un spec de seguridad. **Gate explícito:** ningún spec de integración con la app empieza sin el spec de policies aprobado.
- Integración con la app: `supabase-js`/`@supabase/ssr`, cliente, reemplazar `data/mock*.ts` por queries, Auth real (login/activación).
- `daily_logs` (bitácora diaria), `pickups` (cola de salidas), `notices` (avisos) y `health_protocols`.
- Supabase Storage y cualquier campo de foto/avatar.
- Multi-centro (`center_id`): un único centro hardcodeado.
- CLI local de Supabase (`supabase start`, `config.toml`), branches y migración de datos reales.

## Data model

Enums (valores en inglés; el mapeo a las etiquetas de la UI queda en la app):

```sql
create type user_role as enum ('admin', 'director', 'educator', 'tutor');
create type gender as enum ('boy', 'girl', 'other');            -- nino / nina / no_especificado
create type schedule as enum ('full_day', 'mornings_with_lunch', 'mornings_only', 'afternoon');
```

Tablas (`public`, `uuid` con `gen_random_uuid()`, `timestamptz` UTC, `created_at`/`updated_at` en `now()`):

| Tabla | Columnas clave |
| --- | --- |
| `profiles` | `id uuid pk → auth.users(id)`, `role user_role default 'tutor'`, `full_name`, `email`, `phone` |
| `classrooms` | `id`, `slug unique` (`cunas`/`soles`/`estrellitas`), `name`, `age_range`, `age_min_months`, `age_max_months`, `tagline`, `description`, `capacity int null`, `recommended bool` |
| `classroom_educators` | `id`, `classroom_id → classrooms`, `educator_id → profiles`, `is_lead bool`, único `(classroom_id, educator_id)` |
| `children` | `id`, `full_name`, `nickname`, `birth_date date`, `gender gender`, `document`, `classroom_id → classrooms`, `primary_educator_id → profiles`, `schedule schedule` |
| `child_health` | `child_id pk → children`, `pediatrician_name`, `pediatrician_phone`, `nap_notes`, `special_care_notes`, `medication_consent bool default false`, `urgent_medical_flag bool default false`, `vaccination_note` |
| `allergies` | `id`, `code unique` (`none`/`aplv`/`gluten`/`nuts`/`egg`/`fish`), `label`, `is_none bool` |
| `child_allergies` | `child_id → children`, `allergy_id → allergies`, `notes`, pk `(child_id, allergy_id)` |
| `child_tutors` | `id`, `child_id → children`, `tutor_id → profiles`, `relationship`, `is_legal_guardian bool`, `is_primary bool not null default false`, único `(child_id, tutor_id)` |
| `authorized_pickup_persons` | `id`, `child_id → children`, `full_name`, `relationship`, `document`, `phone`, `is_active bool default true` |
| `attendance_records` | `id`, `child_id → children`, `attendance_date date`, `check_in_at`, `check_out_at`, `recorded_by → profiles`, `notes`, único `(child_id, attendance_date)` |

Convenciones:

- Índices en cada FK no cubierta por un `unique`.
- Ausencia = **no hay fila** en `attendance_records` para ese `(child_id, attendance_date)`.
- `capacity` queda `null`: los mocks solo dan vacantes, no capacidad real.
- Trigger `public.handle_new_user()` (`security definer`, `set search_path = ''`) que inserta `profiles` al crear un `auth.users`, tomando `full_name` y `role` de `raw_user_meta_data`/`raw_app_meta_data`. Se hace `revoke execute ... from public, anon, authenticated`.
- RLS habilitado en las 10 tablas **sin policies** (deny-all). Las policies quedan para el spec de seguridad.
- Índice parcial único `child_tutors_one_primary_idx on child_tutors (child_id) where is_primary`: a lo sumo un tutor primario por niño.
- `updated_at` se mantiene con el trigger `public.set_updated_at()` (`security invoker`, `set search_path = ''`), uno por tabla.

Seed (valores exactos tomados de `data/mock*.ts`):

- `auth.users` + `profiles`: staff Elena Morales (director), Carlos Méndez, Camila Rivas, Sofía Navarro (educator) y tutores de los mocks (David Gómez, Lucía Fernández, Roberto Navarro, Lucía Martín, Marta Vázquez, Raúl Torres, Irene Cruz).
- `classrooms`: Cunas, Soles, Estrellitas (de `mock-enrollment.ts`), con Estrellitas marcada como la del roster de SPEC 02.
- `allergies`: los 6 chips de `enrollmentScreen.allergyChips`.
- `children`: los 6 de `classroomPanel.students` con `birth_date` = 2024-10-24 menos la edad en meses del mock, todos en `estrellitas`.
- `child_health` + `child_allergies`: Mateo → `aplv` (urgente, consentimiento), Martina → `gluten`, Emma → urgente (control térmico), resto → `none`.
- `child_tutors`: según `tutorLabel` del roster; Mateo con dos tutores (David Gómez y Lucía Fernández, SPEC 03).
- `authorized_pickup_persons`: las 3 de `homeConfig.authorizedPeople` para Mateo y las de `classroomPanel.pickups` (Roberto → Sofía, Carmen → Lucas).
- `classroom_educators`: Estrellitas → Elena (lead) + Carlos; Soles → Camila (lead); Cunas → Sofía.
- `attendance_records`: día 2024-10-24 con los check-in del roster (Mateo 08:35, Lucas 08:50, Martina 08:20, Sofía 08:35 + salida 13:00, Emma entrada); Leo sin fila (ausente).

## Implementation plan

1. **Spec.** Escribir este documento (`Borrador` → `Aprobado`). Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-05-esquema-base-datos-inicial`. Verificar: `git branch --show-current`.
3. **Init schema.** Crear `supabase/migrations/20261012000000_init_schema.sql` con enums, las 10 tablas, FKs e índices (incluido el índice parcial único `child_tutors_one_primary_idx`), `ENABLE ROW LEVEL SECURITY` en las 10 tablas y las funciones/triggers `set_updated_at` (uno por tabla) y `handle_new_user`. Verificar: revisión del SQL.
4. **Aplicar schema.** Aplicar la migración vía MCP `apply_migration`. Verificar: `list_tables` muestra las 10 tablas y los 3 enums.
5. **Seed.** Crear `supabase/migrations/20261012000100_seed.sql`. Verificar: revisión del SQL.
6. **Aplicar seed.** Aplicar vía MCP. Verificar con `execute_sql`: `classrooms=3`, `allergies=6`, `children=6`, `profiles=11`, `attendance_records=5`.
7. **Tipos.** Generar `types/database.ts` vía MCP. Verificar: `npx tsc --noEmit` limpio.
8. **Verificación final.** `list_migrations`; verificar `relrowsecurity = true` en las 10 tablas; `get_advisors` (sin ERROR; documentar WARN/INFO); `npm run lint`; `git status`.

## Acceptance criteria

- [ ] `supabase_list_tables` devuelve exactamente `profiles`, `classrooms`, `classroom_educators`, `children`, `child_health`, `allergies`, `child_allergies`, `child_tutors`, `authorized_pickup_persons`, `attendance_records`.
- [ ] Los enums `user_role`, `gender` y `schedule` existen con los valores definidos.
- [ ] `select count(*) from children` = 6; `classrooms` = 3; `allergies` = 6; `attendance_records` = 5.
- [ ] Mateo tiene la alergia `aplv` con `urgent_medical_flag = true`; Martina tiene `gluten`; Sofía, Lucas, Emma y Leo tienen la alergia `none`.
- [ ] Mateo tiene dos tutores (`child_tutors` con David Gómez y Lucía Fernández) y 3 personas autorizadas.
- [ ] Insertar un segundo `child_tutors` con `is_primary = true` para el mismo niño falla por el índice parcial `child_tutors_one_primary_idx`.
- [ ] Existe un `attendance_records` para Mateo con `check_in_at` a las 08:35 del 2024-10-24 y ninguno para Leo.
- [ ] Insertar un `auth.users` nuevo crea automáticamente su fila en `profiles` (trigger `handle_new_user`).
- [ ] Las 10 tablas tienen RLS habilitado sin policies: `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'` devuelve `true` en las 10.
- [ ] `supabase_list_migrations` incluye las dos migraciones aplicadas.
- [ ] `types/database.ts` existe, cubre las 10 tablas y `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa y `data/mock.ts`, `data/mock-classroom.ts`, `data/mock-auth.ts`, `data/mock-enrollment.ts` y todos los `app/**` quedan sin cambios.
- [ ] `get_advisors` no reporta ningún **ERROR**; los `WARN`/`INFO` se documentan en el informe.

## Decisions

- **Sí:** tipos `uuid` + `timestamptz` + nombres y enums en inglés (regla del repo). `profiles.id` debe ser `uuid` porque referencia `auth.users`.
- **Sí:** 10 tablas derivadas de los mocks, con `daily_logs`, `pickups`, `notices` y `health_protocols` diferidos a specs futuros.
- **Sí:** `profiles` única con `role` (`user_role`) + `child_tutors` + `authorized_pickup_persons` separada. Un tutor es un `profiles` con `role = 'tutor'`.
- **Sí:** `children` + `child_health` separadas: la ficha de SPEC 04 queda repartida entre identidad/matrícula y salud.
- **Sí:** catálogo `allergies` + puente `child_allergies`, con `is_none` para "Sin alergias conocidas".
- **Sí:** `classroom_educators` (join) en vez de `educator_id` en `classrooms`, para soportar turnos. `children.primary_educator_id` guarda la educadora tutora del formulario de SPEC 04.
- **Sí:** `attendance_records` propia; ausencia = sin fila.
- **Sí:** una única opción de entrega: SQL versionado en `supabase/migrations/` **y** aplicado por MCP. Los archivos del repo son la fuente de verdad; la versión que registra MCP puede no coincidir exactamente con el nombre del archivo, por eso los nombres llevan el mismo timestamp.
- **Sí:** seed que inserta en `auth.users` (patrón de desarrollo) para poder poblar `profiles`, `child_tutors` y `classroom_educators` completos. IDs fijos + `on conflict do nothing`.
- **Sí:** `photo_url`/Storage fuera de alcance; **RLS habilitado sin policies** (deny-all), con las policies diferidas al spec de seguridad. **Gate explícito:** ningún spec de integración con la app empieza hasta que el spec de policies RLS esté aprobado.
- **Sí:** los 6 niños van a `estrellitas` para mantener el nombre "Aula Estrellitas" que usan SPEC 02/03/04, aunque sus edades (14–22 meses) no calcen con el rango 2–3 años del mock de SPEC 04.
- **Sí:** `capacity` queda `null`: los mocks dan vacantes, no capacidad.
- **No:** UUIDv7/`bigint identity` como PK. Aunque el best-practices de Supabase desaconseja UUIDv4 por fragmentación a gran escala, aquí el volumen es pequeño, se decide por consistencia con `auth.users` e IDs no adivinables; se deja anotado como revisión futura.
- **No:** `apply_migration` está pensado para remoto; no se usa un entorno local porque no hay CLI ni `supabase start` en el proyecto.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Tablas en `public` con RLS sin policies → deny-all vía Data API | Aceptado y documentado; la app aún no se conecta. Las policies y la exposición se definen en el spec de seguridad, gate previo a integrar |
| `none` + otra alergia no se garantiza en BD | Aceptado; la exclusividad de `none` respecto del resto de alergias se resuelve en el spec de integración con la app (el esquema inicial no lo impone) |
| El proyecto tiene un event trigger de RLS automático | La migración habilita RLS explícitamente en las 10 tablas para no depender de ese event trigger |
| `seed` que inserta en `auth.users` puede fallar o chocar con usuarios existentes | IDs `uuid` fijos + `on conflict do nothing`; si falla el insert en `auth`, se aborta la migración entera |
| Inconsistencias de los mocks (Sofía Navarro es niño y educadora; Carmen es abuela de Mateo y Lucas; rango de Estrellitas) | Se resuelven con decisiones explícitas en el seed y quedan registradas aquí |
| Nombres de archivo de migración vs. versión que registra MCP | Se usa el mismo timestamp en el nombre del archivo y en `apply_migration`; el repo es la fuente de verdad |
| `SECURITY DEFINER` en el trigger de `auth.users` | Se define con `set search_path = ''`, referencias calificadas `public.profiles` y `revoke execute` a `public`/`anon`/`authenticated` |
| UUIDv4 y fragmentación de índices al escalar | Aceptado a este volumen; alternativa UUIDv7/`identity` anotada en Decisions |
| `.env` solo tiene `SUPABASE_DB_PASSWORD` | Sin impacto: este spec no conecta la app a Supabase |

## What is **not** in this spec

- Policies RLS y auditoría de seguridad de las tablas (las tablas se crean con RLS habilitado, sin policies).
- Integración con la app: cliente Supabase, Auth real, reemplazo de mocks por queries.
- `daily_logs`, `pickups`, `notices`, `health_protocols`.
- Storage, fotos/avatares y multi-centro.
- CLI local de Supabase, branches y migración de datos reales.

Cada una de esas, si llega, va en su propio spec.

# SPEC 08 — Agregar Niño · Persistencia Real en Supabase

> **Estado:** aprobado
> **Depende de:** SPEC 04, SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-10-26
> **Objetivo:** Conectar `/agregar-nino` a Supabase para leer catálogos reales (salas, alergias y staff), validar en servidor y crear atómicamente `children`, `child_health` y `child_allergies` con RLS para staff, sin tocar `/panel-aula`.

## Por qué este spec existe

SPEC 04 dejó el formulario con datos mock y botones sin efecto a propósito. SPEC 05 creó las tablas con RLS deny-all y dejó las policies como gate previo a integrar la app; SPEC 06 solo resolvió `profiles`. Este spec cruza ese gate para las tablas de alta de niño y convierte la pantalla en el primer flujo de escritura real.

## Scope

**In:**

- Migración `supabase/migrations/<timestamp>_child_creation_rls_and_rpc.sql`:
  - Helper `public.is_active_staff()` (`security definer`, `stable`, `search_path = ''`): `role in ('admin','director','educator')` y `status = 'active'`.
  - Policies RLS: `SELECT` en `classrooms` y `allergies` para `authenticated`; en `children`, `child_health` y `child_allergies`: `SELECT`/`INSERT` para staff activo y `UPDATE`/`DELETE` solo `is_active_manager()`.
  - RPC `public.create_child(...)` (`security invoker`, `search_path = ''`) que inserta las tres filas en una sola transacción y devuelve el `uuid` del niño.
  - Grants: `revoke ... from public, anon` y `grant execute ... to authenticated` sobre helper y RPC.
- Regenerar `types/database.ts` vía MCP tras aplicar la migración.
- `app/agregar-nino/catalogs.ts` (nuevo): lee `classrooms`, `allergies` y `profiles` (staff activo) con el cliente de `utils/supabase/server.ts` y los mapea a opciones de UI.
- `app/agregar-nino/actions.ts` (nuevo): Server Action `createChild` con validación de servidor, llamada a `rpc("create_child")` y estado para `useActionState`.
- `app/agregar-nino/EnrollmentForm.tsx` (nuevo, `"use client"`): `<form id="childEnrollmentForm">`, `useActionState`, banner de éxito/error, reset del formulario y aviso no bloqueante de edad vs. sala. Recibe como prop la lista de rangos de edad por `classroom_id` (`ageMinMonths`, `ageMaxMonths`, `name`) y escucha `onChange` en el `<form>` para comparar en cliente el input `birth_date` contra el `classroom_id` seleccionado. Al pasar a `status === "success"`, incrementa una `key` en el contenedor de los campos (ej. `key={resetCount}`) para remontar `BirthDateField` y `AllergyChips` y así limpiar sus `useState` internos (o, alternativamente, estos componentes escuchan el evento nativo `onReset` del form para restaurar su estado).
- `app/agregar-nino/page.tsx`: `requireStaff()`, carga de catálogos y render de las secciones server como `children` de `EnrollmentForm`.
- Componentes de `app/components/agregar-nino/`:
  - `IdentitySection.tsx`, `BirthDateField.tsx`: `name` en los campos, fecha vacía por defecto, edad calculada en cliente y `required` en nombre/fecha.
  - `ClassroomSection.tsx`: recibe salas y educadoras desde Supabase; los valores son UUIDs reales.
  - `HealthSection.tsx`, `AllergyChips.tsx`: reciben alergias desde Supabase y envían un `input` oculto con los códigos seleccionados.
  - `SpecialCareSection.tsx`: `name` en todos los campos.
  - `PageHeader.tsx`: "Descartar" como enlace a `/panel-aula`; "Guardar Ficha" como submit con `form="childEnrollmentForm"`. El botón vive en un pequeño subcomponente cliente que usa `useFormStatus()` para leer el estado `pending` del form y deshabilitarse/mostrar carga al mismo tiempo que `StickyActionBar` (o queda dentro del árbol de `EnrollmentForm` para el mismo fin).
  - `StickyActionBar.tsx`: submit real, estado pendiente y cancelar como enlace.
- `data/mock-enrollment.ts`: se queda solo el copy de UI y un mapa visual por sala (`icon` y `vacancy`); se eliminan los catálogos mock de salas, educadoras y alergias. Los horarios y géneros usan directamente los valores del enum de Postgres como `value` (`boy`, `girl`, `other`, `full_day`, `mornings_with_lunch`, `mornings_only`, `afternoon`); `actions.ts` solo valida que sean valores válidos del enum, sin mapeos.
- Validación de servidor: nombre y fecha obligatorios, fecha no futura, aula existente, al menos una alergia, `none` excluyente, educadora/horario opcionales con default.
- Banner de éxito: "Niño registrado correctamente" con enlace a `/panel-aula` y reset a valores iniciales (fecha vacía, Soles, sin alergias).

**Out of scope (para specs futuros):**

- Migrar `/panel-aula` o cualquier otra pantalla de mocks a datos reales.
- Tutores (`child_tutors`), personas autorizadas, foto/avatar y Storage.
- Botón "Otra alergia específica" y escritura del catálogo `allergies`.
- Listado, edición o borrado de niños.
- Policies de `classroom_educators`, `child_tutors`, `authorized_pickup_persons`, `attendance_records` y `daily_logs`.
- Vacantes/capacidad reales (`capacity` sigue `null`).
- Notas por alergia individual, modo oscuro y tests automatizados.

## Data model

### RPC atómica

```sql
create or replace function public.create_child(
  p_full_name text,
  p_nickname text,
  p_birth_date date,
  p_gender public.gender,
  p_document text,
  p_classroom_id uuid,
  p_primary_educator_id uuid,
  p_schedule public.schedule,
  p_pediatrician_name text,
  p_pediatrician_phone text,
  p_nap_notes text,
  p_medication_consent boolean,
  p_urgent_medical_flag boolean,
  p_allergy_codes text[],
  p_allergy_notes text
) returns uuid
language plpgsql
security invoker
set search_path = ''
```

Reglas dentro de la función: rechaza nombre vacío, fecha futura, array de alergias vacío y `none` mezclado con otras; inserta `children` (`returning id`), `child_health` y tantas filas de `child_allergies` como códigos válidos; si un código no existe, aborta toda la transacción. `child_health.nap_notes` recibe el textarea de siesta; `child_allergies.notes` recibe la misma nota en cada alergia específica y `null` para `none`.

### Contratos TypeScript

```ts
export type ClassroomOption = {
  id: string; slug: string; name: string; ageRange: string;
  tagline: string | null; description: string | null;
  ageMinMonths: number; ageMaxMonths: number;
  recommended: boolean; icon: string; vacancyText?: string;
};
export type EducatorOption = { id: string; label: string };
export type AllergyOption = { id: string; code: string; label: string; isNone: boolean };

export type ChildFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"full_name" | "birth_date" | "classroom_id" | "allergies", string>>;
  childId?: string;
};
```

### Policies

`classrooms` y `allergies`: `SELECT` para `authenticated` (catálogos sin datos de menores). `children`, `child_health` y `child_allergies`: `SELECT`/`INSERT` con `public.is_active_staff()`, `UPDATE`/`DELETE` con `public.is_active_manager()`. `anon` sin privilegios. Los tutores no leen niños.

## Implementation plan

1. **Spec.** Escribir este documento en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-08-agregar-nino-persistencia-supabase`. Verificar: `git branch --show-current`.
3. **Migración.** Crear `<timestamp>_child_creation_rls_and_rpc.sql` con helper, policies y RPC. Verificar: revisión del SQL.
4. **Aplicar.** Aplicar con MCP `apply_migration` y comprobar `list_migrations`, `pg_policies` y `pg_proc`. Verificar: helper y RPC existen; 14 policies.
5. **Tipos.** Regenerar `types/database.ts`. Verificar: `create_child` tipada; `npx tsc --noEmit` limpio.
6. **Catálogos.** Crear `catalogs.ts` y adaptar `page.tsx` para leer salas, alergias y staff. Verificar: la pantalla muestra nombres de la BD y las 4 educadoras del seed.
7. **Cableado de campos.** Añadir `name`, `required`, fecha vacía y UUIDs reales; ocultar vacantes si falta el slug en el mapa visual. Verificar: `FormData` del navegador incluye todas las claves.
8. **Allergies y horarios.** Enviar códigos de alergia por `input` oculto y usar valores de enum en género/horario. Verificar: `none` excluye específicas y los valores llegan como `full_day`/`boy`.
9. **Server Action.** Crear `actions.ts` con validación de valores de enum (sin mapeos) y `rpc("create_child")`. Verificar: insert válido y errores de validación sin escritura.
10. **Cliente.** Crear `EnrollmentForm.tsx`, conectar `useActionState`, submit de cabecera y barra sticky, banner y reset (remontando los campos con `key={resetCount}` o vía `onReset` en los componentes con estado interno). Verificar: alta completa desde la UI y campos/estados internos limpios tras el éxito.
11. **Aviso de edad.** Añadir el aviso no bloqueante cuando la edad no cae en `age_min_months`/`age_max_months`. Verificar: aparece y el alta sigue funcionando.
12. **Verificación final.** `npm run lint`, `npx tsc --noEmit`, `npm run build`; Playwright 1440/375; alta real con Elena y con Camila; consulta read-only a las tablas; regresión de `/panel-aula`; screenshots en `.playwright-mcp/`.

## Acceptance criteria

- [ ] La migración aparece en `supabase_list_migrations`; `public.is_active_staff()` existe, es `security definer`, tiene `search_path = ''` y solo `authenticated` puede ejecutarla.
- [ ] Existen 14 policies nuevas: 1 en `classrooms`, 1 en `allergies`, 4 en `children`, 4 en `child_health` y 4 en `child_allergies`; todas `to authenticated` y ninguna permite `anon`.
- [ ] Las policies de `children`, `child_health` y `child_allergies` usan `is_active_staff()` para `SELECT`/`INSERT` e `is_active_manager()` para `UPDATE`/`DELETE`.
- [ ] `public.create_child` existe, es `security invoker`, tiene `search_path = ''` y solo `authenticated` puede ejecutarla.
- [ ] `/agregar-nino` muestra salas, 6 alergias y staff activo leídos de Supabase; el select incluye Carlos, Camila, Sofía y Elena.
- [ ] Las tarjetas de sala siguen mostrando “3 / 5 / 1 vacantes” desde el mapa visual, pero nombre, rango, tagline y descripción salen de `classrooms`.
- [ ] Ningún catálogo de salas, educadoras o alergias se lee de `data/mock-enrollment.ts` (verificable por `archivo:línea` de `catalogs.ts` y `page.tsx`).
- [ ] La fecha de nacimiento inicia vacía y es obligatoria; el nombre es obligatorio; sin ambos no se ejecuta el RPC.
- [ ] Una fecha futura devuelve “La fecha de nacimiento no puede ser futura.” en un elemento `role="alert"` y no inserta filas.
- [ ] Un alta válida crea exactamente 1 fila en `children`, 1 en `child_health` y 1 en `child_allergies` por cada código de alergia enviado (incluyendo `none`, cuya fila lleva `notes = null`).
- [ ] `children` guarda nombre, apodo, fecha, género, documento, aula, educadora y horario tal como se enviaron; los vacíos quedan `null`.
- [ ] `child_health` guarda pediatra, teléfono, `nap_notes`, `medication_consent` y `urgent_medical_flag`; `special_care_notes` y `vaccination_note` quedan `null`.
- [ ] La misma nota de alergia se copia en cada `child_allergies.notes`; con `none`, `notes` es `null`.
- [ ] Elegir `none` y otra alergia a la vez se rechaza en el servidor y no inserta nada, aunque se manipule el `input` oculto.
- [ ] Tras el alta se muestra el banner de éxito con enlace a `/panel-aula` y el formulario vuelve a fecha vacía, Soles, “Niño”, jornada completa, sin alergias y consentimiento marcado.
- [ ] “Guardar Ficha” de la cabecera y el botón sticky envían el mismo formulario una sola vez; ambos leen `useFormStatus()` y mientras está pendiente se deshabilitan y muestran estado de carga a la vez.
- [ ] “Descartar” y “Cancelar / Volver a la lista” navegan a `/panel-aula` sin escribir.
- [ ] Un desajuste entre la edad y el rango de la sala muestra un aviso visible, pero no impide el alta.
- [ ] La ruta no usa `createBrowserClient`, `service_role` ni claves secretas en `NEXT_PUBLIC_*`; toda la DB se consulta desde servidor.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan; la consola queda limpia en `/agregar-nino`.
- [ ] A 1440px y 375px no hay scroll horizontal; la barra sticky ancla en `left:0` en móvil y `left:288px` en desktop; `/panel-aula` no cambia visualmente.
- [ ] `git diff --name-only` muestra solo los archivos del Scope, la migración, `types/database.ts` y este spec.

## Decisions

- **Sí:** `children` + `child_health` + `child_allergies`; tutores, autorizados y foto quedan fuera porque el formulario no los pide.
- **Sí:** RPC `create_child` `security invoker` para atomicidad. Insertar desde JS en tres llamadas dejaría fichas huérfanas si falla la segunda; una transacción en Postgres lo evita.
- **Sí:** policies mínimas en este spec para las 5 tablas. SPEC 06 ya sentó el patrón de helpers; las otras 5 tablas siguen deny-all.
- **Sí:** tutores sin acceso a `children`. No hay vínculo `child_tutors` en este flujo y no se deben exponer menores a terceros.
- **Sí:** catálogos desde Supabase; de `data/mock-enrollment.ts` solo sobreviven copy, iconos y textos de vacantes.
- **Sí:** Server Action + `useActionState`, siguiendo SPEC 07. La sesión sigue en cookies `HttpOnly` y el navegador no consulta la DB.
- **Sí:** validación autoritativa en servidor y espejo en la RPC, porque una Server Action se puede invocar sin pasar por la UI.
- **Sí:** fecha de nacimiento vacía por defecto. El `2025-04-12` de SPEC 04 era para la maqueta y provocaría altas accidentales.
- **Sí:** `nap_notes` para el textarea de siesta/consuelo; `special_care_notes` queda para el spec de salud ampliada.
- **Sí:** misma nota en cada alergia seleccionada; es lo máximo que permite un único textarea sin rediseñar la pantalla.
- **Sí:** banner de éxito y reset; con `/panel-aula` aún mock, redirigir daría la impresión de que el alta no se guardó.
- **Sí:** aviso de edad no bloqueante; el seed ya tiene niños fuera del rango de Estrellitas y bloquear rompería datos existentes.
- **Sí:** documento opcional y sin `unique`; hay niños sin documento y no se quiere impedir hermanos o datos incompletos.
- **No:** redirigir a `/panel-aula` tras guardar; el niño no aparecería en la lista mock.
- **No:** migrar `/panel-aula` a datos reales; duplicaría el alcance y merece su propio spec.
- **No:** `zod` u otra librería de validación; no está instalada y la validación cabe en el Server Action.
- **No:** `service_role` para saltar RLS; las policies de staff son suficientes y no se expone ninguna clave.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Policies mal escritas exponen menores a tutores | Predicados con `is_active_staff()`/`is_active_manager()`, `anon` revocado y criterio de aceptación que inspecciona `pg_policies` |
| Insertar tres tablas desde JS deja datos huérfanos | RPC transaccional `create_child` |
| Server Action invocada sin UI omite validaciones | Validación duplicada en la RPC (nombre, fecha futura, `none` mezclado, códigos inexistentes) |
| Catálogos vacíos o error de query dejan el formulario inservible | Estado `catalogError` visible y submit deshabilitado; el seed garantiza 3 salas, 6 alergias y 4 staff |
| Cambiar el submit y `useActionState` rompe el layout/sticky de SPEC 04 | Barra dentro del `<form>` con `position: fixed`; comparación Playwright 1440/375 |
| Regenerar `types/database.ts` produce un diff amplio | Revisar el diff; solo debe añadir `Functions.create_child` |
| La RPC no aparece en PostgREST tras migrar | Recargar el schema cache y verificar `pg_proc` antes de probar la UI |
| El seed no tiene `admin` | Las policies usan `director`/`admin`; Elena (director) permite probar el flujo completo |
| Fechas futuras o edades atípicas | Validación de fecha + aviso de edad no bloqueante |

## What is **not** in this spec

- Migrar `/panel-aula` u otras pantallas a datos reales.
- Tutores, personas autorizadas, foto/avatar o Storage.
- “Otra alergia específica”, edición/borrado o listado de niños.
- Policies de las otras 5 tablas.
- Capacidad/vacantes reales.
- Notas por alergia, modo oscuro y tests automatizados.

Cada una de esas, si llega, va en su propio spec.

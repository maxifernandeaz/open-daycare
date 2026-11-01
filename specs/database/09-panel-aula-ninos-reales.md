# SPEC 09 — Panel de Aula · Niños Reales

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 05, SPEC 06, SPEC 07, SPEC 08
> **Fecha:** 2026-11-01
> **Objetivo:** Reemplazar los niños y protocolos ficticios de `/panel-aula` por los niños reales de Supabase, incluidos los recién creados, con búsqueda por nombre y contadores ajustados, sin depender de `child_tutors`.

## Por qué este spec existe

SPEC 02 renderizó el panel con datos mock. SPEC 08 ya crea niños reales en `children`, `child_health` y `child_allergies`, pero el panel sigue mostrando 6 niños ficticios y contadores de 18. Una alta nueva no se refleja en ninguna parte del panel.

El vínculo con el padre no es un requisito de este spec: la activación familiar llegará por código de invitación en su propio spec. Por eso el panel no consulta `child_tutors`, que además hoy tiene RLS activo sin policies.

## Scope

**In:**

- `app/panel-aula/queries.ts` (nuevo): `getClassroomPanelData()` lee de Supabase, con el cliente de `utils/supabase/server.ts`, las tablas `children`, `classrooms`, `profiles`, `child_health`, `child_allergies` y `allergies`, y devuelve `ClassroomPanelData`.
- `app/panel-aula/formatters.ts` (nuevo): funciones puras `getAgeLabel`, `getInitials`, `formatCreatedAt`, `getScheduleLabel`, `getHealthTag`, `getAllergyLabels` y `normalizeSearchText`.
- `app/panel-aula/page.tsx`: `await requireStaff()`, `await getClassroomPanelData()` y paso de props reales a `AppHeader`, `KpiRow`, `ActionDock`, `StudentRoster` y `HealthProtocolsPanel`.
- `app/components/panel-aula/StudentRoster.tsx`: pasa a Client Component con `useState` para la búsqueda. Recibe `students`, `totalChildren` y `error`. Busca por nombre y apodo, sin distinguir mayúsculas ni tildes (usando normalización NFD). Muestra estados vacíos.
- `app/components/panel-aula/StudentCard.tsx`: nuevo contrato `RosterStudent`. Muestra avatar de iniciales, nombre, edad calculada, aula, educadora, horario y tag de salud. No muestra tutor, punto de presencia, siesta, almuerzo, pañal ni check-in.
- `app/components/panel-aula/HealthProtocolsPanel.tsx`: recibe `protocols` por props, calcula el subtítulo y muestra estado vacío.
- `app/components/panel-aula/KpiRow.tsx`: recibe `totalChildren`. Asistencia usa el conteo real; los otros 3 KPIs muestran `—` y `Sin datos`.
- `app/components/panel-aula/ActionDock.tsx`: recibe `totalChildren` y `healthAlertCount`. Los 4 pills siguen sin efecto, con conteos reales donde existen y `—` donde no.
- `app/components/panel-aula/AppHeader.tsx`: prop opcional `classroomLabel?: string` con default actual. `/panel-aula` pasa `"Todas las aulas"`.
- `data/mock-classroom.ts`: se eliminan `students`, `protocols`, `kpis` y `statusFilters`, junto con los tipos que queden sin uso.
- `app/agregar-nino/actions.ts`: `revalidatePath("/panel-aula")` tras un `create_child` exitoso, para que el niño nuevo aparezca al navegar desde el banner.
- Sin migraciones, sin cambios de esquema y sin cambios de RLS: las policies de SPEC 06 y SPEC 08 ya cubren las lecturas de staff.

**Out of scope (para specs futuros):**

- Código de invitación, `child_tutors`, activación de tutores y cualquier vínculo padre-hijo.
- Asistencia, comedor, siesta, recogidas y bitácora reales: no existen tablas ni datos.
- Selector de aula funcional: queda estático en `"Todas las aulas"`.
- Página de detalle de ficha, edición o borrado de niños.
- Fotos o avatares: `children` no tiene columna de imagen.
- Realtime o suscripciones: el refresco es por navegación o recarga.
- Búsqueda global, filtros por estado funcionales, toasts, modo oscuro y tests automatizados.
- Cambios visuales en `/agregar-nino`, `/`, `/login` o `/activar-cuenta`.

## Data model

Este spec no crea ni modifica estructuras de base de datos. Define contratos de lectura y reglas de derivación.

```ts
// app/panel-aula/queries.ts
import type { HealthTag, Tone } from "@/data/mock-classroom";

export type RosterStudent = {
  id: string;
  name: string;
  nickname: string | null;
  initials: string;
  ageLabel: string;
  classroomName: string;
  classroomSlug: string;
  educatorName: string | null;
  scheduleLabel: string;
  healthTag: HealthTag | null;
  createdLabel: string;
  createdAtIso: string;
};

export type HealthProtocol = {
  id: string;
  childName: string;
  tag: string;
  tagTone: Tone;
  dotTone: Tone;
  description: string;
};

export type ClassroomPanelData = {
  students: RosterStudent[];
  protocols: HealthProtocol[];
  totalChildren: number;
  error: string | null;
};
Consultas
Seis consultas planas ejecutadas en paralelo puro dentro de un único Promise.all, siguiendo el patrón de app/agregar-nino/catalogs.ts:

children: id, full_name, nickname, birth_date, classroom_id, primary_educator_id, schedule, created_at, ordenado por created_at descendente y full_name ascendente.

classrooms: id, name, slug.

profiles: id, full_name (se consultan todos los perfiles visibles por RLS en paralelo sin esperar el resultado de children, y luego se cruzan en memoria por primary_educator_id).

child_health: child_id, urgent_medical_flag, medication_consent, nap_notes.

child_allergies: child_id, allergy_id, notes.

allergies: id, code, label, is_none.

Los mapas se construyen en memoria por id. Un aula o educadora ausente produce "Sin aula" o null, nunca un error. Si cualquiera de las seis consultas falla, se devuelve students: [], protocols: [], totalChildren: 0 y error: "No se pudieron cargar los niños.".

Reglas de derivación
Edad: meses = (añoActual - añoNacimiento) * 12 + (mesActual - mesNacimiento). Menos de 36 meses → "N meses". Desde 36 meses → "N años" más " M m" si sobran meses. Al 2026-11-01, Emma (2022-12-24) muestra "3 años 11 m".

Iniciales: primera letra de las dos primeras palabras del nombre completo, en mayúsculas. "Emma" → "E"; "Sofía Navarro" → "SN".

Horario: full_day → "Jornada completa"; mornings_with_lunch → "Mañanas con almuerzo"; mornings_only → "Solo mañanas"; afternoon → "Solo tardes"; null → "Sin horario".

Tag de salud: se ignoran las alergias con is_none = true. Si hay alergias específicas, se unen sus label con " · ", con icono medical_services y tono error si urgent_medical_flag o tertiary si no. Si no hay alergia específica pero sí flag urgente, el tag es "Alerta médica" con icono medical_information y tono error. En el resto de casos es null.

Protocolos: entra un niño por cada uno que tenga al menos una alergia específica o urgent_medical_flag = true. Un protocolo por niño. tag es la lista de alergias o "Alerta médica". description toma el primer child_allergies.notes no vacío (.trim()) de las alergias específicas del niño si existe; si no, "Alergias registradas: {labels}." (si tiene alergias específicas). Se añade " Aviso médico urgente activado." cuando el flag está activo (o es el único texto si no tiene alergias específicas ni notas). No se inventan indicaciones médicas.

Búsqueda normalizada: usar .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() tanto en el input del usuario como en name y nickname.

Contadores: totalChildren = children.length. healthAlertCount = protocols.length.

Estados de UI
Roster sin niños: "Todavía no hay niños registrados."

Búsqueda sin resultados: "No hay niños que coincidan con la búsqueda."

Error de carga: banner con role="alert" y el mensaje de error.

Protocolos sin alertas: "Sin alertas activas." y subtítulo "Sin alertas en seguimiento".

Implementation plan
Spec. Guardar este documento en estado Aprobado.

Rama. Crear y cambiar a spec-09-panel-aula-ninos-reales. Verificar: git branch --show-current.

Formatters y contratos. Crear app/panel-aula/formatters.ts con las funciones puras y app/panel-aula/queries.ts con los tipos y getClassroomPanelData(). Verificar: npx tsc --noEmit limpio.

Tarjeta. Adaptar StudentCard.tsx a RosterStudent: avatar de iniciales, edad, aula, educadora, horario y tag de salud. Verificar: tsc limpio y sin referencias a Student.

Roster. Convertir StudentRoster.tsx en Client Component con búsqueda normalizada, contador real y estados vacíos. Verificar: tsc limpio.

Protocolos. Adaptar HealthProtocolsPanel.tsx para recibir protocols, contar alertas y mostrar estado vacío. Verificar: tsc limpio.

KPIs y pills. Adaptar KpiRow.tsx y ActionDock.tsx a los conteos reales y a — en los bloques sin datos. Verificar: tsc limpio.

Header. Añadir classroomLabel opcional a AppHeader.tsx y pasar "Todas las aulas" desde el panel. Verificar: /agregar-nino conserva "Aula Estrellitas".

Cableado. Actualizar app/panel-aula/page.tsx con requireStaff(), la query y todas las props. Verificar: GET /panel-aula muestra los niños reales, el orden real (Emma primero por desempate de nombre), 3 protocolos y conteos reales.

Limpieza. Quitar de data/mock-classroom.ts los datos y tipos sin uso. Verificar: grep sin referencias y npm run build.

Refresco tras alta. Añadir revalidatePath("/panel-aula") en app/agregar-nino/actions.ts después de un create_child exitoso. Verificar: archivo:línea y flujo de alta.

Verificación final. npm run lint, npx tsc --noEmit, npm run build, Playwright a 1440px y 375px, consola limpia, screenshots en .playwright-mcp/, regresión de /, /login, /activar-cuenta y /agregar-nino, y supabase_list_migrations sin cambios.

Acceptance criteria
[ ] /panel-aula muestra exactamente los niños de children (6 al momento del spec) y ningún niño solo de mock, como Pablo Rivas.

[ ] Se respeta el orden created_at descendente con desempate full_name ascendente; al 2026-11-01 los 6 niños del seed comparten created_at y Emma Díaz aparece primera.

[ ] Cada tarjeta muestra nombre, edad calculada desde birth_date, aula, educadora y horario; no muestra línea de tutor, punto de presencia, siesta, almuerzo, pañal ni check-in.

[ ] Mateo muestra el tag de APLV; Martina, el de gluten; Emma, "Alerta médica"; Sofía, Lucas y Leo no muestran tag.

[ ] El panel de protocolos lista exactamente a los niños con alergia específica o flag urgente (3 al momento del spec) y el subtítulo coincide con ese número.

[ ] El contador del roster y el KPI de asistencia usan el total real de children; Comedor, Siesta y Recogidas muestran — y Sin datos.

[ ] Los pills muestran Todos con el total real, Alergias / Meds con el número de protocolos, y Presentes y En Siesta con —; ninguno filtra ni navega.

[ ] Buscar emma devuelve 1 tarjeta; buscar sofia sin tilde devuelve a Sofía; buscar zzz muestra el mensaje de sin resultados; limpiar el buscador restaura todos.

[ ] Un error de query muestra el banner role="alert" y la página no lanza un 500.

[ ] AppHeader muestra "Todas las aulas" en /panel-aula y conserva "Aula Estrellitas" en /agregar-nino.

[ ] grep -rn "child_tutors" app/panel-aula app/components/panel-aula no devuelve resultados.

[ ] grep -rn "classroomPanel\.\(students\|protocols\|kpis\|statusFilters\)" app/ no devuelve resultados.

[ ] app/agregar-nino/actions.ts ejecuta revalidatePath("/panel-aula") después de un alta exitosa y antes de devolver status: "success".

[ ] Al crear un niño y pulsar el enlace del banner de éxito, el niño aparece primero en /panel-aula sin recarga completa.

[ ] No se añade ninguna migración, tabla, columna, policy ni función: git diff --name-only no incluye supabase/migrations/*.sql.

[ ] No se usa createBrowserClient, service_role ni claves secretas en el panel.

[ ] npm run lint, npx tsc --noEmit y npm run build pasan; la consola queda limpia en /panel-aula.

[ ] A 1440px y 375px no hay scroll horizontal, y el roster se apila sin romper las tarjetas.

[ ] GET /, /login, /activar-cuenta y /agregar-nino no cambian visualmente; en /agregar-nino solo cambia la llamada a revalidatePath.

[ ] git diff --name-only muestra solo los archivos del Scope más este spec.
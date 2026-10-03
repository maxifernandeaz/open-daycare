# SPEC 04 — Agregar Niño · Alta de Ficha

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-03
> **Objetivo:** Crear la ruta `/agregar-nino` que replique el mockup `references/pantallas/agregar-niño.png.html` (alta completa de un niño en un solo formulario) con el shell de SPEC 02, datos en `data/mock-enrollment.ts` y solo los chips de alergias y el cálculo de edad en cliente.

## Scope

**In:**

- Nueva ruta `app/agregar-nino/page.tsx` como Server Component con `metadata` en español (`"KiddiCare · Agregar Nuevo Niño"`), que compone `AppSidebar` + `AppHeader` de SPEC 02 y el contenido.
- Cambios puntuales en `app/components/panel-aula/AppSidebar.tsx`:
  - prop opcional `activePath?: string`; el item activo se deriva de `item.path === activePath`, con default = el `item.active` de los datos (así `/panel-aula` no cambia).
  - el nav item "Alumnos y Familias" pasa de `href="#"` a `href="/agregar-nino"`.
  - CTA "Agregar alumno" (icono `add`, `bg-primary text-on-primary`) debajo de la lista de nav y encima de la tarjeta de soporte, con `href="/agregar-nino"` y **el mismo estilo en ambas rutas**.
- Breadcrumb alineado a las etiquetas del nav: `home` "Panel de Aula (Hoy)" › "Alumnos y Familias" › "Agregar Nuevo Niño" (los dos primeros con `href="#"`).
- Cabecera: icono `child_care`, título "Registrar Nuevo Niño", subtítulo del mockup y acciones superiores "Descartar" / "Guardar Ficha" (`type="button"`, sin efecto).
- **Sin barra de progreso** (se elimina la pill "Proceso de Ingreso Escolar 2024-2025" y "Paso 1 de 3": formulario único).
- Sección 01 "Datos Personales e Identidad": avatar (imagen vía `FallbackImage` con respaldo a iniciales, `<input type="file">` oculto **sin handler**, botones "Elegir ilustración suave" / "Tomar foto con cámara" sin efecto), nombre completo (`required`), fecha de nacimiento (default `2025-04-12`) + badge de edad, género (3 radios, "Niño" tildado), documento y apodo.
- Sección 02 "Asignación Pedagógica de Sala / Aula": 3 tarjetas de sala (Cunas / Soles / Estrellitas, "soles" preseleccionada, vacantes y ratio del mockup), select de educadora (3 opciones del mockup) y select de horario (4 opciones).
- Sección derecha "Salud, Alergias y Dietas": chips de alergias con exclusión mutua (única interacción junto a la edad), textarea de detalles, checkbox "Activar Aviso Visual Urgente".
- Sección 04 "Cuidados Especiales y Siesta": pediatra + teléfono, textarea de siesta/consuelo, checkbox "Consentimiento de Medicación" (tildado) y micro-banner de cartilla de vacunación.
- Barra sticky inferior: `fixed bottom-0 left-0 lg:left-72 right-0` con texto RGPD y botones "Cancelar / Volver a la lista" / "Registrar Niño y Crear Ficha" (`type="button"`, sin efecto).
- `data/mock-enrollment.ts` con copy, salas, educadoras, horarios y chips; reutiliza los tipos `Tone` y `Educator` de `data/mock-classroom.ts`.
- Responsive: `lg:grid-cols-12` (izquierda 7/8, derecha 5/4), tarjetas de sala en `md:grid-cols-3`, sin scroll horizontal a 375px.

**Out of scope (para specs futuros):**

- Pasos 2 y 3 del wizard, lista de alumnos y edición de ficha existente.
- Submit real, validación de formulario, persistencia o base de datos.
- Upload real de foto, ilustraciones predefinidas y cámara.
- Toasts (patrón SPEC 01) o cualquier efecto en los botones.
- Modificar SPEC 01 o SPEC 03; cambios en `AppHeader.tsx`, `data/mock-classroom.ts` o `app/globals.css`.
- Modo oscuro.

## Adaptación de estilos

El mockup usa un color `alert-coral` que no existe en el `@theme`. Mapeo a los tokens `error` (precedente: SPEC 03 adaptó la paleta del mockup a los tokens globales):

| Mockup | Token en la app |
| --- | --- |
| `bg-alert-coral-container/30` | `bg-error-container/30` |
| `bg-alert-coral text-on-primary` | `bg-error text-on-error` |
| `text-alert-coral` | `text-error` |
| `accent-alert-coral` | `accent-error` |
| `hover:bg-alert-coral-container hover:text-alert-coral` | `hover:bg-error-container hover:text-error` |

Ningún otro color del mockup necesita adaptación: `primary`, `surface*`, `secondary*`, `tertiary*` y `outline*` ya están en `app/globals.css`.

## Data model

`data/mock-enrollment.ts`:

```ts
import type { Educator, Tone } from "./mock-classroom";

export type ClassroomCard = {
  id: "cunas" | "soles" | "estrellitas";
  icon: string; range: string; name: string; tagline: string;
  description: string; vacancy: { text: string; tone: Tone };
  recommended?: boolean;
};
export type SelectOption = { value: string; label: string };
export type Chip = { id: string; label: string };

export type EnrollmentScreen = {
  breadcrumb: { label: string; href: string; icon?: string }[];
  header: { icon: string; title: string; subtitle: string };
  topActions: { discard: string; save: string };
  avatar: { src: string; alt: string; initials: string };
  classrooms: ClassroomCard[];      // 3, del mockup
  teachers: SelectOption[];         // Camila Rivas, Sofía Navarro, Elena Morales
  schedules: SelectOption[];        // 4, del mockup
  allergyChips: Chip[];             // "Sin alergias conocidas" + 5 específicos
  defaults: {
    birthDate: string;              // "2025-04-12" → "18 meses" hoy
    ageLabel: string;               // "18 meses"
    classroom: string; teacher: string; schedule: string;
    gender: string; medicationConsent: boolean; urgentMedicalFlag: boolean;
  };
  // copy de secciones, labels, placeholders y textos de la barra sticky
};
```

Export singleton `enrollmentScreen`. El tipo `Educator` se importa de `mock-classroom.ts` para no duplicarlo; las 3 educadoras del select se declaran aquí (el mockup es la fuente de verdad).

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Approved`. Verificar: revisión del usuario.
2. **Rama.** Crear `spec-04-agregar-nino-alta-ficha`. Verificar: `git branch --show-current`.
3. **Datos.** Crear `data/mock-enrollment.ts` con tipos y export. Verificar: `npx tsc --noEmit` limpio.
4. **Sidebar.** `AppSidebar.tsx`: prop `activePath`, href `/agregar-nino` en "Alumnos y Familias", CTA "Agregar alumno". Verificar: `/panel-aula` conserva medidas (`aside x=0 w=288`) y solo cambian href + CTA.
5. **Clientes.** Crear `AllergyChips.tsx` y `BirthDateField.tsx` (los únicos `"use client"`). Verificar: montados aislados, la edad recalcula y los chips excluyen "Sin alergias".
6. **Secciones estáticas.** `FormSection.tsx`, `IdentitySection.tsx`, `ClassroomSection.tsx`, `HealthSection.tsx`, `SpecialCareSection.tsx`. Verificar: cada sección coincide con el mockup.
7. **Barras.** `PageHeader.tsx` (breadcrumb + título + acciones) y `StickyActionBar.tsx`. Verificar: sticky `left-0 lg:left-72`, botones `type="button"`.
8. **Ruta.** `app/agregar-nino/page.tsx` con `metadata` y composición shell + contenido. Verificar: `GET /agregar-nino` pinta la pantalla completa.
9. **Verificación.** `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --name-only`, capturas Playwright 1440px/375px contra el mockup y regresión de `/`, `/login`, `/activar-cuenta` y `/panel-aula`.

## Acceptance criteria

- [ ] `GET /agregar-nino` muestra sidebar (8 items, "Alumnos y Familias" activo, CTA "Agregar alumno"), header de SPEC 02, breadcrumb de 3 migas, título "Registrar Nuevo Niño", secciones 01/02/salud/04 y barra sticky inferior.
- [ ] No aparece ninguna barra de progreso: `grep -r "Paso 1 de 3\|Proceso de Ingreso" app/agregar-nino` sin resultados.
- [ ] En `/agregar-nino` y `/panel-aula`, el nav "Alumnos y Familias" y el CTA "Agregar alumno" tienen `href="/agregar-nino"` y el CTA tiene las mismas clases en ambas rutas.
- [ ] En `/panel-aula` sigue activo "Panel de Aula (Hoy)" y el aside mide `x=0, w=288` como antes.
- [ ] Chips: inicial "Sin alergias conocidas" activo; al marcar "Gluten / Celíaco" se desactiva; al marcar "Sin alergias conocidas" se desactivan todos los específicos; dos específicos pueden coexistir.
- [ ] Fecha por defecto `2025-04-12` con badge "18 meses"; al cambiar a `2024-10-03` muestra "2 años"; al cambiar a `2026-01-15` muestra "9 meses (Lactante)".
- [ ] "Niño" y "soles" tildados por defecto; select de educadora en "Camila Rivas" y de horario en "Jornada Completa"; "Consentimiento de Medicación" tildado y "Aviso Visual Urgente" sin tildar.
- [ ] Las 3 tarjetas de sala muestran rango, tagline, descripción y vacantes del mockup (3 / 5 / 1).
- [ ] `grep -rn "alert-coral" app/` sin resultados; la sección de salud se pinta con `bg-error-container/30`, icono `bg-error text-on-error` y checkbox `accent-error`.
- [ ] El avatar se renderiza con `FallbackImage` (con `onError` a iniciales si la URL devuelve 403) y el `<input type="file">` no tiene handler.
- [ ] Todos los `<button>` de la ruta son `type="button"` y el `<form>` no tiene `action` ni `method`: no hay submit ni recarga.
- [ ] `grep -l '"use client"' app/components/agregar-nino/*` devuelve exactamente `AllergyChips.tsx` y `BirthDateField.tsx`.
- [ ] A 375px no hay scroll horizontal (`scrollWidth <= clientWidth`) y la barra sticky ancla en `left:0`; a ≥1024px en `left:288px`.
- [ ] `title` "KiddiCare · Agregar Nuevo Niño" y `description` en español y específicos de la pantalla.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan; consola limpia en `/agregar-nino`.
- [ ] `git diff --name-only` sobre archivos preexistentes muestra **solo** `app/components/panel-aula/AppSidebar.tsx`; `GET /`, `/login`, `/activar-cuenta` no cambian y `/panel-aula` solo varía por el href y el CTA nuevos.
- [ ] Comparación a 1440px con Playwright contra el mockup: misma geometría de secciones; a 375px el contenido se apila sin scroll horizontal.

## Decisions

- **Sí:** ruta nueva `/agregar-nino` con shell de SPEC 02 (patrón "una pantalla por ruta").
- **Sí:** prop `activePath` con default derivado de `item.active`. Es la forma mínima de reutilizar el sidebar sin alterar `/panel-aula`.
- **Sí:** CTA "Agregar alumno" en el sidebar, visible y con el mismo estilo en ambas rutas (decisión confirmada).
- **Sí:** híbrido — 100% Server Component salvo `AllergyChips` y `BirthDateField`, siguiendo el precedente de `FallbackImage.tsx` en SPEC 02.
- **Sí:** `data/mock-enrollment.ts` nuevo (dominio distinto, como `mock-auth.ts`), importando tipos de `mock-classroom.ts` en lugar de copiarlos.
- **Sí:** las 3 educadoras del mockup (Camila, Sofía, Elena) declaradas en `mock-enrollment.ts`.
- **Sí:** `alert-coral` → tokens `error` (el rojo es la señal de "Protocolo de Prevención"; precedent SPEC 03 de adaptar paletas a los tokens).
- **Sí:** sin barra de progreso ni "Paso 1 de 3": formulario único (decisión del usuario).
- **Sí:** fecha por defecto `2025-04-12` en vez del `2023-04-12` del mockup, para que el cálculo real dé "18 meses" como la referencia (el mockup es internamente inconsistente).
- **Sí:** avatar con `FallbackImage` en lugar de copiar la imagen a `public/`: la URL `lh3.googleusercontent.com` devolvió 403 en SPEC 02, el campo está vacío de todos modos y el respaldo a iniciales ya es patrón del proyecto.
- **Sí:** botones `type="button"` sin efecto (patrón SPEC 03); la ruta queda sin toasts.
- **Sí:** breadcrumb con las etiquetas del nav y `href="#"` en las dos primeras migas (el mockup navega a `#`).
- **No:** seguimiento de `navItems[].active` del dato una vez existe `activePath`: se deriva de la prop para que la ruta nueva pueda activar su item.
- **No:** wizard de 3 pasos, lista de alumnos o edición: van en specs futuros si se necesitan.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La URL del avatar devuelve 403 y no hay imagen | Diseño previsto: `FallbackImage` cae a iniciales (mismo comportamiento validado en SPEC 02) |
| El cambio de `AppSidebar.tsx` altera `/panel-aula` | Prop con default equivalente al comportamiento actual + criterio de aceptación con medidas y captura de regresión |
| Calcular la edad durante el render provoca mismatch de hidratación | La etiqueta inicial (`"18 meses"`) viene de `defaults.ageLabel`; solo se recalcula en `onChange` |
| La barra sticky tapa el último campo del formulario | `pb-24` (o superior) en el `<main>` de la ruta |
| Typos en clases largas Tailwind | Comparación por screenshot con Playwright contra el mockup como criterio de aceptación |
| El mockup oculta scrollbars globalmente (`::-webkit-scrollbar{display:none}`) | Mismo caso conocido de SPEC 02 (micro-discrepancia #4): no se replica porque tocaría `globals.css` de todas las rutas |

## What is **not** in this spec

- Pasos 2 y 3 del wizard, lista de alumnos, edición o borrado de fichas.
- Submit, validación real, persistencia, subida de foto o cualquier efecto en los botones.
- Toasts, modales, modo oscuro.
- Cambios en SPEC 01 y SPEC 03, en `AppHeader.tsx`, `data/mock-classroom.ts` o `app/globals.css`.

Cada una de esas, si llega, va en su propio spec.

# SPEC 02 — Panel de Aula · Monitor Operativo

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-26
> **Objetivo:** Crear la ruta `/panel-aula` que replique el mockup `references/pantallas/portalfamilia-feedDiario.html` (Monitor Operativo de Aula) como render estático con datos ficticios en `data/mock-classroom.ts`, sin tocar el home de `/` de SPEC 01.

## Scope

**In:**

- Nueva ruta `app/panel-aula/page.tsx` como Server Component (sin `"use client"`, sin estado) que compone el shell y el contenido.
- `metadata` propio de la ruta en español.
- Shell: `AppSidebar.tsx` (aside fijo `w-72`: logo KiddiCare, chip "Centro Infantil Sol · Activo", 8 entradas de nav con la primera activa, tarjeta de soporte) y `AppHeader.tsx` (header fijo `h-20`: selector de aula, selector de fecha, botón "+ Nueva Actividad / Incidencia", aviso de notificaciones con punto rojo, botón de mensajes, divisoria, perfil de Elena Morales con chip "Turno activo").
- Contenido del `<main>`: `OpsHero.tsx` (banner con blobs de desenfoque, pill "EN DIRECTO", título, subtítulo, stack de avatares de educadores, botón "Aviso a Familias"), `KpiRow.tsx` + `KpiCard.tsx` (4 KPIs: Asistencia, Comedor, Siesta, Recogidas, con barras de progreso simples y segmentadas), `ActionDock.tsx` (5 registros rápidos + 4 pills de filtro de estado), `StudentRoster.tsx` + `StudentCard.tsx` (cabecera con contador, input de búsqueda, 6 tarjetas de niños en `md:grid-cols-2`), `NextActivityBanner.tsx`.
- Rail derecho de 4 columnas: `HealthProtocolsPanel.tsx` (3 alertas), `PickupQueuePanel.tsx` (3 turnos con verificación QR / DNI / app), `ActivityLogPanel.tsx` (3 entradas sobre línea de tiempo vertical).
- Primitivas compartidas: `Tag.tsx` (pill/chip con tonos), `PanelCard.tsx` (tarjeta con cabecera de icono + título + subtítulo y slot derecho), `shell.ts` (constantes de clases del shell).
- `data/mock-classroom.ts` con los datos ficticios tipados.
- Un único token nuevo en `app/globals.css`: `--font-display-lg` y `--text-display-lg` (40px / 48px / -0.02em / 700), que el mockup usa en los valores de los KPI y hoy no existe.
- Imágenes con `<img>` + `onError` y respaldo (Unsplash en fotos grandes, iniciales en avatares), con disable de `@next/next/no-img-element` por archivo.
- Responsive: por debajo de `lg` el aside se oculta y el main pierde el `pl-72`; el contenido se apila en una columna. El track de pills de `ActionDock` y la fila de cabecera de `StudentRoster` llevan `flex-wrap` para que la página no tenga scroll horizontal a 375px.

**Out of scope (para specs futuros):**

- Cualquier estado o interactividad: la búsqueda, los pills de filtro y todos los botones se renderizan sin efecto.
- Modificar, mover o eliminar el home de `/` de SPEC 01.
- Un layout compartido que envuelva ambas rutas con el shell (el home de familias no lleva aside ni header).
- Drawer o botón de hamburguesa para navegar en móvil.
- Autenticación, roles, base de datos, persistencia y datos en tiempo real.
- Modo oscuro.
- Las otras tres pantallas de `references/pantallas/` (nueva autorización, notificación push, confirmación de pase digital).

## Data model

`data/mock-classroom.ts`. Los tonos son cadenas literales que los componentes mapean a clases de `app/globals.css`.

```ts
export type Tone = "primary" | "secondary" | "tertiary" | "error" | "outline" | "surface";

export type NavItem = { label: string; icon: string; path: string; active?: boolean };
export type Educator = { name: string; initials: string; photo?: string; alt?: string };

export type KpiCard = {
  id: "attendance" | "canteen" | "nap" | "pickups";
  icon: string; iconTone: Tone;
  badge: string; badgeTone: Tone; badgeIcon?: string;
  label: string; value: string; valueTone?: Tone; unit: string; aside?: string;
  progress?: { segments: { width: number; tone: Tone }[]; suffix: string; suffixTone: Tone };
  footnote?: { icon?: string; dotTone?: Tone; text: string; textTone?: Tone };
  link?: string;
};

export type QuickAction = { label: string; icon: string; iconTone: Tone };
export type StatusFilter = { label: string; count: number; active?: boolean };

export type HealthTag = { icon: string; text: string; tone: Tone };
export type DailyIndicator = { icon: string; iconTone: Tone; label: string; value: string };

export type Student = {
  id: string; name: string; age: string; tutorLabel: string;
  photo: string; photoAlt: string; fallbackPhoto: string; initials: string;
  accentTone: Tone; presenceDotTone: Tone; grayscale?: boolean;
  statusIcon: string; statusLabel: string; statusTone: Tone;
  healthTag?: HealthTag;
  indicators?: DailyIndicator[];
  note?: string;
  footnote: { text: string; tone: Tone };
  footnoteLabel: string;
  primaryAction: string; showAddEvent: boolean;
};

export type ProtocolAlert = { id: string; childName: string; tag: string; tagTone: Tone; dotTone: Tone; description: string };
export type PickupTurn = {
  id: string; time: string; timeTone: Tone; childName: string; collector: string;
  verification: { icon: string; text: string; tone: Tone } | null;
  badge?: string;
};
export type LogEntry = { id: string; author: string; timeAgo: string; text: string; dotTone: Tone };
export type NextActivity = { time: string; title: string; description: string; actionLabel: string };
```

Dos exports singleton: `classroomShell` (centro, `navItems`, tarjeta de soporte, datos del header y del usuario) y `classroomPanel` (`hero`, `kpis`, `quickActions`, `statusFilters`, `students` con 6 fichas, `nextActivity`, `protocols` con 3 alertas, `pickups` con 3 turnos, `logEntries` con 3 entradas). Los tipos se exportan al final del archivo; los componentes importan desde `@/data/mock-classroom`.

## Implementation plan

1. **Token tipográfico.** Añadir `--font-display-lg` y `--text-display-lg` (+ `--line-height`, `--letter-spacing`, `--font-weight`) en el `@theme` de `app/globals.css`. Verificar: `npm run dev` carga sin errores y un `text-display-lg` de prueba mide 40px.
2. **Datos mock.** Crear `data/mock-classroom.ts` con los tipos y los dos exports. Verificar: `npx tsc --noEmit` limpio.
3. **Primitivas.** Crear `app/components/panel-aula/shell.ts` (constantes `SIDEBAR_WIDTH_CLASS`, `SIDEBAR_OFFSET_CLASS`, `SIDEBAR_LEFT_CLASS`, `HEADER_HEIGHT_CLASS`, `MAIN_TOP_CLASS`), `Tag.tsx` y `PanelCard.tsx`. Verificar: tsc limpio.
4. **Shell.** Crear `AppSidebar.tsx` y `AppHeader.tsx` con el markup del mockup. Verificar: montados sobre un div de prueba, aside fijo a la izquierda y header fijo con los offsets correctos.
5. **Hero y KPIs.** Crear `OpsHero.tsx`, `KpiCard.tsx` y `KpiRow.tsx`, incluida la barra segmentada del KPI de Siesta. Verificar: los 4 KPIs se ven iguales al mockup.
6. **Dock.** Crear `ActionDock.tsx` con los 5 registros rápidos y los 4 pills. Verificar: coincide con el mockup.
7. **Roster.** Crear `StudentRoster.tsx` y `StudentCard.tsx`, con la variante de niño ausente (foto en `grayscale`, `opacity-80`, nota en cursiva, sin grid de indicadores). Verificar: las 6 fichas coinciden con el mockup.
8. **Banner de actividad.** Crear `NextActivityBanner.tsx`. Verificar: coincide con el mockup.
9. **Rail derecho.** Crear `HealthProtocolsPanel.tsx`, `PickupQueuePanel.tsx` y `ActivityLogPanel.tsx` sobre `PanelCard`. Verificar: los 3 paneles coinciden con el mockup.
10. **Ruta.** Crear `app/panel-aula/page.tsx` como Server Component: `export const metadata` y composición de shell + main (hero, KPIs, dock, bento `lg:grid-cols-12` con `lg:col-span-8` y `lg:col-span-4`). Verificar: `GET /panel-aula` pinta la pantalla completa.
11. **Verificación.** `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff` para confirmar que `app/page.tsx`, `app/components/*` de SPEC 01 y `data/mock.ts` no han cambiado, y comparación visual con Playwright a 1440px y 375px contra el mockup.

## Acceptance criteria

- [ ] `GET /panel-aula` muestra aside con 8 entradas de nav (la primera con el estado activo), header con selector de aula y de fecha, hero, 4 tarjetas KPI, dock de acciones con 5 botones y 4 pills, roster con 6 fichas de niños, banner de próxima actividad y 3 paneles en el rail derecho.
- [ ] A ≥1024px el aside es `fixed` de 288px con `h-full`, el header es `fixed` de 80px desplazado 288px a la izquierda, y el main tiene `pt-20` y `pl-72`.
- [ ] A 375px el aside no se renderiza, el main no tiene `pl-72` y la página no tiene scroll horizontal.
- [ ] El aspecto (colores, tipografías, radios, sombras, espaciados) coincide con el mockup a 1440px de ancho.
- [ ] Los valores de los KPI se renderizan a 40px con el token `display-lg` recién añadido, no con un tamaño por defecto de Tailwind.
- [ ] Los 6 niños se pintan con el nombre, edad, tutor, pill de estado, tag de salud y los 2 indicadores (Almuerzo y Pañal); el niño ausente se pinta con foto en escala de grises, opacidad reducida, etiqueta de justificación y nota en cursiva, y sin grid de indicadores.
- [ ] El rail derecho muestra 3 alertas de protocolos con su punto de tono, 3 turnos de recogida (uno de ellos con el badge "DNI Req." y el DNI cotejado) y 3 entradas de bitácora sobre una línea de tiempo vertical.
- [ ] Todos los iconos Material Symbols renderizan el glifo a partir del nombre de ligadura del mockup, sin cuadros de glifo faltante.
- [ ] Ninguna imagen queda rota: cada una tiene respaldo por `onError`, y los avatares caen a iniciales.
- [ ] Ningún botón, input ni pill produce ningún efecto: la página no contiene `"use client"` ni hooks de estado, con la única excepción de `app/components/panel-aula/FallbackImage.tsx`, que es un Client Component aislado porque un `onError` DOM no puede existir en un Server Component.
- [ ] El `title` y la `description` de `/panel-aula` están en español y son específicos de esta pantalla.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores, y la consola del navegador queda limpia en `/panel-aula`.
- [ ] `GET /` sigue renderizando exactamente igual que antes: `git diff` no muestra cambios en `app/page.tsx`, en los componentes de SPEC 01 ni en `data/mock.ts`.

## Decisions

- **Sí:** ruta nueva `/panel-aula` en lugar de reemplazar `/`. SPEC 01 ya entrega el home de familias y ambas pantallas son dominios distintos; mantenerlas permite compararlas.
- **Sí:** aside y header como componentes montados dentro de la ruta, no como layout compartido. El home de familias no lleva shell y un layout compartido lo obligaría a cambiar.
- **Sí:** render estático puro, sin `"use client"`. Es lo pedido ("solo interfaces y componentes") y hace que la ruta se pueda prerenderizar como servidor.
- **Sí:** `data/mock-classroom.ts` aparte de `data/mock.ts`. Los dos dominios no comparten ningún tipo salvo `Tone`, que aquí se declara local.
- **Sí:** subcarpeta `app/components/panel-aula/`. Desvía de la carpeta plana de SPEC 01, pero son 14 archivos nuevos de otro dominio y mezclarlos con los de familias haría la navegación confusa.
- **Sí:** añadir solo el token `display-lg` a `globals.css`. Se comprobó token por token que los 50 colores del config del mockup ya existen en el `@theme`.
- **Sí:** `<img>` con `onError` en lugar de `next/image`. Las fotos son URLs externas de un host no configurado y el mockup no define tamaños; requiere `remotePatterns` para nada más. Esto obliga a que `FallbackImage.tsx` sea el único Client Component de la ruta: en RSC un `onError` DOM no se puede renderizar. La prohibición de `"use client"` del alcance aplica a `app/panel-aula/page.tsx` y a sus componentes de presentación, no a ese helper.
- **Sí:** `metadata` propio en la ruta. El `title` del layout dice "Portal Familias" y sería incorrecto en esta pantalla.
- **No:** estado para búsqueda y filtros. Functionalidad de verdad, que es lo que mockedea el mockup, va en su propio spec.
- **No:** drawer móvil, toasts, modales, autenticación, persistencia, modo oscuro y librerías nuevas.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `@next/next/no-img-element` marca los `<img>` del hero, header, aislados y niños | Disable de la regla por archivo, como ya hace `app/page.tsx` de SPEC 01 |
| Las fotos de `lh3.googleusercontent.com` caducan o bloquean el dominio | `onError` a Unsplash en fotos grandes y a iniciales en avatares; todas las claves `alt` vienen del mockup |
| Los offsets del shell (`w-72`, `pl-72`, `left-72`, `h-20`, `pt-20`) se desincronizan al tocar uno de los tres componentes | Las cinco clases viven en `shell.ts` y se importan; nadie las escribe a mano |
| Clases largas escritas a mano en 14 archivos → errores de typos silenciosos | Comparación por screenshot con Playwright contra el mockup como criterio de aceptación |
| `bg-surface-container-high/60` y opacidades no obvias en el banner de actividad | Se replican tal cual y se verifican en el diff visual, no se reinterpretan |

## What is **not** in this spec

- Estado, búsqueda, filtros, toasts, modales o cualquier interacción.
- Cambios en el home de `/` de SPEC 01.
- Layout compartido entre rutas, drawer móvil o botón de hamburguesa.
- Autenticación, roles, base de datos, persistencia y tiempo real.
- Modo oscuro.
- Las otras tres pantallas de `references/pantallas/`.

Cada una de esas, si llega, va en su propio spec.

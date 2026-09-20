# SPEC 01 — Home · Panel de Control de Aula y Guardería

> **Estado:** Aprobado
> **Depende de:** Ninguna (spec 01)
> **Fecha:** 2026-09-20
> **Objetivo:** Reemplazar el boilerplate de `app/` por un home `/` que replique fielmente la plantilla `references/pantallas/panelDecontrolyGuarderia.html` con estilo idéntico, interacciones ligeras en el cliente y datos ficticios en `data/mock.ts`, sin autenticación ni base de datos.

## Scope

**In:**

- Reemplazar el contenido del boilerplate de `app/page.tsx` por el home del panel de control.
- Portar la paleta Material 3 del mockup (tokens `primary`, `surface*`, `error`, `tertiary*`, etc.) y la escala tipográfica (`headline-*`, `title-*`, `body-*`, `label-*`) a tokens de Tailwind v4 en `app/globals.css` (`@theme`), con los mismos nombres de clase que usa el HTML (`text-headline-lg`, `font-label-md`, etc.).
- Cargar **Plus Jakarta Sans** con `next/font/google` (variable `--font-jakarta`) y **Material Symbols Outlined** mediante `<link>` de Google Fonts en `app/layout.tsx`; `lang="es"` y metadata en español.
- Crear `data/mock.ts` con datos ficticios tipados (niño, métricas, foto del día, bitácora, personas autorizadas, avisos).
- Componentes por sección bajo `app/components/`: cabecera resumen, tarjetas de métricas (4), tarjeta "foto del día", bitácora cronológica, sidebar (recogida segura + QR estático + protocolo médico + avisos), modal de autorización y toast.
- Interacciones ligeras con estado local de cliente, sin persistencia: toast al pulsar botones, abrir/cerrar modal de autorización, botón like alternando icono y contador, cuadro de respuesta rápida a la tutora.
- Solo tema claro (sin modo oscuro).

**Out of scope (para specs futuros):**

- Autenticación y roles (familias/profes).
- Base de datos ni persistencia alguna (ni localStorage).
- Modo oscuro.
- QR real o generación dinámica (se replica el SVG decorativo del mockup).
- Envíos reales de mensajes, avisos o autorizaciones (solo UI con toast).

## Data model

`data/mock.ts`, datos ficticios tipados:

```ts
export type LiveStatus = { text: string; since: string };
export type Attendance = { state: "Presente"; arrivedAt: string; withPerson: string };
export type Tutor = { name: string; role: string };

export type ChildInfo = {
  name: string; classroom: string; age: string;
  photo: string; fallbackPhoto: string; avatarEmoji: string;
  allergies: string[]; liveStatus: LiveStatus;
  attendance: Attendance; tutors: Tutor[];
};

export type MetricCard = {
  id: "food" | "nap" | "hygiene" | "mood";
  icon: string; iconTone: string; badge: string; badgeTone: string;
  label: string; title: string; description: string; progress?: number;
  footnote: string;
};

export type TimelineEvent = {
  id: string; time: string; title: string; description: string;
  icon: string; iconTone: string; meta: { label: string; tone?: string }[];
};

export type TeacherPost = {
  author: { name: string; role: string };
  timeTitle: string; image: string; fallbackImage: string;
  placeLabel: string; description: string; likesLabel: string; albumActionLabel: string;
};

export type AuthorizedPerson = { id: string; name: string; relation: string; dni: string; badge: string };
export type Notice = { id: string; icon: string; title: string; text: string };
```

Export singleton `dailyHome` con el día del mockup y `homeConfig` (fechas, nombre de aula, último pase `#942-KC`, pin de respaldo, lista de personas autorizadas, avisos). Tipos al final del archivo; los componentes importan datos y tipos desde `@/data/mock`.

## Implementation plan

1. **Fundación.** Editar `app/layout.tsx` (Plus Jakarta Sans vía `next/font`, `<link>` de Material Symbols Outlined, `lang="es"`, metadata en español) y `app/globals.css` (paleta Material 3 + escala tipográfica `@theme`, `--font-sans: var(--font-jakarta)`). Verificar: `npm run dev` carga sin errores y el boilerplate pinta con la fuente correcta.
2. **Data mock.** Crear `data/mock.ts` con las interfaces y el objeto `dailyHome`. Verificar: `npx tsc --noEmit` limpio.
3. **Componentes de presentación.** Crear `app/components/` con: `ChildSummary.tsx`, `MetricCards.tsx`, `TeacherHighlight.tsx`, `TimelineSection.tsx`, `SafetySidebar.tsx`, `Icons.tsx` (wrapper `material-symbols-outlined`). Renderizan desde props derivados de `dailyHome`. Verificar: cada sección se monta y coincide visualmente con el mockup.
4. **Interactividad.** Convertir `app/page.tsx` en componente cliente (`"use client"`): estado para toast, modal abierto/cerrado, nueva persona autorizada y handlers `notify()`. `TeacherHighlight` con estado de like y caja de respuesta; `PickupModal.tsx` con su formulario que al submit cierra y lanza toast. Modal oculto por defecto.
5. **Compilar y verificar.** `npm run lint`, `npx tsc --noEmit`, `npm run build`, y comparación visual desktop/móvil con screenshots (Playwright) del home vs. mockup.

## Acceptance criteria

- [ ] `GET /` muestra cabecera del niño, 4 tarjetas de métricas, foto del día, bitácora cronológica, sidebar con recogida segura (QR estático + PIN `#942-KC`), protocolo médico, avisos del aula y footer.
- [ ] El estilo visual (colores, tipografías, bordes, radios, sombras y espaciados) es el mismo que la plantilla a nivel desktop (≥1024px: grid 8/4) y móvil (375px, sin overflow horizontal).
- [ ] Pulsar "Avisar Recogida / Retraso", "Guardar recuerdo" o "Enviar QR…" muestra el toast durante ~3,5s y lo oculta.
- [ ] "+ Autorizar Puntual" y "+ Autorizar a otra persona" abren el modal; Cerrar/Cancelar lo ocultan; "Confirmar y Emitir QR" lo cierra y muestra un toast con el nombre.
- [ ] El botón de like alterna icono (relleno/vacío) y texto del contador; "Responder a Elena M." muestra/oculta la caja de respuesta y "Enviar" lanza toast.
- [ ] Sin errores en consola del navegador; `npm run build` y `npx tsc --noEmit` pasan sin errores.
- [ ] `lang="es"` en `<html>` y metadata con título/descripción en español.
- [ ] La página se construye sin clases arbitrarias a nivel de bloques principales salvo las que usa el propio mockup.

## Decisions

- **Sí:** datos ficticios en `data/mock.ts` tipados. Evita hardcodear el día en los componentes y da un solo lugar donde tocar el contenido.
- **Sí:** paleta Material 3 + escala tipográfica registrada en `@theme` de globals.css. Es la vía nativa de Tailwind v4 (sin `tailwind.config`) y replica los nombres de clase del mockup.
- **Sí:** Plus Jakarta Sans con `next/font/google` y Material Symbols Outlined con `<link>` de Google Fonts. Material Symbols no tiene paquete npm oficial fiable; el `font-family` queda en el `<link>`.
- **Sí:** `app/page.tsx` como componente cliente para gestionar estado del toast/modal. Presentational components sin estado.
- **No:** `next/image` para las fotos. Se usan `<img>` con `onerror` de respaldo igual que el mockup; requiere configurar `remotePatterns` para las URLs externas.
- **No:** modo oscuro, QR dinámico, persistencia, autenticación.
- **No:** librerías nuevas (sin headless UI, sin sonner, etc.).

## Risks

| Riesgo                                             | Mitigación                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Imágenes remotas del mockup dejan de cargar        | `onerror` con fallback a `images.unsplash.com` (ya está en la plantilla)|
| ESLint marca `<img>` (`@next/next/no-img-element`) | Disable de la regla por archivo donde se use `<img>`                     |
| Tokens tipográficos no nativos de Tailwind          | Registrados en `@theme` para que `text-*`/`font-*` del mockup existan    |

## What is **not** in this spec

- Autenticación, roles y sesiones.
- Persistencia o base de datos (ni localStorage).
- Modo oscuro.
- QR/PIN generados dinámicamente ni envíos reales (WhatsApp, mensajes, autorizaciones).

Cada una de esas, si llega, va en su propio spec.
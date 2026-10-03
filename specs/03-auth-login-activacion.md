# SPEC 03 — Login y Activación de Cuenta

> **Estado:** implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-27
> **Objetivo:** Crear las rutas `/login` y `/activar-cuenta` que repliquen los mockups `references/pantallas/login.html` y `references/pantallas/activar-cuenta.html` como render estático, traduciendo la paleta cálida (coral/sand) y las tipografías serif del mockup a los tokens globales de `app/globals.css` (Material 3 + Plus Jakarta Sans) y a la marca **KiddiCare / Centro Infantil Sol**.

## Scope

**In:**

- Nuevas rutas `app/login/page.tsx` y `app/activar-cuenta/page.tsx` como Server Components (sin `"use client"`, sin estado, sin handlers) con `metadata` propio en español por ruta.
- `app/login/page.tsx`: tarjeta centrada de dos columnas (`flex-col` en móvil, `md:flex-row` a partir de 768px) con `LoginBrandPanel.tsx` a la izquierda (gradiente verde, dos blobs radiales, `BrandLockup` en chip blanco, titular `text-display-lg`, subtítulo y pie con el centro "Centro Infantil Sol") y el formulario a la derecha (Email, Contraseña, "¿Olvidaste tu contraseña?", botón "Iniciar sesión" y el pie "¿Te invitó a la guardería? Activá tu cuenta" enlazado a `/activar-cuenta`).
- `app/activar-cuenta/page.tsx`: columna única de 540px con `BrandLockup` claro, "Bienvenida a KiddiCare", tarjeta de resumen del niño (avatar de iniciales, "Te invitaron a seguir a", "Mateo · Aula Estrellitas"), código de invitación `readonly`, email, creación de contraseña, banner de consentimiento con checkbox y botón "Activar mi cuenta".
- Primitivas compartidas en `app/components/auth/`: `BrandLockup.tsx` (variantes `hero` y `light`), `AuthField.tsx` (label + input) y `LoginBrandPanel.tsx`.
- `data/mock-auth.ts` con el copy y los datos ficticios de ambas pantallas, reutilizando `classroomShell.brand` y `classroomShell.center` de `data/mock-classroom.ts` para no duplicar la marca.
- `public/kiddicare-logo.png`, copia de `references/screenshots/logo.png`, para que el logo no dependa de `lh3.googleusercontent.com`, que devuelve 403 (ver SPEC 02, criterio 9 y micro-discrepancia 7).
- Dos clases utilitarias nuevas en `app/globals.css`: `.auth-hero-gradient` y `.auth-hero-blob`, que son los únicos valores visuales que no se pueden expresar con los tokens del `@theme` (degradado de 3 paradas y gradiente radial blanco translúcido).
- Responsive: `/login` apila el panel de marca sobre el formulario por debajo de `md`; `/activar-cuenta` mantiene la columna de 540px. Sin scroll horizontal a 375px.
- Traducción de textos: "OpenDayCare" → "KiddiCare", "Guardería Sala Soles" → "Centro Infantil Sol", "Mateo · Sala Soles" → "Mateo · Aula Estrellitas" (el aula que ya existe en `data/mock-classroom.ts:65`).

**Out of scope (para specs futuros):**

- Autenticación real: los formularios no envían, no validan y no redirigen.
- Cualquier handler, `"use client"`, `useState` o inputs controlados.
- Mostrar u ocultar contraseña, recuperar contraseña, o página de invite inexistente.
- Modificar `app/page.tsx` (home de SPEC 01) o `app/panel-aula/` (SPEC 02).
- Enlace de retorno a `/login` desde `/activar-cuenta`: el mockup no lo tiene.
- Layout compartido entre las dos rutas o con el resto de la app, shell, sidebar o header.
- Modo oscuro, toasts, modales, i18n, base de datos y persistencia.

## Adaptación de estilos

El objetivo del spec es que la UI se vea como el mockup **con la identidad de KiddiCare**, no con la paleta del mockup. Mapa aplicado:

| Mockup (HTML de referencia) | Token global / clase en la app |
| --- | --- |
| `bg-warm-gradient` (`#f28b6d → #dc6245`) | `.auth-hero-gradient` = `linear-gradient(145deg, #10b981 0%, #006c49 55%, #00422b 100%)` (`primary-container` → `primary` → `on-primary-container`) |
| `.organic-shape-1/2` (radial blanco translúcido) | `.auth-hero-blob` + `bg-white/[0.14]` con `blur` implícito por el radial |
| Botón `#EB7454` / `brand-coral` | `bg-primary-container text-on-primary hover:bg-primary` + `shadow-[0_4px_14px_rgba(16,185,129,0.25)]`, el mismo patrón del botón de `AppHeader.tsx:58` |
| Links `terracotta` | `text-primary hover:underline` |
| Labels `stone-500` 11px bold tracking-wide uppercase | `font-label-sm text-label-sm text-on-surface-variant uppercase` (11px/14px/700/0.04em, calza exacto) |
| Inputs `border-stone-200`, `focus:ring-coral-400/40` | `bg-surface-container-lowest border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20` |
| Fondo `#FAF7F2` / `#FAF6F0` | `bg-background` |
| Tarjetas blancas | `bg-surface-container-lowest border-black/[0.04]` |
| Títulos serif (Playfair Display / Source Serif 4) | `font-sans` con `text-display-lg` (40px, hero) y `text-headline-lg` (28px, títulos) |
| Banner de consentimiento `#FCF5E3` / `#F3E7C9` | `bg-tertiary-fixed/30 border-tertiary-fixed` |
| Checkbox verde `#4CA771` | `bg-primary-container text-on-primary` con `peer-focus:ring-primary/30` |
| Avatar `#9BCDE4` / `#1E5773` | `bg-secondary-fixed text-on-secondary-fixed` |
| Emoji 🌿 del pie de marca | `Icon name="eco"` (Material Symbols, ya cargado en `app/layout.tsx:25`) |

No queda ningún color `coral`, `sand`, `terracotta`, `brand-*` ni `stone-*` en el markup de las dos rutas, ni ninguna fuente serif.

## Data model

`data/mock-auth.ts`. La marca no se duplica: se importa de `data/mock-classroom.ts`.

```ts
import { classroomShell } from "./mock-classroom";

export type BrandRef = { name: string; logoAlt: string; logoSrc: string; centerName: string };

export type AuthFieldData = {
  id: string; name: string; label: string; type: "text" | "email" | "password";
  placeholder?: string; defaultValue?: string;
  readOnly?: boolean; autoComplete?: string; spaced?: boolean;
};

export type LoginScreen = {
  brand: BrandRef;
  hero: { headline: string; body: string };
  form: { fields: AuthFieldData[]; forgotLabel: string; submitLabel: string };
  footer: { prefix: string; linkLabel: string; linkHref: string };
};

export type ActivationScreen = {
  brand: BrandRef;
  header: { title: string; body: string };
  child: { initial: string; name: string; classroom: string; invitationLabel: string };
  fields: AuthFieldData[];
  consent: { label: string };
  submitLabel: string;
};
```

Dos exports singleton: `loginScreen` y `activationScreen`. `BRAND_LOGO_SRC` es la ruta local `/kiddicare-logo.png`. El copy viene de los mockups con las sustituciones de marca declaradas en el Scope.

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Approved`. Verificar: el usuario lo aprueba antes de tocar código.
2. **Rama.** Crear y cambiar a `spec-03-auth-login-activacion`. Verificar: `git branch --show-current`.
3. **Asset.** Copiar `references/screenshots/logo.png` a `public/kiddicare-logo.png` (`references/` es solo lectura). Verificar: `ls -l public/kiddicare-logo.png` y que el PNG sea válido.
4. **Clases del hero.** Añadir `.auth-hero-gradient` y `.auth-hero-blob` en `app/globals.css`, fuera del `@theme`. Verificar: el hero se ve verde con los blobs.
5. **Datos mock.** Crear `data/mock-auth.ts` con los tipos y los dos exports. Verificar: `npx tsc --noEmit` limpio.
6. **Primitivas.** Crear `app/components/auth/BrandLockup.tsx` (variantes `hero` y `light`) y `AuthField.tsx`. Verificar: montados en la ruta de activación.
7. **Panel de marca.** Crear `app/components/auth/LoginBrandPanel.tsx`. Verificar: el panel verde se ve como el mockup pero en verde, con el logo legible.
8. **Ruta `/login`.** Crear `app/login/page.tsx` con `metadata`, tarjeta, panel y formulario. Verificar: `GET /login` pinta la pantalla completa y el enlace a `/activar-cuenta` navega.
9. **Ruta `/activar-cuenta`.** Crear `app/activar-cuenta/page.tsx` con `metadata`, cabecera, tarjeta del niño, formulario, banner de consentimiento y botón. Verificar: `GET /activar-cuenta` pinta la pantalla completa.
10. **Verificación.** `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --name-only` para confirmar que SPEC 01 y 02 no cambiaron, y comparación visual con Playwright a 1440px y 375px contra `references/screenshots/login.png` y `activar-cuenta.png`.

## Acceptance criteria

- [ ] `GET /login` muestra el panel de marca verde con el logo de KiddiCare, el titular "El día de cada niño, compartido con su familia.", el subtítulo, el pie con "Centro Infantil Sol" y, en la columna derecha, el título "Iniciar sesión", los campos Email y Contraseña, el enlace "¿Olvidaste tu contraseña?", el botón "Iniciar sesión" y el pie "¿Te invitó a la guardería? Activá tu cuenta".
- [ ] El enlace "Activá tu cuenta" de `/login` navega a `/activar-cuenta`.
- [ ] `GET /activar-cuenta` muestra el logo de KiddiCare, "Bienvenida a KiddiCare", el subtítulo, la tarjeta "Te invitaron a seguir a / Mateo · Aula Estrellitas" con avatar de inicial, el código de invitación `readonly`, el email, la creación de contraseña, el banner de consentimiento con el checkbox tildado y el botón "Activar mi cuenta".
- [ ] Ningún color `coral`, `sand`, `terracotta`, `brand-*` o `stone-*` del config de los mockups aparece en el markup de las dos rutas: todo el color sale de los tokens del `@theme` (`primary`, `primary-container`, `on-primary`, `surface-*`, `outline*`, `tertiary-*`, `secondary-*`). Verificable con `grep -rniE "coral|sand|terracotta|brand-|stone-" app/login app/activar-cuenta app/components/auth app/data 2>/dev/null`.
- [ ] Ninguna fuente serif (Playfair Display, Source Serif 4, `font-serif`) aparece en las dos rutas: la tipografía es Plus Jakarta Sans con los tokens `display-lg`, `headline-lg`, `body-md`, `label-lg` y `label-sm`.
- [ ] El logo se sirve desde `public/kiddicare-logo.png` y ninguna de las dos rutas depende de `lh3.googleusercontent.com`.
- [ ] A ≥768px la tarjeta de `/login` es `md:flex-row` con el panel de marca al 48% y el formulario al 52%; por debajo de 768px se apilan en una columna y el ancho máximo de la tarjeta es 1080px.
- [ ] A 375px ninguna de las dos rutas tiene scroll horizontal (`document.documentElement.scrollWidth <= clientWidth`).
- [ ] Los botones de envío son `type="button"` y ningún `<form>` tiene `action` ni `method`: no hay submit, ni recarga, ni contraseña en la query string.
- [ ] Ninguna de las dos rutas ni sus componentes contiene `"use client"`, `useState`, `useEffect` o `onSubmit`.
- [ ] El `title` y la `description` de cada ruta están en español y son específicos: "KiddiCare · Iniciar sesión" y "KiddiCare · Activar cuenta".
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores, y la consola del navegador queda limpia en `/login` y `/activar-cuenta`.
- [ ] `git diff --name-only` no muestra cambios en `app/page.tsx`, `app/layout.tsx`, `app/components/ChildSummary.tsx`, `app/components/panel-aula/` ni `data/mock.ts`; `app/globals.css` solo suma las dos clases del hero.
- [ ] `GET /` y `GET /panel-aula` siguen renderizando exactamente igual que antes de este spec.

## Decisions

- **Sí:** rutas nuevas `/login` y `/activar-cuenta` en lugar de reemplazar `/` o `/panel-aula`. Son dominios distintos y el spec 02 ya estableció el patrón de una pantalla por ruta.
- **Sí:** adaptarlas a la paleta global en lugar de replicar el coral del mockup. Los mockups son referencias de layout e interacción; la identidad del proyecto es el `@theme` de `app/globals.css` (verde `primary` +Plus Jakarta Sans), que es lo que ya usan SPEC 01 y SPEC 02.
- **Sí:** serif → Plus Jakarta Sans. Las familias serif del mockup (Playfair Display, Source Serif 4) no están cargadas en `app/layout.tsx`; el proyecto no usa serif en ninguna pantalla y los tokens de `@theme` no incluyen una familia serif.
- **Sí:** `public/kiddicare-logo.png` local en lugar de la URL de `lh3.googleusercontent.com`. SPEC 02 documentó que esa URL devuelve 403 y que la app cae a las iniciales "KC"; en estas pantallas el logo es el elemento de marca protagonista, así que necesita renderizarse siempre.
- **Sí:** logo completo (icono + wordmark) dentro de un chip blanco translúcido en el panel verde, en lugar de badge de icono + texto. El wordmark de `logo.png` es oscuro y no se lee sobre verde; el chip blanco resuelve la legibilidad sin inventar un icono nuevo ni reescribir la imagen.
- **Sí:** reutilizar `classroomShell.brand` y `classroomShell.center` desde `data/mock-classroom.ts`. La marca es un dato de la plataforma, no de la pantalla; duplicarlo en dos archivos garantiza que divergan.
- **Sí:** botones de envío con `type="button"` y sin `action` en el `<form>`. Un `<form>` estático con `type="submit"` haría `GET` a la propia ruta y expondría la contraseña en la query string y en el historial, incluso sin backend. Los `<label for>` siguen asociados a los inputs, así que la semántica de formulario se conserva.
- **Sí:** checkbox de consentimiento con `defaultChecked`. Es la única forma de un checkbox marcado en un Server Component, y reproduce el mockup, que lo pinta tildado.
- **No:** enlazar "Activar mi cuenta" a `/login` ni a `/panel-aula`. El mockup no ofrece esa salida y no hay flujo de sesión que tenga sentido sin autenticación.
- **No:** enlazar `/login` desde el home de `/` ni desde `/panel-aula`. Eso toca pantallas de SPEC 01 y 02, fuera de alcance.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El panel verde se ve más saturado que el degradado coral del mockup | Se eligieron las paradas `primary-container` → `primary` → `on-primary-container` para mantener el mismo recorrido claro→oscuro; se valida con comparación por screenshot |
| `logo.png` tiene fondo blanco y no transparente, así que el chip del hero puede verse como un cuadrado blanco | Se aplica `rounded-2xl` + `p-2.5` para que el logo respire dentro del chip; si el borde se ve duro en la comparación visual, se sube el `p` o se pasa a `object-contain` sobre `bg-white/90` |
| `next/image` no está configurado para nada externo y el asset local tiene dimensiones desconocidas | `<img>` con disable de `@next/next/no-img-element` por archivo, igual que `app/page.tsx` y `app/components/panel-aula/FallbackImage.tsx` |
| Clases largas escritas a mano → typos silenciosos de color o de token | Comparación por screenshot con Playwright contra los mockups y `grep` de colores prohibidos como criterio de aceptación |
| Los tokens `label-sm` son 11px/700 y los labels del mockup son `text-[11px] font-bold` | Es el mismo valor; el criterio es que no queden tamaños arbitrarios en el markup |
| El código de invitación `readonly` y el email con `defaultValue` pueden confundir a un revisor como campos editables | El `readonly` va en el `input` del código y el criterio de aceptación exige que se vea como no editable |

## What is **not** in this spec

- Autenticación, sesiones, cookies, roles, base de datos o validación de formularios.
- Cualquier interacción: mostrar contraseña, recuperación de contraseña, envío, redirección o toasts.
- Enlace de retorno a `/login`, enlace desde el home o desde el panel de aula.
- Cambios en las pantallas de SPEC 01 y SPEC 02, o en `app/layout.tsx`.
- Layout compartido, shell con sidebar/header, drawer móvil o botón de hamburguesa.
- Modo oscuro y las otras pantallas de `references/pantallas/`.

Cada una de esas, si llega, va en su propio spec.

# SPEC 07 — Login Real y Protección de Rutas

> **Estado:** implementado
> **Depende de:** SPEC 03, SPEC 05, SPEC 06
> **Fecha:** 2026-10-25
> **Objetivo:** Conectar `/login` a Supabase Auth con email y contraseña, exigir sesión verificada en todas las rutas salvo `/login` y `/activar-cuenta`, redirigir por rol (incluido staff en `/` → `/panel-aula`) y permitir cerrar sesión.

## Por qué este spec existe

SPEC 03 dejó `/login` y `/activar-cuenta` como pantallas estáticas a propósito. SPEC 05 y SPEC 06 ya crearon `auth.users`, `profiles`, `user_status` y las policies RLS que permiten leer el perfil propio. Este spec es el punto donde la UI deja de ser mockup y pasa a autenticar de verdad.

También revierte dos decisiones explícitas de SPEC 03: el botón de login deja de ser `type="button"` y la ruta `/login` incorpora un Client Component con `useActionState`. Ambas reversiones son el objeto de este spec.

## Scope

**In:**

- `supabase/migrations/<timestamp>_fix_seed_auth_tokens_and_identities.sql`: migración correctiva de datos de auth; normaliza los tokens del seed a `''` e inserta las identities `email` faltantes. Sin cambios de esquema, RLS ni `profiles`.
- `utils/supabase/cookie-options.ts`: `AUTH_COOKIE_OPTIONS` compartido (`path`, `sameSite: "lax"`, `httpOnly: true`, `secure` en producción) para server y middleware.
- `utils/supabase/server.ts`: pasar `cookieOptions: AUTH_COOKIE_OPTIONS` al `createServerClient` para que el Server Action de login escriba cookies con los mismos atributos que el proxy.
- `utils/supabase/middleware.ts`: usar `getClaims()`, devolver `response`, `userId`, `cookiesToSet` y los headers de caché; usar `AUTH_COOKIE_OPTIONS` al refrescar cookies.
- `proxy.ts`: política de rutas públicas/protegidas, redirect a `/login`, redirect de `/login` a `/` si ya hay sesión, y copia de cookies/headers en cada redirect.
- `utils/auth.ts`: `getCurrentProfile()` (memoizado con `cache`) y `requireStaff()`.
- `app/login/actions.ts`: Server Action `login` con validación mínima, `signInWithPassword`, lectura de `profiles.role`/`profiles.status`, bloqueo de `pending`, cierre de sesión local y redirect por rol.
- `app/components/auth/LoginForm.tsx`: Client Component con `useActionState`, error inline en español, estado `pending` del botón y `required` en email/contraseña.
- `app/login/page.tsx`: reemplazar el `<form>` estático por `<LoginForm form={loginScreen.form} />`; se conservan panel de marca, textos, enlace de recuperación y pie de invitación.
- `data/mock-auth.ts` + `app/components/auth/AuthField.tsx`: añadir `required?: boolean` a `AuthFieldData` y pasarlo al `<input>`.
- `app/panel-aula/page.tsx` y `app/agregar-nino/page.tsx`: `await requireStaff()` al inicio; un `tutor` va a `/`.
- `app/page.tsx`: Server Component con `getCurrentProfile()`; sin sesión va a `/login`, staff va a `/panel-aula`, tutor renderiza el portal.
- `app/components/HomePortal.tsx`: Client Component con el contenido actual de la home y el botón "Cerrar sesión" del footer.
- `app/auth/actions.ts`: Server Action `signOut`.
- `app/components/auth/LogoutButton.tsx`: Client Component con variantes `icon` (header) y `link` (footer de la home).
- `app/components/panel-aula/AppHeader.tsx`: botón de cerrar sesión discreto junto al bloque de usuario.

**Out of scope (para specs futuros):**

- Activación real de `/activar-cuenta`: invitaciones, callback de Supabase, código de invitación y paso `pending` → `active`.
- Registro público (`signUp`) y cualquier alta de usuarios desde la UI.
- Recuperación y cambio de contraseña.
- OAuth, magic link, MFA y login por teléfono.
- RBAC fino: ocultar botones o secciones según rol dentro de una pantalla.
- Cambios de esquema, RLS, triggers o `profiles`; el único cambio de datos es la migración correctiva de `auth.users`/`auth.identities`.
- Botón "Recordarme", duración de sesión personalizada, rate limiting propio o captcha.
- Devolver al usuario a la ruta original (`?next=`).

## Data model

Este spec **no introduce estructuras nuevas en la base de datos** y **no escribe en `profiles`**. Reutiliza `auth.users` y `profiles` de SPEC 05/06.

### Migración correctiva de datos de auth

El seed de SPEC 05 insertó los 11 usuarios directamente en `auth.users`, sin normalizar los tokens ni crear filas en `auth.identities`. GoTrue escanea esas columnas como `string`; con `NULL` el login falla.

La migración `<timestamp>_fix_seed_auth_tokens_and_identities.sql`:

- Normaliza a `''` `confirmation_token`, `recovery_token`, `email_change` y `email_change_token_new` para los IDs `00000000-0000-0000-0000-000000000001..011`.
- Inserta una identity `email` por usuario con `provider_id = id::text`, `identity_data = {sub, email, email_verified: true, phone_verified: false}` y `on conflict (provider_id, provider) do nothing`.
- Es idempotente y no toca `profiles`, RLS ni el esquema.

Verificación read-only posterior:

```sql
select
  count(*) filter (
    where confirmation_token is null
       or recovery_token is null
       or email_change is null
       or email_change_token_new is null
  ) as users_with_null_tokens,
  (
    select count(*)
    from auth.identities i
    where i.user_id::text like '00000000-0000-0000-0000-0000000000%'
  ) as seed_identities
from auth.users
where id::text like '00000000-0000-0000-0000-0000000000%';
```

Resultado esperado: `users_with_null_tokens = 0` y `seed_identities = 11`.

Lecturas:

- `profiles.id`, `profiles.role`, `profiles.status`, filtradas por `id = claims.sub`. La policy `profiles_select_authenticated` permite leer el perfil propio incluso en `pending`.

Contratos TypeScript nuevos:

```ts
export type LoginState = {
  error?: string;
  email?: string;
};

export type CurrentProfile = {
  id: string;
  role: Database["public"]["Enums"]["user_role"];
  status: Database["public"]["Enums"]["user_status"];
};
```

Sesión:

- Las cookies `sb-<ref>-auth-token` las gestiona `@supabase/ssr`. No se manipulan tokens a mano.
- `AUTH_COOKIE_OPTIONS` (`utils/supabase/cookie-options.ts`) define `path: "/"`, `sameSite: "lax"`, `httpOnly: true` y `secure` solo en producción; se pasa a `server.ts` y `middleware.ts` para que el Server Action de login y el proxy escriban exactamente los mismos atributos.
- `httpOnly: true` porque ninguna parte de este spec usa el cliente Supabase en el navegador.

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-07-auth-login-proteccion-rutas`. Verificar: `git branch --show-current`.
3. **Migración correctiva de auth.** Crear `<timestamp>_fix_seed_auth_tokens_and_identities.sql` y aplicarla con `supabase db push --db-url`. Verificar: query read-only con 0 usuarios con tokens `NULL` y 11 identities seed.
4. **Helpers de autorización.** Crear `utils/auth.ts` con `getCurrentProfile()` y `requireStaff()`. Verificar: `npx tsc --noEmit` limpio; `/panel-aula` sigue renderizando.
5. **Cookies compartidas.** Crear `utils/supabase/cookie-options.ts` y pasar `AUTH_COOKIE_OPTIONS` a `server.ts` y `middleware.ts`. Verificar: login escribe `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción.
6. **Proxy.** Actualizar `utils/supabase/middleware.ts` y `proxy.ts`: `getClaims()`, lista de rutas públicas exactas, redirects y copia de cookies + headers. Verificar: sin sesión, `/`, `/panel-aula` y `/agregar-nino` terminan en `/login`; `/login` y `/activar-cuenta` responden 200.
7. **Server Action de login.** Crear `app/login/actions.ts` con validación, `signInWithPassword`, consulta de perfil, bloqueo `pending` y redirect por rol. Verificar: login con `elena.morales@kiddicare.test` / `kiddicare` llega a `/panel-aula`; con `lucia.fernandez@gmail.com` / `kiddicare` llega a `/`.
8. **Formulario real.** Añadir `required` a `AuthFieldData`, crear `LoginForm.tsx` y montarlo en `app/login/page.tsx`. Verificar: error inline con contraseña incorrecta, botón deshabilitado mientras envía y email conservado tras el error.
9. **Gates por rol.** Añadir `await requireStaff()` a `/panel-aula` y `/agregar-nino`. Verificar: sesión de tutor redirige a `/`; educador y director entran.
10. **Home por rol.** Extraer el contenido de `app/page.tsx` a `app/components/HomePortal.tsx` y convertir `app/page.tsx` en Server Component con `getCurrentProfile()`. Verificar: staff en `/` termina en `/panel-aula`; tutor ve el portal.
11. **Logout.** Crear `app/auth/actions.ts` y `LogoutButton.tsx`; montarlo en `AppHeader.tsx` y en el footer de `HomePortal.tsx`. Verificar: desde panel y desde home se cierra sesión y se vuelve a `/login`.
12. **Verificación final.** `npm run lint`, `npx tsc --noEmit`, `npm run build`; Playwright a 1440px y 375px; consola limpia; `git diff --name-only`. Screenshots en `.playwright-mcp/`.

## Acceptance criteria

- [x] Sin sesión, `GET /`, `GET /panel-aula` y `GET /agregar-nino` responden con redirect a `/login`.
- [x] Sin sesión, `GET /login` y `GET /activar-cuenta` responden 200.
- [x] Los 11 usuarios seed tienen `confirmation_token`, `recovery_token`, `email_change` y `email_change_token_new` en `''` (no `NULL`) y exactamente una identity `email` cada uno.
- [x] Con `elena.morales@kiddicare.test` / `kiddicare` el login redirige a `/panel-aula`.
- [x] Con `lucia.fernandez@gmail.com` / `kiddicare` el login redirige a `/`.
- [x] Tras el login existe la cookie `sb-<ref>-auth-token` con `HttpOnly`, `SameSite=Lax` y `Path=/`.
- [x] La cookie escrita por el Server Action de login (no solo por el proxy) lleva `HttpOnly`, `SameSite=Lax`, `Path=/` y, en producción, `Secure`, usando `AUTH_COOKIE_OPTIONS` compartido.
- [x] Recargar `/panel-aula` después del login mantiene la sesión y no redirige a `/login`.
- [x] Un `tutor` autenticado que abre `/panel-aula` o `/agregar-nino` termina en `/`.
- [x] Un `educator`, `director` o `admin` autenticado abre `/panel-aula` sin redirect.
- [x] Un `educator`, `director` o `admin` autenticado que abre `/` termina en `/panel-aula`; un `tutor` autenticado ve el Portal Familias en `/`.
- [x] Con contraseña incorrecta se queda en `/login`, se muestra "Email o contraseña incorrectos." y no queda cookie de sesión.
- [x] La URL tras un intento fallido no contiene la contraseña ni parámetros de credenciales.
- [x] `app/login/actions.ts` consulta `profiles.status` y, si no es `active`, ejecuta `signOut({ scope: "local" })` y devuelve "Tu cuenta está pendiente de activación." (verificable por `archivo:línea`).
- [x] `proxy.ts` usa `getClaims()` y no `getSession()` para decidir la protección.
- [x] Todo redirect de `proxy.ts` copia `cookiesToSet` y los headers `cache-control`, `expires` y `pragma` del response de Supabase.
- [x] Un usuario autenticado que abre `/login` es redirigido a `/`.
- [x] "Cerrar sesión" desde `/panel-aula` y desde `/` lleva a `/login`, borra la cookie de sesión y luego `/` vuelve a redirigir a `/login`.
- [x] El error de login se anuncia con `role="alert"` y el botón muestra un estado deshabilitado mientras la Server Action está pendiente.
- [x] Ningún archivo usa `service_role`, secret key ni expone tokens en `NEXT_PUBLIC_*`.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] La consola del navegador queda limpia en `/login`, `/`, `/panel-aula` y `/agregar-nino`.
- [ ] A 375px no hay scroll horizontal en `/login`, `/`, `/panel-aula` ni `/agregar-nino`, y el logout es visible y accesible.
- [x] `git diff --name-only` solo muestra los archivos listados en el Scope más este spec; `app/activar-cuenta/page.tsx` y sus datos no cambian.

## Decisions

- **Sí:** Server Action + `useActionState`. La sesión se crea y se escribe en cookies desde el servidor; el navegador nunca maneja tokens.
- **Sí:** `getClaims()` en `proxy.ts`. Verifica la firma del JWT y refresca la sesión; `getSession()` leería la cookie sin revalidar. Es la recomendación actual de Supabase para SSR.
- **Sí:** proteger en `proxy.ts` **y** validar rol en las páginas de staff. El proxy corta el acceso global; `requireStaff()` evita que un tutor abra el panel aunque tenga sesión.
- **Sí:** consultar el rol en las páginas, no en el proxy. Evita una query a `profiles` en cada request de assets o navegación.
- **Sí:** redirect post-login por rol: `tutor` → `/`; `educator`, `director` y `admin` → `/panel-aula`.
- **Sí:** bloquear `pending` en el login y cerrar la sesión local. Sin flujo de activación, dejar entrar a un `pending` sería un callejón sin salida.
- **Sí:** mensaje genérico de credenciales. Evita enumerar qué emails existen; el caso `pending` se informa aparte porque no revela la contraseña.
- **Sí:** logout visible en panel y home. Sin él, un tutor en `/` no tendría forma de terminar la sesión.
- **Sí:** cookies `HttpOnly`. Este spec no usa `createBrowserClient`; si más adelante se necesita Realtime en el cliente, esa decisión se revisa en su propio spec.
- **Sí:** `getClaims()` también en `utils/auth.ts` y luego `.from("profiles").select(...)`. La identidad viene del JWT verificado; el rol y el estado, de Postgres con RLS.
- **Sí:** migración correctiva de datos de auth. El seed quedó con tokens `NULL` y sin `auth.identities`; sin ella el login de GoTrue falla.
- **Sí:** `AUTH_COOKIE_OPTIONS` compartido entre `server.ts` y `middleware.ts`. Evita que el Server Action escriba cookies más débiles que el proxy.
- **Sí:** home como Server Component con `HomePortal` client. El redirect por rol necesita `getCurrentProfile()` en el servidor; el contenido visual sigue siendo client.
- **No:** parámetro `?next=` para volver a la ruta original. Son solo tres rutas y evita open redirects y conflictos con el redirect por rol.
- **No:** activación, invitaciones, callback y `pending` → `active`. Quedan en el spec de activación, que es el que podrá probar ese branch de punta a punta.
- **No:** recuperar contraseña. El enlace queda como está y su flujo va en otro spec.
- **No:** cambios de esquema o RLS. Las policies de SPEC 06 ya alcanzan para leer el perfil propio; la única escritura es la migración correctiva de datos de auth.
- **No:** guardar `role` en `app_metadata` o en el JWT. Hoy vive en `profiles` y consultarlo por request es barato a esta escala.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `getClaims()` agrega trabajo al proxy en cada request | Es una sola llamada y ya existía un `getUser()`; se mantiene una sola verificación por request |
| Perder cookies refrescadas en un redirect y cerrar la sesión del usuario | `proxy.ts` copia `cookiesToSet` con sus `options` y los headers de caché en cada `NextResponse.redirect` |
| **Confirmado:** los 11 `auth.users` del seed tienen `confirmation_token`, `recovery_token`, `email_change` y `email_change_token_new` en `NULL`, y no existe ninguna fila en `auth.identities`; GoTrue rechazaría el login | Migración correctiva en Scope: normaliza los tokens a `''` e inserta las identities `email` antes de probar el login |
| El Server Action de login y el proxy escriben cookies con opciones distintas y la sesión se invalida o queda sin `HttpOnly` | `AUTH_COOKIE_OPTIONS` compartido en `utils/supabase/cookie-options.ts`, usado por ambos clientes |
| El redirect de staff desde `/` agrega un salto extra (`/login` → `/` → `/panel-aula`) | Son redirects de servidor sin render intermedio; el tutor no los ve y el staff no llega a ver el Portal Familias |
| Contraseña compartida `kiddicare` en los 11 usuarios seed | Solo desarrollo; nunca se usa en producción y se rota antes de un entorno real |
| Un usuario `pending` con sesión creada antes de pasar a `pending` conserva acceso hasta que expire | Documentado y acotado; el spec de activación/desactivación debe revocar sesiones al cambiar estado |
| Un cambio de rol no se refleja hasta la siguiente navegación | `requireStaff()` consulta `profiles` en cada render de las páginas de staff |
| El botón de logout en `AppHeader` rompe el layout a 375px | Variante `icon` de 40×40 con `aria-label="Cerrar sesión"`; verificación visual contra SPEC 02 |
| Los mensajes de error del Server Action podrían filtrar detalles de Auth | Solo dos mensajes controlados: credenciales genéricas y cuenta pendiente |
| `proxy.ts` redirige a `/login` a un usuario con sesión inválida y entra en bucle | Rutas públicas exactas; `/login` autenticado va a `/`, y solo las páginas de staff aplican el gate de rol |
| El seed usa `lucia.fernandez@gmail.com`, un email real | Es un dato ficticio de desarrollo; no se envía correo en este spec |

## What is **not** in this spec

- Activación real de `/activar-cuenta`, invitaciones, callback y `pending` → `active`.
- Registro público, recuperación de contraseña, OAuth, magic link, MFA o login por teléfono.
- RBAC dentro de las pantallas (ocultar acciones según rol).
- Cambios de esquema, RLS, triggers o `profiles`; la migración correctiva de `auth.users`/`auth.identities` sí está en Scope.
- Botón "Recordarme", duración de sesión configurable, rate limiting o captcha.
- Devolver al usuario a la ruta original con `?next=`.
- Migrar los mocks de `/`, `/panel-aula` y `/agregar-nino` a queries reales.

Cada una de esas, si llega, va en su propio spec.

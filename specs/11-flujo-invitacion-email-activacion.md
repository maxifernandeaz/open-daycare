# SPEC 11 — Flujo Completo de Invitación: Email, Modal y Activación de Cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 06, SPEC 07, SPEC 10
> **Fecha:** 2026-11-01
> **Objetivo:** Completar el ciclo de invitación de tutores conectando el envío de correo con Resend, el modal en `/panel-aula` y la activación real de la cuenta en `/activar-cuenta`.

## Por qué este spec existe

SPEC 10 dejó completa la capa de datos: la tabla `invitations`, los cuatro RPC (`create_tutor_invitation`, `revoke_tutor_invitation`, `accept_tutor_invitation`, `get_invitation_preview`) y todas las policies RLS. Lo que sigue es puramente de aplicación:

1. El educador necesita un punto de entrada en `/panel-aula` para disparar una invitación.
2. Una vez creada la invitación en la base de datos, se envía un correo al tutor con el código y un botón.
3. El tutor abre `/activar-cuenta`, ve precargada la tarjeta del niño, completa el formulario y queda con sesión activa.

Este spec no toca la base de datos. Toda la lógica RLS ya existe en SPEC 10.

## Scope

**In:**

- `package.json` y `package-lock.json`: instalar el paquete `resend`.
- `.env.template`: añadir `RESEND_API_KEY` y `RESEND_FROM_EMAIL` con placeholders y comentarios (los valores reales van en `.env`, que está en `.gitignore`).
- `utils/email.ts`: cliente singleton de Resend y función `sendInvitationEmail(to, code, childName)` que envía el correo con el código espaciado y el botón de activación.
- `utils/supabase/admin.ts`: cliente de servicio `createAdminClient()` con `SUPABASE_SERVICE_ROLE_KEY`; nunca importado en Client Components.
- `app/panel-aula/actions.ts`: Server Action `inviteFamily(childId, email, relationship?)` que llama `create_tutor_invitation` via RPC, intenta enviar el correo y devuelve el estado al cliente.
- `app/components/panel-aula/InviteModal.tsx`: modal de invitación con campos email y parentesco opcional; abre/cierra desde la tarjeta del niño; muestra éxito, error con opción de reenviar y estado de carga.
- `app/components/panel-aula/StudentCard.tsx`: añadir el botón "Invitar familia" que abre `InviteModal`.
- `app/components/panel-aula/StudentRoster.tsx`: propagar `childId` y handler de invitación a cada `StudentCard`.
- `app/activar-cuenta/page.tsx`: reescribir como Server Component que lee `?code`, normaliza el código con `code.replace(/\s+/g, "").toUpperCase()`, llama `get_invitation_preview` con el cliente server (anon), precarga email, nombre del niño y aula, y renderiza `ActivateAccountForm`. Se conserva íntegramente el diseño visual existente (título "Bienvenida a KiddiCare", tarjeta con inicial del niño, texto "Te invitaron a seguir a {Nombre} · {Aula}", checkbox de consentimiento, colores y clases CSS) —la maqueta de SPEC 03 sirve de plantilla directa.
- `app/activar-cuenta/actions.ts`: Server Action `activateAccount(code, email, password, photoConsent)` con la secuencia completa descrita en el Implementation plan.
- `app/components/auth/ActivateAccountForm.tsx`: Client Component con los campos precargados (email de solo lectura si viene del preview), contraseña, checkbox de consentimiento de fotos (`defaultChecked`, no `required`) y manejo de errores inline.

**Out of scope (para specs futuros):**

- Plantilla HTML de correo con marca visual: el correo de este spec es texto plano + botón básico.
- Recordatorios automáticos, cron de expiración o webhooks de Resend.
- Recuperación de contraseña para tutores (ya activos).
- Rate limiting y CAPTCHA en `/activar-cuenta`.
- Revocar una invitación desde la UI (el RPC existe pero el botón queda para otro spec).
- Portal completo del tutor: asistencia, bitácora, recogidas.
- Multi-tenant (más de un centro) o invitar al mismo tutor a varios niños en una operación.
- Tests automatizados de correo (solo se verifica el log de Resend en el dashboard).
- Internacionalización del correo (siempre en español).

## Data model

Este spec **no introduce estructuras nuevas en la base de datos**. Reutiliza íntegramente lo definido en SPEC 10: tabla `invitations`, RPCs y policies.

### Variables de entorno nuevas

```
RESEND_API_KEY=re_...          # obligatoria en producción; en dev puede ser el sandbox de Resend
RESEND_FROM_EMAIL=KiddiCare <onboarding@resend.dev>   # opcional; el código usa este default
```

El default de `RESEND_FROM_EMAIL` es la dirección de pruebas de Resend para que el dev sin dominio propio igual pueda enviar. En producción se sobreescribe con el dominio verificado.

### Contratos TypeScript nuevos

```ts
// utils/email.ts
export type SendInvitationEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

// app/panel-aula/actions.ts
export type InviteFamilyResult =
  | { success: true; emailSent: boolean; code: string }
  | { success: false; error: string };

// app/activar-cuenta/actions.ts
export type ActivateAccountState = {
  error?: string;
  success?: boolean;
};
```

### Flujo de estados del modal

```
idle → loading → success
              ↘ error (con botón "Reenviar")
error (reenviar) → loading → success
                           ↘ error
```

El error no bloquea el flujo: la invitación queda `pending` en la base de datos y el staff puede reenviar el correo en cualquier momento desde el mismo modal.

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-11-flujo-invitacion-email-activacion`. Verificar: `git branch --show-current`.
3. **Paquete Resend.** Instalar `resend` con `npm install resend`. Verificar: `package.json` y `node_modules/resend` presentes; `npx tsc --noEmit` limpio.
4. **Variables de entorno.** Añadir `RESEND_API_KEY` y `RESEND_FROM_EMAIL` a `.env` (con valores de sandbox) y a `.env.template` (con placeholders y comentarios). Verificar: `process.env.RESEND_API_KEY` legible en un Server Action de prueba; nada expuesto en `NEXT_PUBLIC_*`.
5. **Cliente de servicio.** Crear `utils/supabase/admin.ts` con `createAdminClient()` que usa `SUPABASE_SERVICE_ROLE_KEY`. No tiene `"use client"` y su importación en un Client Component debe lanzar error de build. Verificar: `npx tsc --noEmit` limpio.
6. **Cliente de email.** Crear `utils/email.ts` con el singleton `Resend` y la función `sendInvitationEmail`. Verificar: `npx tsc --noEmit` limpio; llamada de prueba con el sandbox envía sin lanzar excepción.
7. **Server Action de invitación.** Crear `app/panel-aula/actions.ts` con `inviteFamily`. La acción llama `create_tutor_invitation` vía RPC con el cliente de servidor (rol autenticado), obtiene `invitation_id`, `code` y `expires_at`, y luego llama `sendInvitationEmail`. Si el RPC falla, devuelve error y no intenta el correo. Si el correo falla, devuelve `{ success: true, emailSent: false }` con el código para que el modal informe. Verificar: con un tutor de prueba en el sandbox, aparece el registro en el log de Resend.
8. **Modal de invitación.** Crear `app/components/panel-aula/InviteModal.tsx`: formulario con campo email (obligatorio), campo parentesco (opcional, texto libre), botón "Invitar", manejo de los tres estados (loading / success / error) y botón "Reenviar" en caso de error de correo. El reenvío llama `inviteFamily` de nuevo con los mismos datos: el RPC reutilizará la invitación `pending` existente y renovará 7 días. Verificar: el modal abre y cierra, el foco vuelve al botón disparador al cerrar, y el mensaje de éxito menciona el email destino.
9. **Botón en la tarjeta del niño.** Añadir el botón "Invitar familia" a `StudentCard.tsx` (solo visible para `educator`, `director` y `admin`) y propagar el `childId` y el handler de apertura del modal desde `StudentRoster.tsx`. Verificar: el botón aparece en la tarjeta, y un click abre el modal con el `childId` correcto.
10. **Página `/activar-cuenta` (Server Component).** Reescribir `app/activar-cuenta/page.tsx` como Server Component que lee `searchParams.code`, normaliza el código con `code.replace(/\s+/g, "").toUpperCase()` (para tolerar URLs con código espaciado), llama `get_invitation_preview` con el cliente server (anon) y pasa los datos a `ActivateAccountForm`. Si el preview devuelve 0 filas, renderiza el formulario sin datos precargados y con un aviso. Se conserva íntegramente el diseño visual de la maqueta de SPEC 03: título "Bienvenida a KiddiCare", tarjeta con inicial del niño y la línea "Te invitaron a seguir a {Nombre} · {Aula}", colores y clases CSS existentes. Verificar: `GET /activar-cuenta?code=XXXXX` pre-rellena email, nombre del niño y aula; `GET /activar-cuenta` muestra el formulario vacío con el aviso.
11. **Formulario de activación.** Crear `app/components/auth/ActivateAccountForm.tsx`: campo email (solo lectura si vino del preview, editable si no), campo contraseña, checkbox "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app." con `defaultChecked` (no `required`: el tutor puede desmarcarlo y activar la cuenta con `photo_consent = false`), botón "Activar cuenta". Errores inline con `role="alert"`, botón deshabilitado mientras la acción está pendiente. Verificar: `npx tsc --noEmit` limpio; desmarcando el checkbox el formulario igual se puede enviar.
12. **Server Action de activación.** Crear `app/activar-cuenta/actions.ts` con `activateAccount(code, email, password, photoConsent)`:
    1. Normalizar el código en el servidor: `const normalizedCode = code.replace(/\s+/g, "").toUpperCase()`.
    2. Llamar `get_invitation_preview(normalizedCode)` con el cliente server (anon) para verificar que la invitación sigue `pending` y vigente.
    3. Si el preview devuelve 0 filas: devolver error "Esta invitación no es válida o ya venció."
    4. Verificar que el email del formulario (normalizado a minúsculas) coincide con el de la invitación. Si no: devolver error "El email no coincide con la invitación."
    5. Con `createAdminClient()`, consultar `profiles` por email (buscando la fila cuyo campo `email` coincida o haciendo join con `auth.users`):
       - Si existe un perfil con `role in ('admin', 'director', 'educator')`: devolver error "Este email ya pertenece a una cuenta de staff. Contactá a la guardería." Sin tocar Auth.
       - Si no existe ningún usuario: `auth.admin.createUser({ email, password, email_confirm: true })` y `UPDATE profiles SET status = 'active'` con `createAdminClient()`.
       - Si existe un perfil `tutor` con `status = 'invited'`: `auth.admin.updateUserById(id, { password, email_confirm: true })` y `UPDATE profiles SET status = 'active'` con `createAdminClient()`.
       - Si existe un perfil `tutor` con `status = 'active'`: no modificar contraseña ni llamar `updateUserById`. Continuar directo al `signInWithPassword`.
    6. Iniciar sesión con `signInWithPassword({ email, password })` usando el cliente de servidor (escribe las cookies de sesión).
    7. Llamar `accept_tutor_invitation(normalizedCode, photoConsent)` con el cliente de servidor (ya autenticado, `auth.uid()` disponible).
    8. Redirigir a `/`.
    - Si cualquier paso después de la activación del perfil falla, devolver el error específico sin volver a crear el usuario.
    Verificar: el flujo completo desde el correo llega a `/` con sesión de tutor.
13. **Verificación de proxy.** Confirmar que `proxy.ts` ya incluye `/activar-cuenta` en la lista de rutas públicas (SPEC 07). Si no, añadirlo. Verificar: `GET /activar-cuenta?code=XXXXX` sin sesión responde 200 y no redirige a `/login`.
14. **Lint, tipos y build.** `npm run lint`, `npx tsc --noEmit`, `npm run build`. Verificar: sin errores.
15. **Verificación Playwright.** Flujo completo a 1440px y 375px: abrir `/panel-aula` → "Invitar familia" → completar modal → verificar mensaje de éxito; abrir `/activar-cuenta?code=XXXXX` → completar formulario (con y sin checkbox) → verificar redirección a `/`. Screenshots en `.playwright-mcp/`.

## Acceptance criteria

- [ ] `resend` aparece en `package.json` como dependencia de producción.
- [ ] `RESEND_API_KEY` y `RESEND_FROM_EMAIL` están en `.env.template` con comentarios; ninguna está en `NEXT_PUBLIC_*`.
- [ ] `utils/email.ts` exporta `sendInvitationEmail(to, code, childName)` y usa `process.env.RESEND_FROM_EMAIL ?? "KiddiCare <onboarding@resend.dev>"` como remitente.
- [ ] El correo incluye el código en formato espaciado (p.ej. `7 K 4 P 9`) y un enlace/botón a `/activar-cuenta?code=XXXXX` (sin espacios en la URL).
- [ ] `inviteFamily` llama `create_tutor_invitation` vía RPC con el cliente autenticado de servidor. Si el RPC falla, devuelve error sin intentar el correo.
- [ ] Si `sendInvitationEmail` falla después de crear la invitación, `inviteFamily` devuelve `{ success: true, emailSent: false }` con el `code`, y el modal muestra el error de correo con el botón "Reenviar" sin marcar la operación como fallida.
- [ ] La invitación permanece en estado `pending` en la base de datos aunque el correo falle.
- [ ] El modal de invitación en `/panel-aula` tiene campos email (obligatorio) y parentesco (opcional), estado de carga, mensaje de éxito y estado de error con botón "Reenviar".
- [ ] Al cerrar el modal el foco vuelve al botón "Invitar familia" que lo abrió.
- [ ] El botón "Invitar familia" en `StudentCard.tsx` solo es visible para usuarios con rol `educator`, `director` o `admin`; no aparece para `tutor`. `StudentRoster.tsx` propaga el `childId` al modal.
- [ ] `GET /activar-cuenta?code=XXXXX` (sin sesión) responde 200 y no redirige a `/login`.
- [ ] Con un código `pending` válido, `/activar-cuenta?code=XXXXX` precarga el email, el nombre del niño y el nombre del aula en el formulario; el diseño visual (tarjeta con inicial, "Te invitaron a seguir a {Nombre} · {Aula}") se conserva.
- [ ] Con un código inválido, vencido o ya usado, `/activar-cuenta` muestra el formulario vacío con un aviso "Esta invitación no es válida o ya venció."
- [ ] El campo email del formulario de activación es de solo lectura cuando viene del preview; editable cuando no.
- [ ] Tanto en `app/activar-cuenta/page.tsx` como en `activateAccount`, el código se normaliza con `code.replace(/\s+/g, "").toUpperCase()` antes de pasarlo a `get_invitation_preview` o `accept_tutor_invitation`.
- [ ] El Server Action `activateAccount` valida primero la invitación con `get_invitation_preview(normalizedCode)` antes de tocar Auth; si devuelve 0 filas, devuelve error sin crear usuario.
- [ ] Si el email del formulario no coincide con el de la invitación (case-insensitive), devuelve error "El email no coincide con la invitación." sin crear usuario.
- [ ] Si el email corresponde a un perfil con `role in ('admin', 'director', 'educator')`, devuelve error "Este email ya pertenece a una cuenta de staff. Contactá a la guardería." sin tocar Auth.
- [ ] Si el email no existe en `profiles`: crea el usuario con `auth.admin.createUser({ email_confirm: true })` y activa `profiles.status = 'active'` con `createAdminClient()`.
- [ ] Si el email corresponde a un perfil `tutor` con `status = 'invited'`: actualiza contraseña y confirmación con `auth.admin.updateUserById(id, { password, email_confirm: true })` y activa `profiles.status = 'active'` con `createAdminClient()`.
- [ ] Si el email corresponde a un perfil `tutor` con `status = 'active'`: **no** llama `createUser` ni `updateUserById`. Continúa directo a `signInWithPassword`.
- [ ] `profiles.status` se actualiza a `'active'` usando `createAdminClient()` (service_role) antes de llamar `signInWithPassword`.
- [ ] `signInWithPassword` se llama con el cliente de servidor (escribe las cookies) y su resultado establece la sesión.
- [ ] `accept_tutor_invitation(normalizedCode, photoConsent)` se llama después de `signInWithPassword`, con el cliente de servidor ya autenticado.
- [ ] Tras la activación exitosa, la redirección es a `/` y el usuario tiene sesión de tutor activa.
- [ ] `utils/supabase/admin.ts` usa `SUPABASE_SERVICE_ROLE_KEY` y no expone nada en `NEXT_PUBLIC_*`; no se importa en Client Components.
- [ ] El checkbox de consentimiento de fotos tiene `defaultChecked` pero **no** es `required`; el formulario se puede enviar con él desmarcado (resultando en `photo_consent = false` en `child_tutors`).
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [ ] La consola del navegador queda limpia en `/panel-aula` y `/activar-cuenta`.
- [ ] A 375px no hay scroll horizontal en `/panel-aula` ni en `/activar-cuenta`, y el modal es usable.
- [ ] `git diff --name-only` muestra solo: `package.json`, `package-lock.json`, `.env.template`, `utils/email.ts`, `utils/supabase/admin.ts`, `app/panel-aula/actions.ts`, `app/components/panel-aula/InviteModal.tsx`, `app/components/panel-aula/StudentCard.tsx`, `app/components/panel-aula/StudentRoster.tsx`, `app/activar-cuenta/page.tsx`, `app/activar-cuenta/actions.ts`, `app/components/auth/ActivateAccountForm.tsx` y este spec. No hay cambios en `supabase/migrations/`, `types/database.ts` ni en otros specs.

## Decisions

- **Sí:** paquete `resend` en servidor. Es el SDK oficial de Resend; no se expone ninguna clave al navegador.
- **Sí:** remitente `process.env.RESEND_FROM_EMAIL ?? "KiddiCare <onboarding@resend.dev>"`. El default permite trabajar en desarrollo sin dominio verificado; en producción se sobreescribe.
- **Sí:** código espaciado en el correo (`7 K 4 P 9`) y sin espacios en la URL. El espaciado es legibilidad para el humano; la URL lleva el código limpio.
- **Sí:** normalización del código con `code.replace(/\s+/g, "").toUpperCase()` tanto en `page.tsx` como en `activateAccount`. `btrim` en SQL solo limpia bordes; si el código llega con espacios intermedios (p.ej. copiado del correo), el RPC lo rechazaría. La normalización se hace en JS antes de enviarlo a Supabase.
- **Sí:** si Resend falla, la invitación queda `pending` y el modal informa el error con "Reenviar". Crear la invitación y enviar el correo son dos pasos distintos; revertir la invitación por un fallo de correo sería peor UX y rompería el historial.
- **Sí:** el reenvío llama `inviteFamily` de nuevo. El RPC de SPEC 10 reutiliza la invitación `pending` existente y renueva los 7 días; el staff no necesita gestionar IDs de invitación.
- **Sí:** `get_invitation_preview` como primera validación en `activateAccount`. Verifica el estado antes de tocar Auth; evita crear usuarios para invitaciones ya aceptadas o vencidas.
- **Sí:** validar que el email del formulario coincide con el de la invitación antes de crear el usuario. Evita que alguien use el código de otro sin conocer el email destino.
- **Sí:** detectar usuarios existentes consultando `profiles` por email (no `auth.admin.listUsers()`). `listUsers()` en Supabase JS v2 no filtra por email; la query a `profiles` con `createAdminClient()` es directa y tipada.
- **Sí:** rechazar con error si el email pertenece a un perfil de staff (`admin`, `director`, `educator`). Evita que el flujo de activación de tutores sobreescriba cuentas de staff.
- **Sí:** `updateUserById` para tutores en estado `invited`. El tutor seed existe en Auth pero no tiene contraseña real; `updateUserById` le asigna la contraseña ingresada en el formulario sin crear un segundo usuario.
- **Sí:** para tutores ya `active`, pasar directo a `signInWithPassword` sin modificar contraseña. El tutor puede estar reactivando una cuenta existente (p.ej. invitado para un segundo niño); cambiar su contraseña silenciosamente sería un fallo de seguridad.
- **Sí:** `auth.admin.createUser({ email_confirm: true })`. La invitación actúa como verificación del email; no se envía un segundo correo de confirmación de Auth.
- **Sí:** activar `profiles.status = 'active'` con `createAdminClient()` antes de `signInWithPassword`. El trigger `profiles_prevent_self_privilege_escalation` bloquea que un `tutor` lo haga por sí mismo; el cliente de servicio no tiene `auth.uid()` y pasa el trigger.
- **Sí:** `signInWithPassword` con el cliente de servidor para escribir las cookies de sesión. El mismo patrón que SPEC 07; el navegador nunca maneja tokens.
- **Sí:** `accept_tutor_invitation` después de `signInWithPassword`. El RPC exige `auth.uid()` no nulo y valida que el email del JWT coincida con la invitación; la sesión debe estar activa.
- **Sí:** el email en el formulario es de solo lectura cuando viene del preview. El email de la invitación es el que validará el RPC; permitir editarlo generaría confusión.
- **Sí:** el checkbox de consentimiento tiene `defaultChecked` pero no es `required`. El consentimiento se prefiere marcado, pero un tutor tiene derecho a registrarse negando el consentimiento de fotos; el campo `photo_consent` de `child_tutors` soporta ambos valores (SPEC 10).
- **Sí:** conservar íntegramente el diseño visual de la maqueta de SPEC 03 en `/activar-cuenta`. La maqueta ya implementa la tarjeta con inicial, el texto "Te invitaron a seguir a {Nombre} · {Aula}" y el checkbox estilizado; solo se conecta a datos reales.
- **Sí:** redirigir a `/` tras la activación. La home detecta el rol `tutor` y muestra el Portal Familias (SPEC 07).
- **No:** `auth.admin.listUsers()` para buscar usuarios existentes. No filtra por email en Supabase JS v2; se usa la tabla `profiles` como fuente de verdad.
- **No:** plantilla HTML de correo con marca visual. El correo básico es suficiente para este spec; la plantilla va en un spec de diseño de comunicaciones.
- **No:** rate limiting en `/activar-cuenta`. El RPC ya limita por email + código; el rate limiting propio va en un spec de seguridad.
- **No:** reenviar desde `/activar-cuenta`. Si el código venció, el tutor contacta al staff para una nueva invitación; la pantalla solo muestra el aviso.
- **No:** cambios en la base de datos. Todo el esquema, los RPC y las policies están en SPEC 10.
- **No:** botón de revocar invitación en la UI. El RPC `revoke_tutor_invitation` existe pero la UI queda para otro spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La clave `RESEND_API_KEY` se filtra en el cliente | Solo se usa en `utils/email.ts` (sin `"use client"`) y en Server Actions; nunca en `NEXT_PUBLIC_*` |
| El correo llega a spam o no llega en desarrollo | Usar el dominio sandbox de Resend en dev (`onboarding@resend.dev`); en producción verificar el dominio |
| `auth.admin.createUser` falla pero el correo ya fue enviado | El tutor puede intentar activarse de nuevo: la invitación sigue `pending`; el Server Action detecta que el usuario aún no existe y reintenta |
| El usuario ya existe y el `signInWithPassword` falla con la contraseña ingresada | Devolver error "Contraseña incorrecta." sin revelar que el usuario ya tenía cuenta; el tutor puede usar recuperación de contraseña (spec futuro) |
| `profiles.status` se actualiza pero `accept_tutor_invitation` falla | El tutor queda `active` sin vínculo; se puede reintentar el flujo completo; el RPC de SPEC 10 es idempotente para el mismo tutor |
| El cliente de servicio se usa en un Client Component por error | `utils/supabase/admin.ts` no tiene `"use client"` y su importación en un Client Component lanza un error de build |
| El modal no devuelve el foco al abrirse y cerrarse | Usar `dialog` nativo o `focus-trap` al montar el modal; verificar con teclado en Playwright |
| La URL con `?code=` queda en el historial del navegador | Es intencional: permite recargar la página; el código vence y el RPC es idempotente |
| Dos invitaciones al mismo tutor para el mismo niño en paralelo | El índice parcial único de SPEC 10 lo bloquea; la segunda llamada reutiliza la invitación `pending` |
| Un tutor activa la cuenta pero el redirect a `/` entra en bucle con el proxy | `/activar-cuenta` es ruta pública; tras el redirect a `/`, la home detecta sesión de tutor y muestra el portal sin nuevo redirect |

## What is **not** in this spec

- Plantilla HTML con marca visual del correo.
- Recordatorios automáticos, cron de expiración o webhooks de Resend.
- Recuperación de contraseña para tutores.
- Rate limiting y CAPTCHA en `/activar-cuenta`.
- UI para revocar una invitación (el RPC existe).
- Portal del tutor más allá de la home: asistencia, bitácora, recogidas.
- Multi-tenant o invitación a varios niños en una operación.
- Tests automatizados de correo.

Cada una de esas, si llega, va en su propio spec.

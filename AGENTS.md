<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Stack

- Next.js **16.3.5** (App Router) + React **19.2** + TypeScript strict. Confirma APIs contra `node_modules/next/dist/docs/` o Context7 antes de codificar.
- Tailwind CSS **v4**: no hay `tailwind.config.*`; el theme vive en `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). Dark mode vía `prefers-color-scheme` (CSS), no `.dark` class.
- Alias de import: `@/*` → raíz del repo.
- Backend: **Supabase** (Postgres, Auth, RLS, Edge Functions, Storage). La app accede a la base de datos con los paquetes oficiales de Supabase para Next.js: `@supabase/supabase-js` + `@supabase/ssr` (versiones fijadas en `package.json`). Migraciones/CLI usan `SUPABASE_DB_PASSWORD` en `.env` (plantilla en `.env.template`; `.env*` está en `.gitignore`).

## Supabase en la app (paquetes oficiales Next.js)

- **Toda interacción con la base de datos desde la aplicación pasa por `@supabase/supabase-js` + `@supabase/ssr` y los helpers de `utils/supabase/`. No crear clientes ad-hoc ni conectar Postgres directo desde la app.**
- Helpers disponibles:
  - `utils/supabase/client.ts` → `createBrowserClient`, solo para Client Components/hooks.
  - `utils/supabase/server.ts` → `createServerClient` con `await cookies()` (Next 16), para Server Components, Server Actions y Route Handlers.
  - `utils/supabase/middleware.ts` → usado por el `proxy.ts` raíz (en Next 16 `middleware` está deprecado y se renombró a `proxy`); refresca la sesión con `supabase.auth.getUser()` y propaga las cookies.
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clave publishable, segura en el navegador). Nunca poner `service_role`/secret key en variables `NEXT_PUBLIC_*` ni en el cliente.
- La autorización de filas se resuelve con **RLS** en Postgres, no en el cliente: asume que toda query desde la app corre con el rol `authenticated`/`anon` y sus políticas.

## Base de datos (regla obligatoria)

- **Cada vez que se manipula la base de datos se hace SIEMPRE con migraciones, sin excepciones.** Esto aplica tanto a cambios de esquema (crear/alterar/borrar tablas, columnas, índices, políticas RLS, triggers, funciones, tipos, extensiones, etc.) como a cambios persistentes de datos (insert/update/delete de seed data, catálogos, correcciones, etc.). Nunca uses SQL suelto ni el dashboard.
- Usa `supabase_apply_migration` (o `supabase migration new` en local) para cada cambio, con nombre en `snake_case` y una migración por cambio. Toda manipulación debe quedar versionada y reproducible.
- El SQL ad-hoc (`supabase_execute_sql`) queda reservado exclusivamente para consultas **read-only** (lectura, diagnóstico, `EXPLAIN`). Cualquier escritura, DDL o cambio de datos va dentro de una migración versionada.

## Comandos

- `npm run dev` (puerto 3000) · `npm run lint` · `npm run build`.
- No hay test runner configurado. Typecheck manual: `npx tsc --noEmit`.

## Estructura

- `app/` contiene las rutas y componentes; `utils/supabase/` contiene los clientes de Supabase; `proxy.ts` (raíz) refresca la sesión.
- `references/pantallas/*.html` y `references/screenshots/` = mockups de diseño (HTML standalone con Tailwind CDN, Material 3, fuente Plus Jakarta Sans). Son la fuente de verdad del UI objetivo, NO parte del build.
- Flujo spec-driven: las skills `/spec` y `/spec-impl` (`.agents/skills/`) escriben specs en `specs/NN-slug.md` (estado `Draft`→`Approved`, idioma = idioma del prompt) y `spec-impl` crea la rama `spec-NN-slug`.

## Convenciones

- UI y textos en **español** (ver referencias: "Portal Familias", "Panel de Control de Aula y Guardería").

## MCPs (ver opencode.json)

- Playwright: cualquier screenshot, snapshot, log o console output va a `.playwright-mcp/` (en `.gitignore`).
- Context7: usar para traer documentación actualizada de librerías/frameworks (Next 16 rompe con versiones previas).
- Supabase: herramientas `supabase_*` (SQL, migraciones, advisors, logs, Edge Functions, branches). Antes de operar, sigue las skills `supabase` y `supabase-postgres-best-practices`.

## Skills (`.agents/skills/`)

- `spec` / `spec-impl`: flujo spec-driven. `/spec` escribe specs en `specs/NN-slug.md` (estado `Draft`→`Approved`, idioma = idioma del prompt); `/spec-impl` valida el estado, crea la rama `spec-NN-slug` y avanza la implementación por pasos con pausas para revisar diffs.
- `supabase` (`.agents/skills/supabase/`): **cargar en cualquier tarea con Supabase** (Database, Auth, RLS, Edge Functions, Realtime, Storage, CLI/MCP, migraciones, debugging y logs). Incluye checklist de seguridad obligatorio (RLS en schemas expuestos, `auth.uid()` en vez de `user_metadata`, `TO authenticated` + predicado de ownership, no `SECURITY DEFINER` indiscriminado, no exponer `service_role`). Verifica contra changelog/docs actuales, no contra memoria.
- `supabase-postgres-best-practices` (`.agents/skills/supabase-postgres-best-practices/`): **cargar antes de tocar cualquier cosa que viva en Postgres** (tablas/columnas, schemas, migraciones, RLS e índices, triggers, funciones, pg_cron/pgmq, pgvector, import/restore, y para diagnosticar queries lentas, locking o bloat). Reglas priorizadas en `references/`.

## Subagente

- `spec-verify` (`.opencode/agents/spec-verify.md`): agente verificador de los *Acceptance criteria* de un spec en `specs/`. Recibe `NN` o la ruta del spec, valida cada criterio con la herramienta adecuada (Playwright + visión para UI, Context7 para APIs de Next.js, `lint`/`tsc`/`build` para código), corrige lo que esté dentro de alcance y marca los checks solo con evidencia verificable (ruta de screenshot, salida de consola o `archivo:línea`). Informe final en español. No modifica `references/`, otros specs ni `specs/.spec-config.yml`.

## Reglas de codigo 

- Usar codigo limpio, nombres, funciones, variables, etc. en ingles 
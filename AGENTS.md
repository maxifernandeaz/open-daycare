<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Stack

- Next.js **16.3.5** (App Router) + React **19.2** + TypeScript strict. Confirma APIs contra `node_modules/next/dist/docs/` antes de codificar.
- Tailwind CSS **v4**: no hay `tailwind.config.*`; el theme vive en `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). Dark mode vía `prefers-color-scheme` (CSS), no `.dark` class.
- Alias de import: `@/*` → raíz del repo.
- Backend: **Supabase** (Postgres, Auth, RLS, Edge Functions, Storage). La app accede a la base de datos con los paquetes oficiales de Supabase para Next.js: `@supabase/supabase-js` + `@supabase/ssr` (versiones fijadas en `package.json`). Migraciones/CLI usan `SUPABASE_DB_PASSWORD` en `.env` (plantilla en `.env.template`; `.env*` está en `.gitignore`).

## Supabase en la app (paquetes oficiales Next.js)

- **Toda interacción con la base de datos desde la aplicación pasa por `@supabase/supabase-js` + `@supabase/ssr` y los helpers de `utils/supabase/`. No crear clientes ad-hoc ni conectar Postgres directo desde la app.**
- Helpers disponibles:
  - `utils/supabase/client.ts` → `createBrowserClient`, solo para Client Components/hooks.
  - `utils/supabase/server.ts` → `createServerClient` con `await cookies()` (Next 16), para Server Components, Server Actions y Route Handlers.
  - `utils/supabase/middleware.ts` → usado por el `proxy.ts` raíz (en Next 16 `middleware` está deprecado y se renombró a `proxy`); refresca la sesión con `supabase.auth.getUser()` y propaga las cookies.
  - `utils/supabase/cookie-options.ts` → `AUTH_COOKIE_OPTIONS` (`path`, `sameSite`, `httpOnly`, `secure`) compartido por los clientes.
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clave publishable, segura en el navegador). Nunca poner `service_role`/secret key en variables `NEXT_PUBLIC_*` ni en el cliente.
- La autorización de filas se resuelve con **RLS** en Postgres, no en el cliente: asume que toda query desde la app corre con el rol `authenticated`/`anon` y sus políticas.
- Patrones RLS obligatorios (checklist de la skill `supabase`): `TO authenticated` **más** predicado de ownership (`(select auth.uid()) = user_id`), no solo el rol; en `UPDATE`, `USING` **y** `WITH CHECK`; nunca `auth.role()` (deprecado) ni `user_metadata` para autorizar (usar `app_metadata`); vistas con `security_invoker = true`; RLS activado en todo schema expuesto (`public` por defecto).
- Documentación: verificar siempre contra el changelog y docs actuales (`https://supabase.com/changelog.md`; cualquier página de docs sirve como `.md`). En MCP usa `supabase_search_docs`. No asumir APIs de memoria.

## Base de datos (regla obligatoria)

- **Cada vez que se manipula la base de datos se hace SIEMPRE con migraciones, sin excepciones.** Esto aplica tanto a cambios de esquema (crear/alterar/borrar tablas, columnas, índices, políticas RLS, triggers, funciones, tipos, extensiones, etc.) como a cambios persistentes de datos (insert/update/delete de seed data, catálogos, correcciones, etc.). Nunca uses SQL suelto ni el dashboard.
- Usa `supabase_apply_migration` (o `supabase migration new` en local) para cada cambio, con nombre en `snake_case` y una migración por cambio. Toda manipulación debe quedar versionada y reproducible.
- Las migraciones viven en `supabase/migrations/<timestamp>_snake_case.sql` y se versionan en git. El repo no tiene `supabase/config.toml`: el flujo principal es el MCP remoto. Si se inicializa el CLI local, seguir la skill `supabase` (iterar con `execute_sql`/`db query` y versionar con `supabase db pull`), sin dejar SQL suelto.
- El SQL ad-hoc (`supabase_execute_sql`) queda reservado exclusivamente para consultas **read-only** (lectura, diagnóstico, `EXPLAIN`). Cualquier escritura, DDL o cambio de datos va dentro de una migración versionada.
- Antes de cerrar un cambio de esquema, pasar `supabase_get_advisors` (security y performance) y revisar el checklist de seguridad de la skill `supabase`.

## Comandos

- `npm run dev` (puerto 3000) · `npm run lint` · `npm run build`.
- No hay test runner configurado. Typecheck manual: `npx tsc --noEmit`.

## Estructura

- `app/` contiene las rutas y componentes; `utils/supabase/` contiene los clientes de Supabase; `proxy.ts` (raíz) refresca la sesión.
- `supabase/migrations/` = migraciones versionadas del proyecto (`supabase/.temp/` está en `.gitignore`).
- `references/pantallas/*.html` y `references/screenshots/` = mockups de diseño (HTML standalone con Tailwind CDN, Material 3, fuente Plus Jakarta Sans). Son la fuente de verdad del UI objetivo, NO parte del build.
- Flujo spec-driven: las skills `/spec` y `/spec-impl` (`.agents/skills/`) escriben specs en `specs/NN-slug.md` (estado `Draft`→`Approved`, idioma = idioma del prompt) y `spec-impl` crea la rama `spec-NN-slug`.
- **Specs de datos → `specs/database/`**: cualquier especificación que involucre datos (esquema, tablas, columnas, migraciones, seed data, RLS, triggers, funciones, etc.) se crea en `specs/database/NN-slug.md`, nunca suelta en `specs/`. Los specs de UI/app siguen en `specs/NN-slug.md`.

## Convenciones

- UI y textos en **español** (ver referencias: "Portal Familias", "Panel de Control de Aula y Guardería").

## MCPs (ver opencode.json)

- Supabase: MCP **remoto** configurado en la config global de opencode (`~/.config/opencode/opencode.json`), no en el `opencode.json` del repo. Herramientas `supabase_*` (SQL, migraciones, advisors, logs, Edge Functions, branches, docs). Antes de operar, sigue las skills `supabase` y `supabase-postgres-best-practices`.
- Playwright: configurado en el `opencode.json` del repo (`npx -y @playwright/mcp@latest`). Cualquier screenshot, snapshot, log o console output va a `.playwright-mcp/` (en `.gitignore`).
- Context7 **no está configurado**: para Next.js 16 usa `node_modules/next/dist/docs/`; para Supabase usa `supabase_search_docs` o el `.md` de la página de docs; para el resto, web search/webfetch.

## Skills (`.agents/skills/`)

- Las skills se instalan con el gestor (`npx skills add <owner/repo>`) y quedan fijadas por hash en `skills-lock.json` (versionar ese archivo). `find-skills` (global, `~/.agents/skills/find-skills`) sirve para descubrir e instalar skills nuevas.
- `spec` / `spec-impl` (klerith/fernando-skills): flujo spec-driven. `/spec` escribe specs en `specs/NN-slug.md` (UI/app) o `specs/database/NN-slug.md` (datos/esquema/migraciones, estado `Draft`→`Approved`, idioma = idioma del prompt); `/spec-impl` valida el estado, crea la rama `spec-NN-slug` y avanza la implementación por pasos con pausas para revisar diffs.
- `supabase` v0.1.2 (supabase/agent-skills): **cargar en cualquier tarea con Supabase** (Database, Auth, RLS, Edge Functions, Realtime, Storage, Vectors, Cron, Queues, CLI/MCP, migraciones, debugging y logs). Incluye checklist de seguridad obligatorio (RLS en schemas expuestos, `auth.uid()` en vez de `user_metadata`, `TO authenticated` + predicado de ownership, no `SECURITY DEFINER` indiscriminado, no exponer `service_role`). Verifica contra changelog/docs actuales, no contra memoria.
- `supabase-postgres-best-practices` v1.1.1 (supabase/agent-skills): **cargar antes de tocar cualquier cosa que viva en Postgres** (tablas/columnas, schemas, migraciones, RLS e índices, triggers, funciones, pg_cron/pgmq, pgvector, import/restore, y para diagnosticar queries lentas, locking o bloat). Reglas priorizadas en `references/` por impacto (`query-`, `conn-`, `security-`, `schema-`, `lock-`, `data-`, `monitor-`, `advanced-`).

## Subagente

- `spec-verify` (`.opencode/agents/spec-verify.md`): agente verificador de los *Acceptance criteria* de un spec en `specs/`. Recibe `NN` o la ruta del spec, valida cada criterio con la herramienta adecuada (Playwright + visión para UI, docs de Next.js 16 en `node_modules/next/dist/docs/` para APIs, `lint`/`tsc`/`build` para código), corrige lo que esté dentro de alcance y marca los checks solo con evidencia verificable (ruta de screenshot, salida de consola o `archivo:línea`). Informe final en español. No modifica `references/`, otros specs ni `specs/.spec-config.yml`.

## Reglas de codigo 

- Usar codigo limpio, nombres, funciones, variables, etc. en ingles 
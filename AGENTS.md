<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Stack

- Next.js **16.3.5** (App Router) + React **19.2** + TypeScript strict. Confirma APIs contra `node_modules/next/dist/docs/` o Context7 antes de codificar.
- Tailwind CSS **v4**: no hay `tailwind.config.*`; el theme vive en `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). Dark mode vía `prefers-color-scheme` (CSS), no `.dark` class.
- Alias de import: `@/*` → raíz del repo.

## Comandos

- `npm run dev` (puerto 3000) · `npm run lint` · `npm run build`.
- No hay test runner configurado. Typecheck manual: `npx tsc --noEmit`.

## Estructura

- `app/` es el único código de la app (hoy sigue siendo el boilerplate de create-next-app).
- `references/pantallas/*.html` y `references/screenshots/` = mockups de diseño (HTML standalone con Tailwind CDN, Material 3, fuente Plus Jakarta Sans). Son la fuente de verdad del UI objetivo, NO parte del build.
- Flujo spec-driven: las skills `/spec` y `/spec-impl` (`.agents/skills/`) escriben specs en `specs/NN-slug.md` (estado `Draft`→`Approved`, idioma = idioma del prompt) y `spec-impl` crea la rama `spec-NN-slug`.

## Convenciones

- UI y textos en **español** (ver referencias: "Portal Familias", "Panel de Control de Aula y Guardería").

## MCPs (ver opencode.json)

- Playwright: cualquier screenshot, snapshot, log o console output va a `.playwright-mcp/` (en `.gitignore`).
- Context7: usar para traer documentación actualizada de librerías/frameworks (Next 16 rompe con versiones previas).

## Spec Driven Development - Skill
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Subagente

- `spec-verify` (`.opencode/agents/spec-verify.md`): agente verificador de los *Acceptance criteria* de un spec en `specs/`. Recibe `NN` o la ruta del spec, valida cada criterio con la herramienta adecuada (Playwright + visión para UI, Context7 para APIs de Next.js, `lint`/`tsc`/`build` para código), corrige lo que esté dentro de alcance y marca los checks solo con evidencia verificable (ruta de screenshot, salida de consola o `archivo:línea`). Informe final en español. No modifica `references/`, otros specs ni `specs/.spec-config.yml`.

## Reglas de codigo 

- Usar codigo limpio, nombres, funciones, variables, etc. en ingles 
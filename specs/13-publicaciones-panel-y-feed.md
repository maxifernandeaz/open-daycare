# SPEC 13 — Publicaciones de Aula: Panel Staff y Feed de Familias

> **Estado:** approved
> **Depende de:** SPEC 06, SPEC 07, SPEC 12
> **Fecha:** 2026-11-09
> **Objetivo:** Conectar las tablas y el bucket de SPEC 12 a una pantalla de gestión en `/panel-aula/entradas` y a un feed real en el portal de familias, con subida directa de hasta 4 imágenes y aviso de consentimiento.

## Por qué este spec existe

SPEC 12 deja listas las tablas `posts` y `post_images`, el bucket privado, las policies RLS y el RPC de consentimiento. Falta la parte visible:

1. El staff necesita un lugar para escribir, editar y borrar entradas, y para subir fotos sin pasar los archivos por una Server Action.
2. Las familias necesitan ver las entradas reales de sus aulas en `/`, no la publicación de ejemplo de `data/mock.ts`.
3. El formulario debe avisar cuántos niños del aula no tienen consentimiento de imágenes, sin exponer sus nombres.

La subida de imágenes va directa del navegador a Storage con URLs firmadas. Una Server Action no puede transportar 4 archivos de 5 MB en Vercel: el límite de payload de la función es de ~4.5 MB, aunque se suba `serverActions.bodySizeLimit`.

## Scope

**In:**

- `app/panel-aula/entradas/page.tsx`: listado paginado de entradas visibles para el staff, con acciones de editar y borrar.
- `app/panel-aula/entradas/nueva/page.tsx`: formulario de alta.
- `app/panel-aula/entradas/[id]/editar/page.tsx`: formulario de edición con las imágenes existentes.
- `app/panel-aula/entradas/actions.ts`: Server Actions `createPost`, `updatePost`, `attachPostImages`, `deletePost` y `getPhotoConsentCount`.
- `app/panel-aula/entradas/queries.ts`: consultas de listado, formulario, detalle y feed familiar; helper de URLs firmadas.
- `app/panel-aula/entradas/formatters.ts`: etiquetas de categoría, fecha y extracto de texto.
- `app/components/panel-aula/posts/PostForm.tsx`: Client Component con campos de texto, aula, categoría y gestión de imágenes.
- `app/components/panel-aula/posts/ImageUploader.tsx`: Client Component para seleccionar, previsualizar, describir y subir imágenes.
- `app/components/panel-aula/posts/PostList.tsx`: lista de entradas del staff.
- `app/components/panel-aula/posts/PostCard.tsx`: tarjeta de entrada con miniaturas y acciones.
- `app/components/panel-aula/posts/DeletePostButton.tsx`: confirmación de borrado con `<dialog>`.
- `app/components/panel-aula/posts/ConsentNotice.tsx`: aviso estático y conteo dinámico de consentimiento.
- `app/components/FamilyFeed.tsx`: Server Component con el feed paginado del portal de familias.
- `app/page.tsx`: fetch del feed y paso como `ReactNode` a `HomePortal`.
- `app/components/HomePortal.tsx`: recibe `feed: ReactNode`, elimina `TeacherHighlight` y el mock `highlight`.
- `app/panel-aula/page.tsx`: enlace visible “Publicaciones” hacia `/panel-aula/entradas`.
- `app/components/TeacherHighlight.tsx`: se elimina; no tiene otros consumidores.
- `data/mock.ts`: se elimina la propiedad `highlight` de `dailyHome`, el tipo `TeacherPost` y las dos constantes de imagen asociadas.
- Revalidación de `/` y `/panel-aula/entradas` después de cada mutación; tras editar, también la ruta concreta de edición `/panel-aula/entradas/{postId}/editar` con `revalidatePath`.

**Out of scope (para specs futuros):**

- Notificaciones por email o push al publicar.
- Borradores, programación o moderación previa.
- Comentarios, reacciones, “me gusta”, guardados o respuestas de familias.
- Etiquetar niños o elegir destinatarios dentro del aula.
- Reordenar, recortar, rotar, comprimir o aplicar filtros a las imágenes.
- Editor de texto enriquecido o Markdown; el cuerpo es texto plano con saltos de línea.
- Video, PDF, audio u otros tipos de archivo.
- Subida por arrastrar y soltar o pegando desde el portapapeles.
- Bucket público, CDN, transformaciones de imagen o descarga en alta resolución.
- Janitor automático de objetos huérfanos.
- Limpieza o reintento automático de imágenes fallidas.
- Buscador, filtros por categoría o por aula dentro del feed.
- Multi-centro o publicaciones para staff.
- Tests automatizados; la verificación es manual con Playwright.

## Data model

Este spec **no introduce estructuras nuevas en la base de datos**. Reutiliza íntegramente SPEC 12: `posts`, `post_images`, el bucket `post-images`, las policies RLS y el RPC `count_children_without_photo_consent`.

### Contratos TypeScript

```ts
export type PostImageMime = "image/jpeg" | "image/png" | "image/webp";

export type PostFormInput = {
  title: string;
  body: string;
  category: PostCategory | null;
  classroomId: string | null;
  imageTypes: PostImageMime[];
};

export type UploadTarget = {
  path: string;
  token: string;
};

export type CreatePostResult =
  | {
      ok: true;
      postId: string;
      uploadTargets: UploadTarget[];
      warning?: string;
    }
  | { ok: false; error: string };

export type UpdatePostInput = {
  postId: string;
  title: string;
  body: string;
  category: PostCategory | null;
  classroomId: string | null;
  removedImageIds: string[];
  keptImages: Array<{ id: string; altText: string }>;
  newImageTypes: PostImageMime[];
};

export type UpdatePostResult =
  | {
      ok: true;
      postId: string;
      uploadTargets: UploadTarget[];
      warning?: string;
      storageCleanupFailed?: boolean;
    }
  | { ok: false; error: string };

export type AttachPostImagesInput = {
  postId: string;
  images: Array<{ path: string; altText: string }>;
};

export type AttachPostImagesResult =
  | { ok: true; attached: number; failed: number }
  | { ok: false; error: string };

export type DeletePostResult =
  | { ok: true; storageCleanupFailed: boolean }
  | { ok: false; error: string };

export type PhotoConsentCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  category: PostCategory | null;
  classroomName: string | null;
  authorName: string;
  createdAt: string;
  images: Array<{
    path: string;
    altText: string | null;
    sortOrder: number;
  }>;
};

export type FamilyFeedData = {
  posts: FeedPost[];
  imageUrls: Record<string, string>;
  page: number;
  hasMore: boolean;
  error: string | null;
};
```

### Estados de la subida

```
idle → validando → creando entrada → subiendo (n/m) → registrando imágenes → listo
                                                        ↘ listo con aviso (algunas imágenes fallaron)
     ↘ error de validación o de entrada (no se publica)
```

- Si falla la creación de la entrada, no se sube ninguna imagen.
- Si falla una imagen, la entrada ya está publicada y el resto de las imágenes se registran.
- El aviso de fallo no bloquea: la entrada queda visible y se puede reintentar desde edición.

### Reglas de presentación

- Categorías: `actividad` → “Actividad”, `aviso` → “Aviso”, `menu` → “Menú”, `foto` → “Foto”, `espacio` → “Espacio”; sin categoría no se muestra chip.
- Aula: nombre del aula o “Todas las aulas” si `classroom_name` es `null`.
- Fecha: `Intl.DateTimeFormat("es", { dateStyle: "long" })`.
- Alt de imagen: `alt_text`; si es `null`, `title`; si hay varias imágenes sin alt, `"{title} (imagen N de M)"`.
- Cuerpo: texto plano con `whitespace-pre-line`; sin HTML.

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-13-publicaciones-panel-y-feed`. Verificar: `git branch --show-current`.
3. **Consultas base.** En Next 16, `params` y `searchParams` son `Promise`; las páginas nuevas los esperan con `await`. Crear `app/panel-aula/entradas/queries.ts` con:
   - `getStaffPosts(page)` con `count: "exact"`, 20 por página y URLs firmadas en lote.
   - `getPostFormOptions(profile)` con todas las aulas para managers y solo las asignadas para educators.
   - `getPostForEdit(id)` con la entrada, sus imágenes y URLs firmadas.
   - `getFamilyFeed(page)` con 10 por página y URLs firmadas en lote.
   - Helper `signPostImages(supabase, paths)` que llama una sola vez a `createSignedUrls(paths, 3600)` y devuelve un mapa `path → signedUrl`.
   Verificar: `npx tsc --noEmit` limpio y una consulta manual devuelve las filas esperadas.
4. **Rutas y listado.** Crear `/panel-aula/entradas` con `requireStaff()`, `AppSidebar`, `AppHeader` y `PostList`; crear los esqueletos de `/nueva` y `/[id]/editar`; añadir el enlace “Publicaciones” en `app/panel-aula/page.tsx`. El listado muestra “Editar” y “Eliminar” si el usuario es manager, o si es autor y la entrada no es global y pertenece a un aula asignada; la RLS sigue siendo la última palabra. El formulario de edición aplica la misma condición y usa `notFound()` si la entrada no es editable. Verificar: un tutor que entra a `/panel-aula/entradas` es redirigido a `/`; un educador ve el listado y solo las acciones de sus entradas editables.
5. **Alta solo texto.** Crear `createPost` y `PostForm` sin imágenes. Validar título (1–120), cuerpo (1–5000), categoría contra el enum y aula permitida. El select envía “Todas las aulas” como cadena vacía y el servidor la convierte a `null`. Insertar con `author_id` del usuario autenticado; `author_name` lo llena el trigger. Revalidar `/` y `/panel-aula/entradas`. Verificar: una entrada de texto aparece en el listado y en el feed.
6. **Preparar subidas.** Ampliar `createPost` para recibir `imageTypes`: validar 0–4 elementos y que cada uno sea `image/jpeg`, `image/png` o `image/webp`; mapear a extensión `jpg`, `png` o `webp`. Generar una ruta `{postId}/{crypto.randomUUID()}.{ext}` por tipo con `createSignedUploadUrl` usando el cliente de servidor, en el mismo orden que los archivos. Devolver `{ path, token }`. Si falla la firma de una, detenerse, devolver `ok: true`, las rutas anteriores y un `warning`: el cliente sube solo ese prefijo y el resto se agrega desde edición. Verificar: las rutas empiezan con el `postId`, la extensión coincide con el MIME y las genera el servidor.
7. **Subida directa.** Crear `ImageUploader`: validar tipo (`image/jpeg`, `image/png`, `image/webp`) y tamaño (≤5 MB) en cliente, mostrar previsualizaciones con `URL.createObjectURL` y revocarlas al quitar o desmontar, pedir `altText` opcional y subir con `uploadToSignedUrl(path, token, file)` usando el cliente de navegador. Verificar: las imágenes llegan al bucket privado y la consola queda limpia.
8. **Registrar imágenes.** Crear `attachPostImages`: verificar que la entrada sea editable por el usuario, que cada `path` cumpla `^{postId}/[0-9a-f-]{36}\.(jpg|png|webp)$`, que exista en `storage.list(postId)` comparando `postId + "/" + object.name`, que el total no supere 4 y que el `altText` respete 160 caracteres. Guardar `alt_text` como `null` si el texto queda vacío. Asignar `sort_order` a los huecos libres 0–3; ignorar el orden del cliente. Insertar con `upsert` sobre `storage_path` e `ignoreDuplicates: true` para ser idempotente. Verificar: 4 imágenes se registran; la quinta se rechaza; un path de otra entrada se rechaza.
9. **Manejo de fallos.** Encadenar en `PostForm`: `createPost` → subir con `Promise.allSettled` → `attachPostImages` con las que subieron. Si `createPost` devuelve `warning` (no se pudieron firmar todas las rutas), mostrar el aviso igual que un fallo de subida. Si alguna imagen falló, mostrar un aviso `aria-live="polite"` con “La entrada se publicó, pero N imágenes no se subieron. Podés reintentarlas desde Editar.” y un enlace a la edición; no redirigir en ese caso. Verificar: bloquear una solicitud de Storage en DevTools y comprobar que la entrada queda publicada con las imágenes restantes.
10. **Edición.** Implementar `updatePost`: verificar que la entrada sea visible y editable por el usuario y que las imágenes de `keptImages`/`removedImageIds` pertenezcan a ella; actualizar título, cuerpo, categoría y aula; actualizar `alt_text` de las imágenes conservadas; validar que `keptImages.length + removedImageIds.length + newImageTypes.length` no supere 4 y que `newImageTypes` (0–4) use MIME permitido; generar las rutas nuevas en el servidor; para cada imagen removida, intentar `storage.remove` con el cliente del usuario y luego borrar su fila; devolver rutas y tokens para las nuevas. Si la limpieza de una imagen falla, borrar igual la fila y devolver `storageCleanupFailed: true` con un `warning`. El formulario precarga datos y miniaturas, permite quitar imágenes y añadir nuevas sin superar 4, y encadena `updatePost` → subir nuevas → `attachPostImages`; si falla una nueva, la edición queda aplicada y se avisa. Verificar: un autor edita su entrada; un educador no puede editar una entrada de otra aula; un manager edita cualquiera.
11. **Borrado.** Implementar `deletePost`: verificar visibilidad y rol, obtener los `storage_path`, intentar `storage.remove(paths)` con el cliente del usuario, borrar la fila de `posts` y revalidar. Si la limpieza de Storage falla, borrar igualmente la fila y devolver `storageCleanupFailed: true`; el componente muestra un aviso no bloqueante. Verificar: la entrada desaparece del listado y del feed; un autor borra la suya; un manager borra cualquiera.
12. **Consentimiento.** Crear `getPhotoConsentCount(classroomId)` que llama al RPC de SPEC 12 con el cliente de servidor. `ConsentNotice` muestra siempre el aviso legal estático y, al montar y al cambiar de aula, muestra el conteo: “En esta aula hay N niños sin autorización de imágenes” o “En el centro hay N niños sin autorización de imágenes” para “Todas las aulas”. Si el conteo es 0, no muestra alerta dinámica. Si falla, muestra un aviso neutro y no bloquea el envío. Verificar: un manager consulta el global; un educador solo su aula; un tutor no puede ejecutar la acción.
13. **Feed de familias.** En `app/page.tsx`, leer `searchParams.page` como `Promise`, pedir `getFamilyFeed(page)`, renderizar `<FamilyFeed data={feed} />` y pasarlo a `<HomePortal feed={...} />`. `HomePortal` deja de importar `TeacherHighlight` y de destructurar `highlight`; usa `feed` en la misma posición del grid. Eliminar `TeacherHighlight.tsx` y el mock `highlight` de `data/mock.ts`. Verificar: `/` muestra entradas reales, no el mock; un tutor de otra aula no ve entradas ajenas.
14. **Paginación y estados.** `FamilyFeed` muestra 10 entradas por página con enlaces “Ver más” y “Anteriores” sobre `?page=N`; `PostList` muestra 20 por página. Añadir estados vacío (“Todavía no hay publicaciones.”), error de carga y placeholder de imagen cuando firma la URL falla. Verificar: con 11 entradas aparece “Ver más”; `?page=999` se normaliza a la última página válida o a la primera.
15. **Accesibilidad y responsive.** Etiquetas asociadas, `aria-required`, `aria-live` para progreso y avisos, `role="alert"` para errores, foco devuelto al botón que abre el diálogo de borrado, navegación por teclado, alt significativo y sin scroll horizontal a 375 px. Verificar: recorrido completo con teclado y axe sin errores críticos.
16. **Lint, tipos y build.** `npm run lint`, `npx tsc --noEmit`, `npm run build`. Verificar: sin errores.
17. **Verificación Playwright.** A 1440 px y 375 px: manager crea entrada con 0, 1 y 4 imágenes; educador crea en su aula y no ve “Todas las aulas”; educador intenta editar una entrada de otra aula (no aparece); tutor ve global + su aula y no ve otra aula; se simula un fallo de subida; se borra una entrada. Screenshots en `.playwright-mcp/`.

## Acceptance criteria

- [x] `/panel-aula/entradas`, `/panel-aula/entradas/nueva` y `/panel-aula/entradas/[id]/editar` llaman a `requireStaff()`; un tutor es redirigido a `/`.
- [x] `app/panel-aula/page.tsx` muestra un enlace “Publicaciones” hacia `/panel-aula/entradas` para todo el staff.
- [x] El listado del staff muestra las entradas visibles por RLS, 20 por página, con título, categoría, aula, autor, fecha y miniaturas.
- [ ] Un manager ve la opción “Todas las aulas” en el formulario; un educador solo ve sus aulas asignadas y no ve la opción global.
- [ ] Un educador sin aulas asignadas ve un mensaje y no puede enviar el formulario.
- [ ] Se puede publicar una entrada solo texto; aparece en `/panel-aula/entradas` y en `/` sin recargar manualmente.
- [ ] El formulario acepta 0 a 4 imágenes; un quinto archivo se rechaza en cliente y en servidor.
- [ ] El cliente rechaza archivos que no sean `image/jpeg`, `image/png` o `image/webp`, y archivos de más de 5 MB.
- [ ] `createPost` recibe solo los MIME types, rechaza los no permitidos y genera rutas `{post_id}/{uuid}.{ext}` en el servidor con `ext` derivada del MIME; devuelve `{ path, token }` en el mismo orden que los archivos y el cliente nunca elige la ruta.
- [ ] `attachPostImages` rechaza un `path` que no empiece con `{postId}/`, que no exista en `storage.list(postId)` o que supere el total de 4.
- [ ] `attachPostImages` asigna `sort_order` 0–3 en el servidor e ignora cualquier orden enviado por el cliente.
- [ ] Si una imagen falla al subir, la entrada queda publicada con las imágenes que sí subieron y se muestra un aviso no bloqueante con enlace a la edición.
- [ ] Si `createSignedUploadUrl` falla para alguna imagen, la entrada se publica y se informa que se pueden agregar desde edición.
- [ ] El autor edita su entrada y un manager edita cualquiera; un educador no puede editar una entrada de otra aula.
- [ ] En edición se puede cambiar título, cuerpo, categoría, aula, `alt_text` de imágenes existentes, quitar imágenes y agregar nuevas sin superar 4.
- [ ] Al quitar una imagen en edición se intenta borrar el objeto de Storage antes de borrar la fila; si la limpieza falla, la fila se borra igual y se muestra un aviso.
- [ ] El borrado de una entrada elimina los objetos de Storage y luego la fila; si la limpieza de Storage falla, la fila se borra igual y se muestra un aviso.
- [ ] Un autor borra su entrada; un manager borra cualquier entrada; un educador no borra una entrada de otra aula.
- [ ] `getPhotoConsentCount(null)` funciona solo para manager y cuenta todos los niños del centro sin consentimiento.
- [ ] `getPhotoConsentCount(classroomId)` funciona para manager o educador asignado y cuenta niños del aula sin ningún tutor con `photo_consent = true`.
- [ ] El aviso de consentimiento muestra solo un número; nunca nombres, IDs ni filas de niños.
- [ ] Un tutor no puede ejecutar `getPhotoConsentCount` ni el RPC subyacente.
- [ ] El aviso legal estático se muestra siempre; el aviso dinámico solo aparece cuando el conteo es mayor que 0; un fallo del conteo no bloquea la publicación.
- [ ] `/` muestra entradas reales de `posts` y ya no renderiza `TeacherHighlight` ni el mock `highlight`.
- [ ] El feed de un tutor muestra entradas globales y de las aulas de sus niños, y no muestra entradas de otras aulas.
- [ ] El feed pide las URLs firmadas en una sola llamada `createSignedUrls` por página y renderiza `<img>` con `alt`.
- [ ] Si `alt_text` es `null`, el `alt` usa el título; con varias imágenes sin alt, añade “(imagen N de M)”.
- [ ] El feed muestra 10 entradas por página con “Ver más”/“Anteriores”; el listado staff muestra 20 por página.
- [ ] `?page` inválido o fuera de rango no rompe la página: se normaliza a un valor válido.
- [ ] Los estados vacío, error de carga y URL firmada fallida tienen un mensaje visible y no dejan la página en blanco.
- [ ] El diálogo de borrado devuelve el foco al botón que lo abrió y se puede cancelar con Escape.
- [ ] A 375 px no hay scroll horizontal en las tres pantallas nuevas ni en `/`.
- [ ] La consola del navegador queda limpia en `/`, `/panel-aula/entradas`, `/nueva` y `/[id]/editar`.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [ ] No se añaden dependencias nuevas a `package.json`.
- [ ] `git diff --name-only` solo muestra los archivos listados en el Scope, `data/mock.ts`, `app/components/TeacherHighlight.tsx` (eliminado) y este spec; no hay cambios en `supabase/migrations/`, `types/database.ts` ni en otros specs.

## Decisions

- **Sí:** subida directa con `createSignedUploadUrl` + `uploadToSignedUrl`. Evita el límite de ~4.5 MB por request de función en Vercel; el bucket impone 5 MB por archivo y tres MIME types.
- **Sí:** crear primero la fila de `posts` y después subir las imágenes. El `post_id` es el prefijo de las rutas y la entrada puede publicarse aunque una imagen falle.
- **Sí:** publicar la entrada aunque falle una imagen y avisar de forma no bloqueante. Revertir la entrada por una foto sería peor UX y perdería el texto ya escrito.
- **Sí:** `createPost` devuelve las rutas y tokens; el cliente sube y luego llama `attachPostImages`. La Server Action nunca recibe los bytes de las imágenes.
- **Sí:** el servidor decide `sort_order` y las rutas. El cliente no puede elegir el orden ni salir del prefijo de su entrada.
- **Sí:** `attachPostImages` idempotente con `upsert` sobre `storage_path`. Un reintento tras un error de red no duplica filas.
- **Sí:** sin reordenar imágenes en el MVP. El orden es el de subida y los huecos libres se reutilizan; así no se choca con `unique (post_id, sort_order)`.
- **Sí:** borrar la fila aunque falle la limpieza de Storage. La entrada debe desaparecer de la vista; un objeto huérfano es un problema de coste, no de integridad visible.
- **Sí:** `useTransition` + manejador de envío en lugar de `useActionState` para el alta y la edición con imágenes. El flujo encadena dos Server Actions y varias subidas directas; `useActionState` no puede orquestar los pasos intermedios. Se conserva el patrón de Server Actions y validación en servidor.
- **Sí:** `author_name` desnormalizado en `posts` (SPEC 12). `profiles` solo es legible por el propio usuario o un manager; un join en el feed devolvería `null` para los tutores.
- **Sí:** el feed confía en la RLS de `posts` y no repite el filtro de aulas en la query. Así una sola policy decide la visibilidad y no hay dos fuentes de verdad que puedan divergir.
- **Sí:** `<img>` en lugar de `next/image`. Las URLs firmadas son privadas y temporales; optimizar con `next/image` exigiría configurar el dominio y añadir otra capa de caché.
- **Sí:** 10 entradas por página en el feed y 20 en el panel. El feed prioriza lectura rápida; el panel necesita más filas para gestionar.
- **Sí:** paginación por offset con `?page`. El volumen esperado es bajo y permite enlaces “Ver más”/“Anteriores” sin estado de cursor.
- **Sí:** cuerpo de texto plano con `whitespace-pre-line`. Un editor enriquecido añade sanitización y dependencias que no hacen falta para el MVP.
- **Sí:** aviso de consentimiento con solo el conteo. El objetivo es recordar la regla, no exponer qué niños no tienen autorización.
- **Sí:** el conteo se pide al RPC a través de una Server Action. La UI no necesita conocer el nombre del RPC y el error se traduce a un mensaje neutro.
- **Sí:** eliminar `TeacherHighlight` y el mock `highlight`. Dejarlos sin uso confunde sobre cuál es la fuente real del feed.
- **No:** notificaciones al publicar. `profiles.notify_on_post` existe, pero el envío queda para un spec futuro.
- **No:** borradores o programación. La publicación es inmediata.
- **No:** comentarios, reacciones o descargas. El mock los tenía, pero no forman parte de este alcance.
- **No:** etiquetado por niño. El aviso de consentimiento es informativo y no registra apariciones.
- **No:** arrastrar y soltar, recortar o comprimir en cliente. Añaden complejidad y otra superficie de error.
- **No:** servicio `service_role` para limpiar Storage. Se usa el cliente del usuario y las policies de `storage.objects`; la RLS sigue siendo la última palabra.
- **No:** nuevas dependencias. Se usan APIs nativas de React, Next y Supabase.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un objeto queda huérfano si el navegador sube pero nunca llama `attachPostImages` | La entrada se publica; el usuario puede reintentar desde edición. El objeto sin fila no se muestra y se documenta para un janitor futuro. |
| Una subida parcial deja la entrada con menos imágenes | Se muestran las que se registraron y un aviso no bloqueante con enlace a edición; no se revierte la entrada. |
| La URL firmada de lectura vence mientras la pestaña está abierta | Se firman por 3600 s; al recargar se regeneran. Si una firma falla, se muestra un placeholder. |
| El navegador bloquea la subida por CORS o red | El error se cuenta como imagen fallida y se muestra el aviso; el usuario reintenta desde edición. |
| Un cliente malicioso intenta adjuntar un objeto de otra entrada | `attachPostImages` valida el prefijo con el `postId` y la existencia en `storage.list(postId)`; el check de la tabla y la policy de Storage también lo impiden. |
| Un cliente intenta subir más de 4 imágenes | El servidor valida el total y `unique (post_id, sort_order)` acota a 4; la quinta se rechaza. |
| Un archivo declara un MIME permitido pero contiene otro contenido | El bucket valida el MIME declarado y el render es `<img>`; el análisis por magic bytes queda fuera de alcance. |
| Doble clic en “Publicar” crea dos entradas | El botón se deshabilita durante el envío; `attachPostImages` es idempotente; si aun así se crean dos, el staff puede borrar una. |
| El manager cambia el aula de una entrada y cambia la audiencia | Es una acción explícita; el formulario muestra el aula actual y el cambio se refleja al revalidar. |
| Un tutor abre el feed y la entrada se borra mientras tanto | Las imágenes firmadas pueden fallar; el placeholder evita una imagen rota y el feed se corrige al recargar. |
| `?page` enorme o no numérico rompe la consulta | Se parsea con `Number.parseInt`, se ignora `NaN` y se limita al rango válido. |
| Fuga de memoria por `URL.createObjectURL` | Se revoca cada URL al quitar la imagen y al desmontar `ImageUploader`. |
| El alt vacío deja imágenes sin descripción | `altText` es opcional, pero el render usa el título y el índice de la imagen como fallback; el formulario sugiere describirla. |
| El conteo de consentimiento es costoso con muchas filas | Es un `count` sobre `children` con `not exists`; el volumen del centro es bajo y la consulta es `stable`. |
| El RPC de conteo falla por permisos y bloquea el formulario | `ConsentNotice` trata el error como aviso neutro y el envío sigue habilitado. |
| El listado del staff crece y la paginación se vuelve lenta | 20 por página e índice `(classroom_id, created_at desc)` / `created_at desc`; si crece, se migra a cursor. |

## What is **not** in this spec

- Notificaciones por email o push.
- Borradores, programación o moderación.
- Comentarios, reacciones, “me gusta” o guardados.
- Etiquetado por niño o selección de destinatarios.
- Reordenar, recortar, rotar, comprimir o filtrar imágenes.
- Editor de texto enriquecido o Markdown.
- Video, PDF, audio u otros archivos.
- Arrastrar y soltar o pegar imágenes.
- Bucket público, CDN, transformaciones o descarga en alta resolución.
- Janitor automático de objetos huérfanos.
- Buscador o filtros por categoría/aula en el feed.
- Multi-centro o publicaciones para staff.
- Tests automatizados.

Cada una de esas, si llega, va en su propio spec.

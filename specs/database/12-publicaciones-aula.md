# SPEC 12 — Publicaciones de Aula y Galería de Imágenes (Datos)

> **Estado:** implemented
> **Depende de:** SPEC 05, SPEC 06, SPEC 08, SPEC 10
> **Fecha:** 2026-11-09
> **Objetivo:** Crear en Supabase las tablas `posts` y `post_images`, el bucket privado `post-images`, sus policies RLS y el RPC de conteo de consentimiento que soportan las publicaciones del staff y su lectura por las familias.

## Por qué este spec existe

Hoy el portal de familias muestra una publicación de ejemplo en `data/mock.ts` y no existe una tabla donde el staff publique entradas ni un bucket para las fotos. Las familias solo pueden ver datos de su hijo; no hay un canal de comunicaciones del aula.

Este spec resuelve solo la capa de datos: tablas, constraints, bucket, RLS y RPC. El panel de publicación, la subida de imágenes y el feed real van en SPEC 13.

## Scope

**In:**

- Migración `supabase/migrations/<timestamp>_classroom_posts_and_images.sql`:
  - Enum `public.post_category` con `actividad`, `aviso`, `menu`, `foto`, `espacio`.
  - Tabla `public.posts` con `id`, `classroom_id`, `author_id`, `author_name`, `title`, `body`, `category`, `created_at`, `updated_at`.
  - Tabla `public.post_images` con `id`, `post_id`, `storage_path`, `alt_text`, `sort_order`, `created_at`.
  - Constraints de longitud, formato de `storage_path`, rango de `sort_order`, unicidad `(post_id, sort_order)` y unicidad de `storage_path`.
  - Índices de feed por `created_at`, por `(classroom_id, created_at)` y por `author_id`.
  - Trigger `posts_set_updated_at` reutilizando `public.set_updated_at()`.
  - Trigger `posts_set_author_name` que copia `profiles.full_name` a `posts.author_name` al insertar o cambiar `author_id`.
  - Bucket privado `post-images` en `storage.buckets` con `public = false`, `file_size_limit = 5242880` y `allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']`.
  - Policies RLS de `posts`: `SELECT`, `INSERT`, `UPDATE` y `DELETE` para `authenticated`.
  - Policies RLS de `post_images`: `SELECT`, `INSERT`, `UPDATE` y `DELETE` para `authenticated`.
  - Policies de `storage.objects` para el bucket `post-images`: `SELECT`, `INSERT` y `DELETE` para `authenticated`; sin `UPDATE` y sin `anon`.
  - RPC `public.count_children_without_photo_consent(p_classroom_id uuid default null)` (`security definer`, `stable`, `search_path = ''`) que devuelve solo un entero.
  - Grants explícitos: `authenticated` con DML sobre las dos tablas; `anon` sin privilegios de tabla; el RPC solo ejecutable por `authenticated`.
- Migración de hardening `supabase/migrations/<timestamp>_harden_count_children_without_photo_consent_grants.sql`:
  - `revoke all on function public.count_children_without_photo_consent(uuid) from anon`, porque Supabase concede `EXECUTE` a `anon` por privilegios por defecto y `revoke ... from public` no elimina ese grant explícito.
- Regenerar `types/database.ts` vía MCP después de aplicar la migración.
- Verificación estructural con `supabase_list_migrations`, `list_tables`, `pg_constraint`, `pg_indexes`, `pg_policies`, `pg_proc` y `information_schema`.

**Out of scope (para specs futuros):**

- Panel staff, formulario de publicación, subida directa de imágenes y feed de familias: SPEC 13.
- Notificaciones por email o push al publicar; `profiles.notify_on_post` queda para un spec futuro.
- Borradores, programación de publicación o estados de moderación.
- Comentarios, reacciones, “me gusta”, guardados o respuestas de las familias.
- Etiquetado por niño o selección de destinatarios dentro del aula.
- Reordenar, recortar, rotar o comprimir imágenes en servidor.
- Limpieza automática de objetos huérfanos sin fila en `post_images`.
- Análisis de contenido por magic bytes, antivirus o moderación automática.
- Transformaciones de imagen de Supabase, CDN público o bucket público.
- Multi-centro, publicaciones para staff o enlaces externos.
- Tests automatizados de base de datos.

## Data model

### Enum

```sql
create type public.post_category as enum (
  'actividad',
  'aviso',
  'menu',
  'foto',
  'espacio'
);
```

`menu` se guarda sin tilde para que el valor del enum sea estable; la UI muestra “Menú”.

### Tabla `posts`

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references public.classrooms (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default '',
  title text not null,
  body text not null,
  category public.post_category,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint posts_body_length check (char_length(btrim(body)) between 1 and 5000),
  constraint posts_author_name_length check (char_length(btrim(author_name)) between 1 and 120)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_classroom_created_at_idx on public.posts (classroom_id, created_at desc);
create index posts_author_id_idx on public.posts (author_id);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
```

`classroom_id = null` significa “Todas las aulas”. Solo un manager puede crear o dejar una entrada en ese estado; la regla vive en las policies, no en un constraint.

`author_id` queda nullable para conservar la entrada si se elimina el perfil del autor. `author_name` es una copia del nombre al momento de publicar o de cambiar el autor; evita que el feed dependa de la policy de `profiles`, que solo permite leer el propio perfil o a los managers.

### Trigger de `author_name`

```sql
create or replace function public.posts_set_author_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_id is null then
    if tg_op = 'INSERT' then
      raise exception 'El autor de la publicación es obligatorio.'
        using errcode = '23502';
    end if;

    return new;
  end if;

  select p.full_name
    into new.author_name
  from public.profiles p
  where p.id = new.author_id;

  if new.author_name is null then
    raise exception 'El autor de la publicación no es un perfil válido.'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create trigger posts_set_author_name
  before insert or update of author_id on public.posts
  for each row execute function public.posts_set_author_name();
```

El trigger corre con el rol del invocador. El autor siempre puede leer su propio perfil y un manager puede leer cualquier perfil, así que no necesita `security definer`. Si `author_id` no existe, el insert falla. Si `author_id` pasa a `null` por el `on delete set null` de la FK, el trigger conserva el `author_name` histórico y no bloquea el borrado del perfil; en un `INSERT` con `author_id` nulo, falla.

### Tabla `post_images`

```sql
create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint post_images_storage_path_format check (
    storage_path ~ (
      '^' || post_id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  ),
  constraint post_images_alt_text_length check (
    alt_text is null or char_length(alt_text) <= 160
  ),
  constraint post_images_sort_order_range check (sort_order between 0 and 3),
  constraint post_images_post_sort_order_unique unique (post_id, sort_order)
);
```

La ruta debe ser exactamente `{post_id}/{uuid}.{ext}`. El check impide registrar una fila que apunte a otro prefijo o a una extensión no permitida.

La combinación `sort_order between 0 and 3` más `unique (post_id, sort_order)` limita a cuatro imágenes por entrada sin necesidad de un trigger de conteo.

### Bucket `post-images`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
```

El bucket es privado. La app nunca usa `getPublicUrl`; genera URLs firmadas de lectura en el servidor.

### RLS de `posts`

```sql
alter table public.posts enable row level security;

create policy "posts_select_staff_or_tutor"
  on public.posts
  for select
  to authenticated
  using (
    (
      public.is_active_staff()
      and (
        classroom_id is null
        or public.is_active_manager()
        or public.is_assigned_educator(classroom_id)
      )
    )
    or (
      (
        classroom_id is null
        and exists (
          select 1
          from public.child_tutors ct
          where ct.tutor_id = (select auth.uid())
        )
      )
      or public.is_tutor_of_classroom(classroom_id)
    )
  );

create policy "posts_insert_staff"
  on public.posts
  for insert
  to authenticated
  with check (
    public.is_active_staff()
    and author_id = (select auth.uid())
    and (
      (classroom_id is null and public.is_active_manager())
      or (
        classroom_id is not null
        and (
          public.is_active_manager()
          or public.is_assigned_educator(classroom_id)
        )
      )
    )
  );

create policy "posts_update_author_or_manager"
  on public.posts
  for update
  to authenticated
  using (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and author_id = (select auth.uid())
      and classroom_id is not null
      and public.is_assigned_educator(classroom_id)
    )
  )
  with check (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and author_id = (select auth.uid())
      and classroom_id is not null
      and public.is_assigned_educator(classroom_id)
    )
  );

create policy "posts_delete_author_or_manager"
  on public.posts
  for delete
  to authenticated
  using (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and author_id = (select auth.uid())
      and classroom_id is not null
      and public.is_assigned_educator(classroom_id)
    )
  );
```

Reglas resultantes:

- Un `educator` solo ve, crea, edita y borra entradas de sus aulas asignadas. Nunca crea ni edita una entrada global.
- Un `admin` o `director` ve y gestiona cualquier entrada, incluidas las globales.
- Un `tutor` ve las entradas globales si tiene al menos un niño vinculado y las entradas de las aulas de sus niños. No ve entradas de otras aulas.
- El `WITH CHECK` de `UPDATE` impide que un autor de staff convierta su entrada en global o la mueva a un aula que no le corresponde.
- Las policies de `post_images` y de `storage.objects` repiten la condición de aula asignada para el autor de staff: aunque un manager haya movido su entrada a “Todas las aulas”, el educador no puede seguir gestionando sus imágenes.

### RLS de `post_images`

```sql
alter table public.post_images enable row level security;

create policy "post_images_select_visible_post"
  on public.post_images
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
    )
  );

create policy "post_images_insert_editor"
  on public.post_images
  for insert
  to authenticated
  with check (
    public.is_active_staff()
    and exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and (
          public.is_active_manager()
          or (
            p.author_id = (select auth.uid())
            and p.classroom_id is not null
            and public.is_assigned_educator(p.classroom_id)
          )
        )
    )
  );

create policy "post_images_update_editor"
  on public.post_images
  for update
  to authenticated
  using (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and exists (
        select 1
        from public.posts p
        where p.id = post_images.post_id
          and p.author_id = (select auth.uid())
          and p.classroom_id is not null
          and public.is_assigned_educator(p.classroom_id)
      )
    )
  )
  with check (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and exists (
        select 1
        from public.posts p
        where p.id = post_images.post_id
          and p.author_id = (select auth.uid())
          and p.classroom_id is not null
          and public.is_assigned_educator(p.classroom_id)
      )
    )
  );

create policy "post_images_delete_editor"
  on public.post_images
  for delete
  to authenticated
  using (
    public.is_active_manager()
    or (
      public.is_active_staff()
      and exists (
        select 1
        from public.posts p
        where p.id = post_images.post_id
          and p.author_id = (select auth.uid())
          and p.classroom_id is not null
          and public.is_assigned_educator(p.classroom_id)
      )
    )
  );
```

La subquery a `posts` hereda su policy `SELECT`; no se duplica la lógica de visibilidad. Un tutor puede leer las imágenes de una entrada que ya puede ver, pero no puede escribir.

### RLS de `storage.objects`

`storage.objects` ya tiene RLS habilitado en Supabase. No se desactiva ni se recrea. Se añaden tres policies para el bucket `post-images`:

```sql
create policy "post_images_objects_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1
      from public.posts p
      where p.id::text = (storage.foldername(name))[1]
    )
  );

create policy "post_images_objects_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and public.is_active_staff()
    and exists (
      select 1
      from public.posts p
      where p.id::text = (storage.foldername(name))[1]
        and (
          public.is_active_manager()
          or (
            p.author_id = (select auth.uid())
            and p.classroom_id is not null
            and public.is_assigned_educator(p.classroom_id)
          )
        )
    )
  );

create policy "post_images_objects_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_active_staff()
    and exists (
      select 1
      from public.posts p
      where p.id::text = (storage.foldername(name))[1]
        and (
          public.is_active_manager()
          or (
            p.author_id = (select auth.uid())
            and p.classroom_id is not null
            and public.is_assigned_educator(p.classroom_id)
          )
        )
    )
  );
```

- `SELECT` habilita `createSignedUrls` para el feed y el panel.
- `INSERT` habilita `createSignedUploadUrl` para el autor o un manager.
- `DELETE` habilita la limpieza de objetos antes de borrar la fila de la entrada o de la imagen.
- No hay `UPDATE`: cada archivo usa una ruta nueva con UUID y nunca se reemplaza.
- `storage.foldername(name)[1]` debe ser el `post_id`; un objeto en la raíz del bucket no coincide y queda denegado.

### RPC de consentimiento

```sql
create or replace function public.count_children_without_photo_consent(
  p_classroom_id uuid default null
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_active_staff() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  if p_classroom_id is null then
    if not public.is_active_manager() then
      raise exception 'Solo un manager puede consultar todas las aulas.'
        using errcode = '42501';
    end if;
  elsif not public.is_active_manager()
    and not public.is_assigned_educator(p_classroom_id) then
    raise exception 'No tenés acceso a esa aula.' using errcode = '42501';
  end if;

  select count(*)::integer
    into v_count
  from public.children c
  where (p_classroom_id is null or c.classroom_id = p_classroom_id)
    and not exists (
      select 1
      from public.child_tutors ct
      where ct.child_id = c.id
        and ct.photo_consent = true
    );

  return v_count;
end;
$$;
```

- Un niño cuenta si **ningún** tutor vinculado tiene `photo_consent = true`.
- Con `p_classroom_id = null` cuenta todo el centro y exige manager.
- Con un aula concreta exige manager o educador asignado a esa aula.
- Solo devuelve un entero; nunca nombres, IDs de niños ni filas de `child_tutors`.

### Grants

```sql
revoke all on table public.posts from anon, authenticated;
revoke all on table public.post_images from anon, authenticated;
grant select, insert, update, delete on table public.posts to authenticated;
grant select, insert, update, delete on table public.post_images to authenticated;

revoke all on function public.count_children_without_photo_consent(uuid) from public, anon;
grant execute on function public.count_children_without_photo_consent(uuid) to authenticated;
```

Se revocan todos los privilegios por defecto (`truncate`, `references`, `trigger`, etc.) de `anon` y `authenticated` antes de otorgar solo DML a `authenticated`, siguiendo el estándar de las migraciones de seguridad previas. En el RPC se revoca también `anon`: Supabase concede `EXECUTE` a `anon` por privilegios por defecto y `revoke ... from public` no elimina ese grant, así que la migración de hardening lo revoca explícitamente para dejar solo `authenticated` (y `service_role` como rol de backend). `posts_set_author_name` no se expone como RPC útil: es una función de trigger y una llamada directa falla porque no puede ejecutarse fuera de un trigger.

### Contratos TypeScript

```ts
export type PostCategory = Database["public"]["Enums"]["post_category"];

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export type PostImageRow = Database["public"]["Tables"]["post_images"]["Row"];

export type PostWithImages = PostRow & {
  classrooms: { name: string } | null;
  post_images: Array<
    Pick<PostImageRow, "id" | "storage_path" | "alt_text" | "sort_order">
  >;
};

export type CountChildrenWithoutPhotoConsentResult = number;
```

## Implementation plan

1. **Spec.** Escribir este documento y dejarlo en `Borrador` → `Aprobado`. Verificar: revisión del usuario.
2. **Rama.** Crear y cambiar a `spec-12-publicaciones-aula`. Verificar: `git branch --show-current`.
3. **Migración.** Crear `<timestamp>_classroom_posts_and_images.sql` con el enum, las dos tablas, los constraints, los índices, los dos triggers, el bucket, las policies de `public` y `storage`, el RPC y los grants. Crear además `<timestamp>_harden_count_children_without_photo_consent_grants.sql` con el `revoke ... from anon` del RPC. Verificar: revisión del SQL.
4. **Aplicar.** Aplicar con MCP `apply_migration` y comprobar `list_migrations` y `list_tables`. Verificar: `posts`, `post_images` y `post_category` existen.
5. **Verificar estructura.** Consultar `information_schema.columns`, `pg_constraint`, `pg_indexes` y `pg_trigger`. Verificar: columnas, checks, FKs, índices, unicidad `(post_id, sort_order)` y los dos triggers.
6. **Verificar bucket.** Consultar `storage.buckets` por `id = 'post-images'`. Verificar: `public = false`, `file_size_limit = 5242880`, `allowed_mime_types` con los tres tipos en ese orden.
7. **Verificar policies.** Consultar `pg_policies` para `public.posts`, `public.post_images` y `storage.objects`. Verificar: 4 + 4 + 3 policies nuevas, todas `to authenticated`; ninguna para `anon`; ninguna `UPDATE` en `storage.objects`.
8. **Verificar RPC.** Consultar `pg_proc` y `pg_get_functiondef('public.count_children_without_photo_consent(uuid)'::regprocedure)`. Verificar: firma, `security definer`, `stable`, `search_path = ''`, ramas de autorización y `not exists (... photo_consent = true)`; grants solo `authenticated`.
9. **Verificar trigger de autor.** Insertar en una transacción de prueba con un `author_id` válido y comprobar que `author_name` se llena desde `profiles.full_name`; con un UUID inexistente, el insert falla. Hacer rollback. Verificar: sin residuos.
10. **Tipos.** Regenerar `types/database.ts` vía MCP. Verificar: `post_category`, `posts`, `post_images` y `count_children_without_photo_consent`; `npx tsc --noEmit` limpio.
11. **Seguridad.** Pasar `supabase_get_advisors` (security y performance). Verificar: sin `ERROR`; documentar `WARN`/`INFO`.
12. **Cierre.** `npm run lint`, `npx tsc --noEmit`, `npm run build`; `git diff --name-only` solo migración, `types/database.ts` y este spec.

## Acceptance criteria

- [ ] La migración `<timestamp>_classroom_posts_and_images` aparece en `supabase_list_migrations`.
- [ ] El enum `public.post_category` existe con `actividad`, `aviso`, `menu`, `foto`, `espacio` en ese orden.
- [ ] `public.posts` existe con las 9 columnas del Data model y FKs a `classrooms` (`on delete cascade`) y `profiles` (`on delete set null`).
- [ ] `posts.title` y `posts.body` tienen los checks de longitud con `btrim`; `posts.author_name` tiene el check de 1 a 120 caracteres y `default ''`.
- [ ] Existen los índices `posts_created_at_idx`, `posts_classroom_created_at_idx` y `posts_author_id_idx`.
- [ ] El trigger `posts_set_author_name` se dispara en `insert or update of author_id` y copia `profiles.full_name`; un `author_id` inexistente hace fallar el insert y un `author_id` nulo en `INSERT` también falla.
- [ ] `on delete set null` sobre `posts.author_id` no falla: el trigger conserva `author_name` cuando `author_id` pasa a `null` en un `UPDATE`.
- [ ] El trigger `posts_set_updated_at` reutiliza `public.set_updated_at()`.
- [ ] `public.post_images` existe con las 6 columnas del Data model y FK a `posts` (`on delete cascade`).
- [ ] `post_images.storage_path` es `unique` y cumple el check de formato `{post_id}/{uuid}.{ext}` con extensión `jpg`, `png` o `webp`.
- [ ] `post_images.alt_text` admite `null` y tiene el check de máximo 160 caracteres.
- [ ] `post_images.sort_order` es `smallint`, tiene el check `between 0 and 3` y la unicidad `(post_id, sort_order)`.
- [ ] El bucket `post-images` existe con `public = false`, `file_size_limit = 5242880` y `allowed_mime_types = {image/jpeg,image/png,image/webp}`.
- [ ] `posts` y `post_images` tienen RLS habilitado y exactamente 4 policies nuevas cada una, todas `to authenticated`.
- [ ] `posts_select_staff_or_tutor` incluye la rama de staff limitada a aula asignada o manager y la rama de tutor con globales + `is_tutor_of_classroom(classroom_id)`.
- [ ] `posts_insert_staff` exige `is_active_staff()`, `author_id = auth.uid()` y que `classroom_id is null` solo sea válido con `is_active_manager()`.
- [ ] `posts_update_author_or_manager` y `posts_delete_author_or_manager` permiten al manager cualquier fila y al autor de staff solo entradas con `classroom_id is not null` y `is_assigned_educator(classroom_id)`.
- [ ] `post_images_select_visible_post` usa `exists (select 1 from public.posts p where p.id = post_images.post_id)` y hereda la RLS de `posts`.
- [ ] `post_images_insert_editor`, `post_images_update_editor` y `post_images_delete_editor` exigen staff y autor de la entrada o manager; el autor de staff solo aplica a entradas con `classroom_id is not null` y `is_assigned_educator(classroom_id)`; `UPDATE` tiene `USING` y `WITH CHECK`.
- [ ] `storage.objects` tiene exactamente 3 policies nuevas para `bucket_id = 'post-images'`: `SELECT`, `INSERT` y `DELETE`, todas `to authenticated`, sin `UPDATE` y sin `anon`.
- [ ] Las policies de Storage validan `(storage.foldername(name))[1]` contra `posts.id::text`; un objeto en la raíz del bucket no coincide. `INSERT`/`DELETE` aplican la misma condición de aula asignada al autor de staff que `post_images`.
- [ ] `public.count_children_without_photo_consent(uuid)` existe, es `security definer`, `stable`, tiene `search_path = ''` y devuelve `integer`.
- [ ] El RPC exige `is_active_staff()`, exige manager para `p_classroom_id is null` y exige manager o `is_assigned_educator(p_classroom_id)` para un aula concreta.
- [ ] El RPC cuenta con `not exists (select 1 from public.child_tutors ct where ct.child_id = c.id and ct.photo_consent = true)`.
- [ ] `anon` no tiene privilegios de tabla sobre `posts` ni `post_images`; `authenticated` tiene solo `select, insert, update, delete` en ambas (sin `truncate`, `references` ni `trigger`).
- [ ] El RPC tiene `execute` solo para `authenticated` (más `service_role` como backend); `public` y `anon` no pueden ejecutarlo.
- [ ] `types/database.ts` incluye `post_category`, `posts`, `post_images` y el RPC; `npx tsc --noEmit` pasa.
- [ ] `supabase_get_advisors` no reporta ningún `ERROR`; los `WARN`/`INFO` quedan documentados.
- [ ] `git diff --name-only` solo muestra la migración, `types/database.ts` y este spec; no hay cambios en `app/`, `data/` ni en otros specs.

## Verification results

- Migraciones aplicadas: `20261110115349_classroom_posts_and_images` y `20261110115532_harden_count_children_without_photo_consent_grants`.
- Estructura verificada en remoto: enum (orden correcto), 9 columnas en `posts` y 6 en `post_images`, checks, FKs (`cascade`/`set null`), índices, triggers, bucket privado, 4 + 4 + 3 policies `to authenticated` y RPC (`security definer`, `stable`, `search_path = ''`).
- Trigger `posts_set_author_name` probado con `DO` + `RAISE` (rollback implícito, sin residuos): copia `full_name`, falla con autor inexistente (`23503`), falla con autor nulo en `INSERT` (`23502`) y conserva `author_name` al pasar `author_id` a `null` en `UPDATE`.
- Grants: `anon` sin privilegios de tabla; `authenticated` solo DML. RPC con `EXECUTE` solo para `authenticated` y `service_role` (se revocó `anon` en la migración de hardening).
- `types/database.ts` regenerado; `npx tsc --noEmit` limpio; `npm run build` correcto.
- `npm run lint` falla solo por un error preexistente y ajeno a este spec en `app/components/PokemonViewer.tsx:68` (`react-hooks/set-state-in-effect`), ya presente en `main`.
- `supabase_get_advisors` (security): sin `ERROR`. `WARN` preexistentes: ejecución de `SECURITY DEFINER` por `anon` (`get_invitation_preview`, `rls_auto_enable`), por `authenticated` (helpers y RPCs, incluido el nuevo RPC por diseño) y Leaked Password Protection deshabilitado.
- `supabase_get_advisors` (performance): sin `ERROR`. `INFO`: índices nuevos aún sin uso (tablas vacías), FKs sin índice en `invitations` y múltiples policies permisivas en `children`/`child_health`/`child_allergies` (preexistentes).

## Decisions

- **Sí:** enum `public.post_category` en vez de `text` con check. Los valores son finitos y el tipo evita categorías inválidas desde PostgREST.
- **Sí:** `category` nullable. Una entrada puede ser solo texto; el mock muestra una categoría, pero no es obligatoria.
- **Sí:** `classroom_id` nullable para “Todas las aulas”, con la restricción de manager en `INSERT` y `UPDATE`. El permiso vive en RLS, no en un constraint que no puede leer el rol.
- **Sí:** `author_id` nullable con `on delete set null` y `author_name` desnormalizado. Conserva la entrada y su autor visible aunque se elimine el perfil; `profiles` solo es legible por el propio usuario o un manager, así que un join directo devolvería `null` a los tutores.
- **Sí:** trigger `posts_set_author_name`. Evita confiar en el cliente para el nombre del autor y mantiene `author_name` coherente con `author_id`.
- **Sí:** `author_name` con `default ''`. El trigger `BEFORE INSERT` siempre impone `profiles.full_name` y el check de longitud sigue rechazando cadenas vacías, pero el default hace que `types/database.ts` genere `author_name?: string` en `Insert` y evita que el cliente lo envíe.
- **Sí:** `revoke all` a `anon` y `authenticated` antes de otorgar solo DML a `authenticated`. Sigue el estándar de las migraciones de seguridad previas y quita `truncate`, `references` y `trigger` heredados de los privilegios por defecto.
- **Sí:** `unique (post_id, sort_order)` con `sort_order between 0 and 3`. Limita a cuatro imágenes por entrada sin un trigger de conteo y sin carreras.
- **Sí:** check de formato de `storage_path` en la base de datos. La app también valida el prefijo, pero el check impide filas inconsistentes incluso con escrituras directas.
- **Sí:** bucket privado y URLs firmadas. Las fotos de niños no deben quedar en un bucket público ni en una URL permanente.
- **Sí:** policies de Storage apoyadas en la RLS de `posts`. `post_images` y los objetos heredan la misma regla de visibilidad; no se duplican las condiciones de rol y aula.
- **Sí:** sin policy `UPDATE` en `storage.objects`. Cada subida usa una ruta nueva con UUID; reemplazar objetos complicaría la caché y la auditoría.
- **Sí:** `count_children_without_photo_consent` como `security definer` con checks explícitos. Devuelve un entero y evita exponer filas de `child_tutors` o nombres de niños; la policy de staff de `child_tutors` es más amplia que “solo esta aula”.
- **Sí:** conteo global solo para manager. Un educador no debe poder inferir datos de aulas que no gestiona.
- **Sí:** RPC `stable`. Solo lee; no escribe ni necesita transacción.
- **No:** `status` o `published_at` en `posts`. La publicación es inmediata; no hay borradores ni programación en este alcance.
- **No:** etiquetas por niño. El aviso de consentimiento es informativo; no se registra qué niño aparece en cada foto.
- **No:** trigger que cuente imágenes. La unicidad de `sort_order` ya acota a cuatro.
- **No:** limpieza automática de objetos huérfanos. Se documenta como riesgo y se resuelve en la app al editar o borrar; un janitor va en un spec futuro si hace falta.
- **No:** bucket público, transformaciones de imagen o CDN. Las URLs firmadas son suficientes para el MVP.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un objeto subido queda huérfano si el navegador no llama `attachPostImages` | La entrada se publica igual; el usuario puede reintentar desde edición. Un janitor de objetos sin fila queda fuera de alcance y documentado. |
| Las policies de Storage dependen de la RLS de `posts` | La subquery usa `exists` contra `posts`; si cambia la policy de `posts`, el acceso a imágenes cambia con ella. Se prueba con tutor, educador y manager. |
| Un cliente miente sobre el MIME type del archivo | El bucket restringe `allowed_mime_types` y el render es `<img>`; el análisis por magic bytes queda fuera de alcance. |
| `author_name` queda desactualizado si el perfil cambia de nombre | Es una copia histórica deliberada; el feed muestra el nombre con el que se publicó. |
| Borrar un aula elimina sus publicaciones | `on delete cascade` es intencional: una entrada de aula sin aula no tiene sentido. La app no borra aulas en este alcance. |
| Un manager mueve una entrada a otra aula y cambia la audiencia | Es una acción permitida y explícita; el panel de SPEC 13 la muestra como cambio de aula. |
| `security definer` en el RPC podría saltarse RLS de más | `search_path = ''`, checks explícitos de staff/manager/educador asignado y solo devuelve un entero. |
| Un objeto en la raíz del bucket o con otro prefijo se cuela | `storage.foldername(name)[1]` debe coincidir con un `posts.id`; si no, la policy deniega. |
| El check de ruta con `post_id::text` depende de UUIDs en minúsculas | `gen_random_uuid()` y `crypto.randomUUID()` producen minúsculas; las rutas las genera el servidor. |
| Cambios futuros en `storage.objects` amplían el acceso | Las policies son aditivas en Postgres; cualquier policy nueva debe revisarse. Este spec deja constancia de las tres que crea. |

## What is **not** in this spec

- Panel staff, formulario de publicación, subida de imágenes y feed de familias (SPEC 13).
- Notificaciones por email o push.
- Borradores, programación o moderación.
- Comentarios, reacciones, “me gusta” o guardados.
- Etiquetado por niño o selección de destinatarios.
- Reordenar, recortar, rotar o comprimir imágenes.
- Limpieza automática de objetos huérfanos.
- Análisis por magic bytes, antivirus o moderación automática.
- Transformaciones de imagen, CDN público o bucket público.
- Multi-centro, publicaciones de staff o enlaces externos.
- Tests automatizados de base de datos.

Cada una de esas, si llega, va en su propio spec.

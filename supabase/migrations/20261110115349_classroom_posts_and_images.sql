-- SPEC 12 - Publicaciones de aula y galeria de imagenes (datos)
-- Crea el enum post_category, las tablas posts y post_images, el bucket privado
-- post-images, sus policies RLS (public y storage.objects) y el RPC de conteo de
-- consentimiento de fotos. Solo capa de datos: el panel y el feed van en SPEC 13.

-- ============================================================================
-- Enum de categoria
-- ============================================================================

create type public.post_category as enum (
  'actividad',
  'aviso',
  'menu',
  'foto',
  'espacio'
);

-- ============================================================================
-- posts
-- ============================================================================

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

-- Copia profiles.full_name a posts.author_name al insertar o cambiar de autor.
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

-- ============================================================================
-- post_images
-- ============================================================================

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

-- ============================================================================
-- Bucket privado post-images
-- ============================================================================

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

-- ============================================================================
-- RLS de posts
-- ============================================================================

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

-- ============================================================================
-- RLS de post_images
-- ============================================================================

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

-- ============================================================================
-- RLS de storage.objects para el bucket post-images
-- storage.objects ya tiene RLS habilitado; solo se agregan policies.
-- ============================================================================

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

-- ============================================================================
-- RPC de conteo de consentimiento de fotos
-- ============================================================================

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

-- ============================================================================
-- Grants
-- ============================================================================

revoke all on table public.posts from anon, authenticated;
revoke all on table public.post_images from anon, authenticated;
grant select, insert, update, delete on table public.posts to authenticated;
grant select, insert, update, delete on table public.post_images to authenticated;

revoke all on function public.count_children_without_photo_consent(uuid) from public;
grant execute on function public.count_children_without_photo_consent(uuid) to authenticated;

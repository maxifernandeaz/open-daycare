-- SPEC 10 — Invitaciones de tutores y vínculo con el niño
-- Crea el enum invitation_status, la tabla invitations (con constraints e
-- índices), el consentimiento de fotos en child_tutors, las policies RLS de
-- staff y lectura del tutor, y las cuatro RPC del flujo de invitación.

-- ============================================================================
-- Enum de estado de invitación
-- ============================================================================

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

-- ============================================================================
-- Tabla invitations
-- ============================================================================

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  email text not null,
  code text not null unique,
  relationship text,
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_email_normalized check (email = lower(btrim(email))),
  constraint invitations_email_shape check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint invitations_code_shape check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$')
);

create unique index invitations_pending_child_email_idx
  on public.invitations (child_id, lower(email))
  where status = 'pending';

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (lower(email));

-- ============================================================================
-- Consentimiento de fotos en child_tutors
-- ============================================================================

alter table public.child_tutors
  add column photo_consent boolean not null default false,
  add column photo_consent_at timestamptz;

-- ============================================================================
-- RLS y trigger de updated_at
-- ============================================================================

alter table public.invitations enable row level security;
alter table public.child_tutors enable row level security;

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Policies RLS de invitations (solo staff activo)
-- ============================================================================

create policy "invitations_select_staff"
  on public.invitations
  for select
  to authenticated
  using (public.is_active_staff());

create policy "invitations_insert_staff"
  on public.invitations
  for insert
  to authenticated
  with check (
    public.is_active_staff()
    and invited_by = (select auth.uid())
  );

create policy "invitations_update_staff"
  on public.invitations
  for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- ============================================================================
-- Policies RLS de child_tutors (el propio tutor o staff activo)
-- ============================================================================

create policy "child_tutors_select_own_or_staff"
  on public.child_tutors
  for select
  to authenticated
  using (
    tutor_id = (select auth.uid())
    or public.is_active_staff()
  );

-- ============================================================================
-- Lectura del tutor de sus niños vinculados
-- ============================================================================

create policy "children_select_linked_tutor"
  on public.children
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = children.id
      and ct.tutor_id = (select auth.uid())
  ));

create policy "child_health_select_linked_tutor"
  on public.child_health
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = child_health.child_id
      and ct.tutor_id = (select auth.uid())
  ));

create policy "child_allergies_select_linked_tutor"
  on public.child_allergies
  for select
  to authenticated
  using (exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = child_allergies.child_id
      and ct.tutor_id = (select auth.uid())
  ));

-- ============================================================================
-- Privilegios de tabla
-- ============================================================================

revoke all on table public.invitations from anon;
revoke delete on table public.invitations from authenticated;
grant select, insert, update on table public.invitations to authenticated;

revoke all on table public.child_tutors from anon;
revoke insert, update, delete on table public.child_tutors from authenticated;
grant select on table public.child_tutors to authenticated;

-- ============================================================================
-- RPC: crear o reenviar una invitación
-- ============================================================================

create or replace function public.create_tutor_invitation(
  p_child_id uuid,
  p_email text,
  p_relationship text default null
) returns table (invitation_id uuid, code text, expires_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_email text;
  v_relationship text;
  v_code text;
  v_attempt int := 0;
  v_char int;
  v_existing_id uuid;
  v_invitation_id uuid;
  v_expires_at timestamptz;
begin
  if not public.is_active_staff() then
    raise exception 'No autorizado';
  end if;

  if p_child_id is null or not exists (
    select 1 from public.children c where c.id = p_child_id
  ) then
    raise exception 'El niño no existe';
  end if;

  v_email := pg_catalog.lower(btrim(p_email));

  if v_email is null
    or v_email = ''
    or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'Email inválido';
  end if;

  v_relationship := nullif(pg_catalog.btrim(p_relationship), '');

  select i.id
    into v_existing_id
  from public.invitations i
  where i.child_id = p_child_id
    and pg_catalog.lower(i.email) = v_email
    and i.status = 'pending'
  for update;

  if v_existing_id is not null then
    update public.invitations i
    set relationship = case
          when v_relationship is not null then v_relationship
          else i.relationship
        end,
        expires_at = pg_catalog.now() + interval '7 days'
    where i.id = v_existing_id
    returning i.id, i.code, i.expires_at
    into v_invitation_id, v_code, v_expires_at;

    return query select v_invitation_id, v_code, v_expires_at;
    return;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := '';

    for v_char in 1..5 loop
      v_code := v_code || pg_catalog.substr(
        v_alphabet,
        1 + pg_catalog.floor(pg_catalog.random() * pg_catalog.length(v_alphabet))::int,
        1
      );
    end loop;

    begin
      insert into public.invitations (
        child_id,
        email,
        code,
        relationship,
        invited_by,
        expires_at
      ) values (
        p_child_id,
        v_email,
        v_code,
        v_relationship,
        (select auth.uid()),
        pg_catalog.now() + interval '7 days'
      )
      returning id, code, expires_at
      into v_invitation_id, v_code, v_expires_at;

      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  return query select v_invitation_id, v_code, v_expires_at;
end;
$$;

-- ============================================================================
-- RPC: revocar una invitación pendiente
-- ============================================================================

create or replace function public.revoke_tutor_invitation(p_invitation_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.invitations i
  set status = 'revoked'
  where i.id = p_invitation_id
    and i.status = 'pending';

  if not found then
    raise exception 'La invitación no existe o ya no está pendiente';
  end if;
end;
$$;

-- ============================================================================
-- RPC: aceptar una invitación y vincular al tutor
-- ============================================================================

create or replace function public.accept_tutor_invitation(
  p_code text,
  p_photo_consent boolean default false
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_code text;
  v_invitation public.invitations%rowtype;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Debes iniciar sesión para aceptar la invitación';
  end if;

  v_code := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));

  select i.*
    into v_invitation
  from public.invitations i
  where i.code = v_code
  for update;

  if not found then
    raise exception 'Invitación inválida.';
  end if;

  if v_invitation.status = 'accepted' then
    if v_invitation.accepted_by = v_user_id then
      return v_invitation.child_id;
    end if;

    raise exception 'Esta invitación ya fue utilizada.';
  end if;

  if v_invitation.status = 'revoked' then
    raise exception 'Esta invitación fue revocada.';
  end if;

  if v_invitation.expires_at < pg_catalog.now() then
    raise exception 'Esta invitación venció. Pedile a la guardería que la reenvíe.';
  end if;

  if (auth.jwt() ->> 'email') is null
    or pg_catalog.lower(v_invitation.email) <> pg_catalog.lower(auth.jwt() ->> 'email')
  then
    raise exception 'El email de la sesión no coincide con la invitación.';
  end if;

  insert into public.child_tutors (
    child_id,
    tutor_id,
    relationship,
    is_legal_guardian,
    is_primary,
    photo_consent,
    photo_consent_at
  ) values (
    v_invitation.child_id,
    v_user_id,
    v_invitation.relationship,
    true,
    false,
    coalesce(p_photo_consent, false),
    pg_catalog.now()
  )
  on conflict (child_id, tutor_id) do update
  set relationship = excluded.relationship,
      photo_consent = excluded.photo_consent,
      photo_consent_at = excluded.photo_consent_at;

  update public.invitations i
  set status = 'accepted',
      accepted_at = pg_catalog.now(),
      accepted_by = v_user_id
  where i.id = v_invitation.id;

  return v_invitation.child_id;
end;
$$;

-- ============================================================================
-- RPC: preview público de una invitación
-- ============================================================================

create or replace function public.get_invitation_preview(p_code text)
returns table (
  email text,
  child_display_name text,
  classroom_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.email,
    coalesce(c.nickname, pg_catalog.split_part(c.full_name, ' ', 1)) as child_display_name,
    cl.name as classroom_name,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.classrooms cl on cl.id = c.classroom_id
  where i.code = pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')))
    and i.status = 'pending'
    and i.expires_at > pg_catalog.now();
$$;

-- ============================================================================
-- Grants de las RPC
-- ============================================================================

revoke all on function public.create_tutor_invitation(uuid, text, text) from public, anon;
grant execute on function public.create_tutor_invitation(uuid, text, text) to authenticated;

revoke all on function public.revoke_tutor_invitation(uuid) from public, anon;
grant execute on function public.revoke_tutor_invitation(uuid) to authenticated;

revoke all on function public.accept_tutor_invitation(text, boolean) from public, anon;
grant execute on function public.accept_tutor_invitation(text, boolean) to authenticated;

revoke all on function public.get_invitation_preview(text) from public;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;

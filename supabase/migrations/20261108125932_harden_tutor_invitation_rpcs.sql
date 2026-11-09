-- SPEC 12 - Endurecimiento de RPC de invitaciones de tutores
-- 1) create_tutor_invitation: acota la autorizacion al aula del nino mediante
--    can_staff_access_child(). Cierra el vector de invitar a cualquier nino.
-- 2) accept_tutor_invitation: activa atomicamente el profile pending antes de
--    insertar el vinculo en child_tutors. Evita el bypass del gate de status.
-- 3) get_invitation_preview: NO se modifica. app/activar-cuenta (mock actual y
--    SPEC 11) necesita el email completo para precargar el formulario de
--    activacion; enmascararlo romperia el flujo de registro.
--
-- No modifica codigo de la app.

-- ============================================================================
-- RPC: crear o reenviar una invitacion (scoped por aula)
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
  if not public.can_staff_access_child(p_child_id) then
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

revoke all on function public.create_tutor_invitation(uuid, text, text) from public, anon;
grant execute on function public.create_tutor_invitation(uuid, text, text) to authenticated;

-- ============================================================================
-- RPC: aceptar una invitacion y vincular al tutor
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

  update public.profiles p
  set status = 'active'
  where p.id = v_user_id
    and p.status = 'pending';

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

revoke all on function public.accept_tutor_invitation(text, boolean) from public, anon;
grant execute on function public.accept_tutor_invitation(text, boolean) to authenticated;

-- Fix: create_tutor_invitation fallaba con
--   column reference "code" is ambiguous
-- porque el RETURNING del INSERT usaba columnas sin calificar y colisionaban
-- con el OUT parameter "code" de RETURNS TABLE. Se califica con el alias "i".

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
      insert into public.invitations as i (
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
      returning i.id, i.code, i.expires_at
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

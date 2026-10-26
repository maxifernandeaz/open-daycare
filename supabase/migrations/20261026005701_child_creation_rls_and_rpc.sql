-- SPEC 08 — Agregar Niño: RLS y RPC atómica
-- Crea el helper is_active_staff(), las 14 policies de las 5 tablas del alta
-- (classrooms, allergies, children, child_health, child_allergies) y la RPC
-- create_child() que inserta las tres filas en una sola transacción.
-- Reutiliza is_active_manager() de SPEC 06 para UPDATE/DELETE.

-- ============================================================================
-- Helper: staff activo (admin, director o educator)
-- ============================================================================

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'director', 'educator')
      and p.status = 'active'
  );
$$;

revoke all on function public.is_active_staff() from public, anon;
grant execute on function public.is_active_staff() to authenticated;

-- ============================================================================
-- Policies RLS
-- ============================================================================

create policy "classrooms_select_authenticated"
  on public.classrooms
  for select
  to authenticated
  using (true);

create policy "allergies_select_authenticated"
  on public.allergies
  for select
  to authenticated
  using (true);

create policy "children_select_staff"
  on public.children
  for select
  to authenticated
  using (public.is_active_staff());

create policy "children_insert_staff"
  on public.children
  for insert
  to authenticated
  with check (public.is_active_staff());

create policy "children_update_managers"
  on public.children
  for update
  to authenticated
  using (public.is_active_manager())
  with check (public.is_active_manager());

create policy "children_delete_managers"
  on public.children
  for delete
  to authenticated
  using (public.is_active_manager());

create policy "child_health_select_staff"
  on public.child_health
  for select
  to authenticated
  using (public.is_active_staff());

create policy "child_health_insert_staff"
  on public.child_health
  for insert
  to authenticated
  with check (public.is_active_staff());

create policy "child_health_update_managers"
  on public.child_health
  for update
  to authenticated
  using (public.is_active_manager())
  with check (public.is_active_manager());

create policy "child_health_delete_managers"
  on public.child_health
  for delete
  to authenticated
  using (public.is_active_manager());

create policy "child_allergies_select_staff"
  on public.child_allergies
  for select
  to authenticated
  using (public.is_active_staff());

create policy "child_allergies_insert_staff"
  on public.child_allergies
  for insert
  to authenticated
  with check (public.is_active_staff());

create policy "child_allergies_update_managers"
  on public.child_allergies
  for update
  to authenticated
  using (public.is_active_manager())
  with check (public.is_active_manager());

create policy "child_allergies_delete_managers"
  on public.child_allergies
  for delete
  to authenticated
  using (public.is_active_manager());

-- ============================================================================
-- Privilegios de tabla: anon sin acceso; authenticated limitado por RLS
-- ============================================================================

revoke all on table public.classrooms from anon;
revoke all on table public.allergies from anon;
revoke all on table public.children from anon;
revoke all on table public.child_health from anon;
revoke all on table public.child_allergies from anon;

grant select on table public.classrooms, public.allergies to authenticated;
grant select, insert, update, delete
  on table public.children, public.child_health, public.child_allergies
  to authenticated;

-- ============================================================================
-- RPC atómica create_child()
-- ============================================================================

create or replace function public.create_child(
  p_full_name text,
  p_nickname text,
  p_birth_date date,
  p_gender public.gender,
  p_document text,
  p_classroom_id uuid,
  p_primary_educator_id uuid,
  p_schedule public.schedule,
  p_pediatrician_name text,
  p_pediatrician_phone text,
  p_nap_notes text,
  p_medication_consent boolean,
  p_urgent_medical_flag boolean,
  p_allergy_codes text[],
  p_allergy_notes text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_child_id uuid;
  v_allergy_codes text[];
  v_notes text;
begin
  if p_full_name is null or btrim(p_full_name) = '' then
    raise exception 'El nombre es obligatorio';
  end if;

  if p_birth_date is null then
    raise exception 'La fecha de nacimiento es obligatoria';
  end if;

  if p_birth_date > current_date then
    raise exception 'La fecha de nacimiento no puede ser futura';
  end if;

  if p_classroom_id is null
    or not exists (
      select 1 from public.classrooms c where c.id = p_classroom_id
    )
  then
    raise exception 'El aula no existe';
  end if;

  v_allergy_codes := (
    select array_agg(distinct code)
    from unnest(coalesce(p_allergy_codes, array[]::text[])) as code
  );

  if v_allergy_codes is null or cardinality(v_allergy_codes) = 0 then
    raise exception 'Debes seleccionar al menos una alergia';
  end if;

  if 'none' = any(v_allergy_codes) and cardinality(v_allergy_codes) > 1 then
    raise exception 'La opción "Sin alergias" no puede combinarse con otras';
  end if;

  if exists (
    select 1
    from unnest(v_allergy_codes) as code
    where not exists (
      select 1 from public.allergies a where a.code = code
    )
  ) then
    raise exception 'Código de alergia desconocido';
  end if;

  insert into public.children (
    full_name,
    nickname,
    birth_date,
    gender,
    document,
    classroom_id,
    primary_educator_id,
    schedule
  ) values (
    btrim(p_full_name),
    nullif(btrim(p_nickname), ''),
    p_birth_date,
    p_gender,
    nullif(btrim(p_document), ''),
    p_classroom_id,
    p_primary_educator_id,
    p_schedule
  )
  returning id into v_child_id;

  insert into public.child_health (
    child_id,
    pediatrician_name,
    pediatrician_phone,
    nap_notes,
    medication_consent,
    urgent_medical_flag
  ) values (
    v_child_id,
    nullif(btrim(p_pediatrician_name), ''),
    nullif(btrim(p_pediatrician_phone), ''),
    nullif(btrim(p_nap_notes), ''),
    coalesce(p_medication_consent, false),
    coalesce(p_urgent_medical_flag, false)
  );

  v_notes := nullif(btrim(p_allergy_notes), '');

  insert into public.child_allergies (child_id, allergy_id, notes)
  select
    v_child_id,
    a.id,
    case when a.is_none then null else v_notes end
  from public.allergies a
  where a.code = any(v_allergy_codes);

  return v_child_id;
end;
$$;

revoke all on function public.create_child(
  text, text, date, public.gender, text, uuid, uuid, public.schedule,
  text, text, text, boolean, boolean, text[], text
) from public, anon;

grant execute on function public.create_child(
  text, text, date, public.gender, text, uuid, uuid, public.schedule,
  text, text, text, boolean, boolean, text[], text
) to authenticated;

-- SPEC 12 - RLS acotado por aula para ninos, asistencia, recogidas y staff
-- Cierra la fuga horizontal de datos de menores: los helpers de staff dejan de
-- usar is_active_staff() global y pasan a validar la asignacion real a cada
-- aula (classroom_educators). Incluye policies para las tres tablas que estaban
-- en deny-all: classroom_educators, authorized_pickup_persons y
-- attendance_records.
--
-- No modifica funciones RPC ni codigo de la app.

-- ============================================================================
-- Helpers SECURITY DEFINER (evitan recursion de RLS; search_path vacio)
-- ============================================================================

create or replace function public.is_assigned_educator(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classroom_educators ce
    join public.profiles p on p.id = ce.educator_id
    where ce.classroom_id = p_classroom_id
      and ce.educator_id = (select auth.uid())
      and p.role = 'educator'
      and p.status = 'active'
  );
$$;

create or replace function public.is_linked_tutor(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.child_tutors ct
    where ct.child_id = p_child_id
      and ct.tutor_id = (select auth.uid())
  );
$$;

-- Manager ve todo; educator solo ninos de sus aulas asignadas.
create or replace function public.can_staff_access_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_manager()
      or exists (
        select 1
        from public.children c
        join public.classroom_educators ce on ce.classroom_id = c.classroom_id
        join public.profiles p on p.id = ce.educator_id
        where c.id = p_child_id
          and ce.educator_id = (select auth.uid())
          and p.role = 'educator'
          and p.status = 'active'
      );
$$;

create or replace function public.is_tutor_of_classroom(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.child_tutors ct on ct.child_id = c.id
    where c.classroom_id = p_classroom_id
      and ct.tutor_id = (select auth.uid())
  );
$$;

revoke all on function public.is_assigned_educator(uuid) from public, anon;
revoke all on function public.is_linked_tutor(uuid) from public, anon;
revoke all on function public.can_staff_access_child(uuid) from public, anon;
revoke all on function public.is_tutor_of_classroom(uuid) from public, anon;
grant execute on function public.is_assigned_educator(uuid) to authenticated;
grant execute on function public.is_linked_tutor(uuid) to authenticated;
grant execute on function public.can_staff_access_child(uuid) to authenticated;
grant execute on function public.is_tutor_of_classroom(uuid) to authenticated;

-- ============================================================================
-- children / child_health / child_allergies: manager + educadora asignada
-- (el tutor sigue cubierto por las policies *_select_linked_tutor existentes)
-- ============================================================================

drop policy if exists "children_select_staff" on public.children;
drop policy if exists "children_insert_staff" on public.children;

create policy "children_select_managers_or_assigned_educators"
  on public.children for select to authenticated
  using (public.can_staff_access_child(id));

create policy "children_insert_managers_or_assigned_educators"
  on public.children for insert to authenticated
  with check (
    public.is_active_manager()
    or public.is_assigned_educator(classroom_id)
  );

drop policy if exists "child_health_select_staff" on public.child_health;
drop policy if exists "child_health_insert_staff" on public.child_health;

create policy "child_health_select_managers_or_assigned_educators"
  on public.child_health for select to authenticated
  using (public.can_staff_access_child(child_id));

create policy "child_health_insert_managers_or_assigned_educators"
  on public.child_health for insert to authenticated
  with check (public.can_staff_access_child(child_id));

drop policy if exists "child_allergies_select_staff" on public.child_allergies;
drop policy if exists "child_allergies_insert_staff" on public.child_allergies;

create policy "child_allergies_select_managers_or_assigned_educators"
  on public.child_allergies for select to authenticated
  using (public.can_staff_access_child(child_id));

create policy "child_allergies_insert_managers_or_assigned_educators"
  on public.child_allergies for insert to authenticated
  with check (public.can_staff_access_child(child_id));

-- ============================================================================
-- child_tutors: el propio tutor o staff acotado a su aula
-- ============================================================================

drop policy if exists "child_tutors_select_own_or_staff" on public.child_tutors;

create policy "child_tutors_select_own_or_scoped_staff"
  on public.child_tutors for select to authenticated
  using (
    tutor_id = (select auth.uid())
    or public.can_staff_access_child(child_id)
  );

-- ============================================================================
-- invitations: manager o educadora del aula del nino
-- ============================================================================

drop policy if exists "invitations_select_staff" on public.invitations;
drop policy if exists "invitations_insert_staff" on public.invitations;
drop policy if exists "invitations_update_staff" on public.invitations;

create policy "invitations_select_scoped"
  on public.invitations for select to authenticated
  using (public.can_staff_access_child(child_id));

create policy "invitations_insert_scoped"
  on public.invitations for insert to authenticated
  with check (
    public.can_staff_access_child(child_id)
    and invited_by = (select auth.uid())
  );

create policy "invitations_update_scoped"
  on public.invitations for update to authenticated
  using (public.can_staff_access_child(child_id))
  with check (public.can_staff_access_child(child_id));

-- ============================================================================
-- classroom_educators: manager todo; educadora su aula; tutor el aula de su hijo
-- ============================================================================

create policy "classroom_educators_select_scoped"
  on public.classroom_educators for select to authenticated
  using (
    public.is_active_manager()
    or educator_id = (select auth.uid())
    or public.is_assigned_educator(classroom_id)
    or public.is_tutor_of_classroom(classroom_id)
  );

create policy "classroom_educators_insert_managers"
  on public.classroom_educators for insert to authenticated
  with check (public.is_active_manager());

create policy "classroom_educators_update_managers"
  on public.classroom_educators for update to authenticated
  using (public.is_active_manager())
  with check (public.is_active_manager());

create policy "classroom_educators_delete_managers"
  on public.classroom_educators for delete to authenticated
  using (public.is_active_manager());

-- ============================================================================
-- authorized_pickup_persons:
--   ver: manager + educadora asignada + tutor del nino
--   crear/editar/borrar: solo el tutor del nino o un manager
-- ============================================================================

create policy "authorized_pickup_persons_select_scoped"
  on public.authorized_pickup_persons for select to authenticated
  using (
    public.can_staff_access_child(child_id)
    or public.is_linked_tutor(child_id)
  );

create policy "authorized_pickup_persons_insert_tutor_or_manager"
  on public.authorized_pickup_persons for insert to authenticated
  with check (
    public.is_active_manager()
    or public.is_linked_tutor(child_id)
  );

create policy "authorized_pickup_persons_update_tutor_or_manager"
  on public.authorized_pickup_persons for update to authenticated
  using (public.is_active_manager() or public.is_linked_tutor(child_id))
  with check (public.is_active_manager() or public.is_linked_tutor(child_id));

create policy "authorized_pickup_persons_delete_tutor_or_manager"
  on public.authorized_pickup_persons for delete to authenticated
  using (public.is_active_manager() or public.is_linked_tutor(child_id));

-- ============================================================================
-- attendance_records:
--   ver: manager + educadora asignada + tutor del nino
--   crear/editar: manager o educadora asignada (recorded_by no falsificable)
--   borrar: manager
-- ============================================================================

create policy "attendance_records_select_scoped"
  on public.attendance_records for select to authenticated
  using (
    public.can_staff_access_child(child_id)
    or public.is_linked_tutor(child_id)
  );

create policy "attendance_records_insert_managers_or_assigned_educators"
  on public.attendance_records for insert to authenticated
  with check (
    public.can_staff_access_child(child_id)
    and (recorded_by is null or recorded_by = (select auth.uid()))
  );

create policy "attendance_records_update_managers_or_assigned_educators"
  on public.attendance_records for update to authenticated
  using (public.can_staff_access_child(child_id))
  with check (public.can_staff_access_child(child_id));

create policy "attendance_records_delete_managers"
  on public.attendance_records for delete to authenticated
  using (public.is_active_manager());

-- ============================================================================
-- Privilegios: anon fuera; sin TRUNCATE/REFERENCES/TRIGGER para authenticated
-- ============================================================================

revoke all on table public.attendance_records from anon;
revoke all on table public.authorized_pickup_persons from anon;
revoke all on table public.classroom_educators from anon;

revoke truncate, references, trigger on table
  public.attendance_records,
  public.authorized_pickup_persons,
  public.classroom_educators,
  public.child_tutors,
  public.children,
  public.child_health,
  public.child_allergies,
  public.classrooms,
  public.allergies,
  public.invitations
from authenticated;

grant select, insert, update, delete on table public.attendance_records to authenticated;
grant select, insert, update, delete on table public.authorized_pickup_persons to authenticated;
grant select, insert, update, delete on table public.classroom_educators to authenticated;

-- SPEC 05 — Esquema inicial de base de datos (Supabase)
-- Crea los 3 enums, las 10 tablas, claves foráneas, índices (incluido el índice
-- parcial único child_tutors_one_primary_idx) y los triggers:
--   handle_new_user  → alta automática de profiles
--   set_updated_at   → mantiene updated_at en cada update (uno por tabla)
-- Habilita RLS (deny-all) en las 10 tablas SIN policies: las policies son el
-- gate explícito previo a integrar la app y van en el spec de seguridad.

-- ============================================================================
-- Enums (valores en inglés; el mapeo a etiquetas de la UI vive en la app)
-- ============================================================================

create type public.user_role as enum ('admin', 'director', 'educator', 'tutor');
create type public.gender as enum ('boy', 'girl', 'other');
create type public.schedule as enum ('full_day', 'mornings_with_lunch', 'mornings_only', 'afternoon');

-- ============================================================================
-- Tablas
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tutor',
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  age_range text not null,
  age_min_months int not null,
  age_max_months int not null,
  tagline text,
  description text,
  capacity int,
  recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classroom_educators (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  educator_id uuid not null references public.profiles (id) on delete cascade,
  is_lead boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, educator_id)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nickname text,
  birth_date date not null,
  gender public.gender,
  document text,
  classroom_id uuid not null references public.classrooms (id),
  primary_educator_id uuid references public.profiles (id),
  schedule public.schedule,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_health (
  child_id uuid primary key references public.children (id) on delete cascade,
  pediatrician_name text,
  pediatrician_phone text,
  nap_notes text,
  special_care_notes text,
  medication_consent boolean not null default false,
  urgent_medical_flag boolean not null default false,
  vaccination_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.allergies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_none boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_allergies (
  child_id uuid not null references public.children (id) on delete cascade,
  allergy_id uuid not null references public.allergies (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, allergy_id)
);

create table public.child_tutors (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  is_legal_guardian boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, tutor_id)
);

create table public.authorized_pickup_persons (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  full_name text not null,
  relationship text,
  document text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  recorded_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, attendance_date)
);

-- ============================================================================
-- Índices en cada FK no cubierta por un unique.
-- child_tutors_one_primary_idx garantiza a lo sumo un tutor primario por niño.
-- ============================================================================

create index classroom_educators_educator_id_idx on public.classroom_educators (educator_id);
create index children_classroom_id_idx on public.children (classroom_id);
create index children_primary_educator_id_idx on public.children (primary_educator_id);
create index child_allergies_allergy_id_idx on public.child_allergies (allergy_id);
create index child_tutors_tutor_id_idx on public.child_tutors (tutor_id);
create index authorized_pickup_persons_child_id_idx on public.authorized_pickup_persons (child_id);
create index attendance_records_recorded_by_idx on public.attendance_records (recorded_by);

create unique index child_tutors_one_primary_idx on public.child_tutors (child_id) where is_primary;

-- ============================================================================
-- RLS habilitado sin policies (deny-all).
-- Las policies se definen en el spec de seguridad, gate previo a integrar la app.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_educators enable row level security;
alter table public.children enable row level security;
alter table public.child_health enable row level security;
alter table public.allergies enable row level security;
alter table public.child_allergies enable row level security;
alter table public.child_tutors enable row level security;
alter table public.authorized_pickup_persons enable row level security;
alter table public.attendance_records enable row level security;

-- ============================================================================
-- Trigger: mantener updated_at en cada update
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.classrooms
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.classroom_educators
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.children
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.child_health
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.allergies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.child_allergies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.child_tutors
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.authorized_pickup_persons
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_records
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Trigger: crear profiles al crear un auth.users
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    case
      when new.raw_app_meta_data ->> 'role' in ('admin', 'director', 'educator', 'tutor')
        then (new.raw_app_meta_data ->> 'role')::public.user_role
      else 'tutor'::public.user_role
    end,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

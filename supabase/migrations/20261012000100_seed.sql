-- SPEC 05 — Seed de datos ficticios (SPEC 01–04)
-- Inserta auth.users (patrón de desarrollo) para poblar profiles vía el trigger
-- public.handle_new_user(), más catálogos y los datos de los mocks.
-- IDs uuid fijos + on conflict do nothing → idempotente.
-- Valores tomados de data/mock.ts, data/mock-classroom.ts, data/mock-auth.ts,
-- data/mock-enrollment.ts.

-- ============================================================================
-- auth.users + profiles (staff y tutores)
-- El trigger public.handle_new_user() crea cada fila de profiles al insertar en
-- auth.users: rol desde raw_app_meta_data, full_name/phone desde raw_user_meta_data.
-- Se incluye además un insert explícito en profiles (on conflict do nothing)
-- como respaldo por si el trigger no estuviera presente.
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
values
  -- Staff
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'elena.morales@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"director"}', '{"full_name":"Elena Morales","phone":"+34 600 000 001"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'carlos.mendez@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"educator"}', '{"full_name":"Carlos Méndez","phone":"+34 600 000 002"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'camila.rivas@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"educator"}', '{"full_name":"Camila Rivas","phone":"+34 600 000 003"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'sofia.navarro@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"educator"}', '{"full_name":"Sofía Navarro","phone":"+34 600 000 004"}'),
  -- Tutores
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'david.gomez@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"David Gómez","phone":"+34 600 000 005"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'lucia.fernandez@gmail.com', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Lucía Fernández","phone":"+34 600 000 006"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'roberto.navarro@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Roberto Navarro","phone":"+34 600 000 007"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'lucia.martin@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Lucía Martín","phone":"+34 600 000 008"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'marta.vazquez@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Marta Vázquez","phone":"+34 600 000 009"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'raul.torres@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Raúl Torres","phone":"+34 600 000 010"}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'irene.cruz@kiddicare.test', extensions.crypt('kiddicare', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"],"role":"tutor"}', '{"full_name":"Irene Cruz","phone":"+34 600 000 011"}')
on conflict (id) do nothing;

insert into public.profiles (id, role, full_name, email, phone)
values
  ('00000000-0000-0000-0000-000000000001', 'director', 'Elena Morales', 'elena.morales@kiddicare.test', '+34 600 000 001'),
  ('00000000-0000-0000-0000-000000000002', 'educator', 'Carlos Méndez', 'carlos.mendez@kiddicare.test', '+34 600 000 002'),
  ('00000000-0000-0000-0000-000000000003', 'educator', 'Camila Rivas', 'camila.rivas@kiddicare.test', '+34 600 000 003'),
  ('00000000-0000-0000-0000-000000000004', 'educator', 'Sofía Navarro', 'sofia.navarro@kiddicare.test', '+34 600 000 004'),
  ('00000000-0000-0000-0000-000000000005', 'tutor', 'David Gómez', 'david.gomez@kiddicare.test', '+34 600 000 005'),
  ('00000000-0000-0000-0000-000000000006', 'tutor', 'Lucía Fernández', 'lucia.fernandez@gmail.com', '+34 600 000 006'),
  ('00000000-0000-0000-0000-000000000007', 'tutor', 'Roberto Navarro', 'roberto.navarro@kiddicare.test', '+34 600 000 007'),
  ('00000000-0000-0000-0000-000000000008', 'tutor', 'Lucía Martín', 'lucia.martin@kiddicare.test', '+34 600 000 008'),
  ('00000000-0000-0000-0000-000000000009', 'tutor', 'Marta Vázquez', 'marta.vazquez@kiddicare.test', '+34 600 000 009'),
  ('00000000-0000-0000-0000-000000000010', 'tutor', 'Raúl Torres', 'raul.torres@kiddicare.test', '+34 600 000 010'),
  ('00000000-0000-0000-0000-000000000011', 'tutor', 'Irene Cruz', 'irene.cruz@kiddicare.test', '+34 600 000 011')
on conflict (id) do nothing;

-- ============================================================================
-- Catálogo de aulas (mock-enrollment.ts)
-- ============================================================================

insert into public.classrooms (id, slug, name, age_range, age_min_months, age_max_months, tagline, description, capacity, recommended)
values
  ('00000000-0000-0000-0000-000000000101', 'cunas', 'Sala Cunas', '0 - 1 año', 0, 12, 'Lactantes', 'Estimulación temprana, biberones a demanda y ritmos de sueño individuales.', null, false),
  ('00000000-0000-0000-0000-000000000102', 'soles', 'Sala Soles', '1 - 2 años', 12, 24, 'Caminadores (1 a 2 años)', 'Primeros pasos autónomos, juego heurístico y lenguaje guiado.', null, true),
  ('00000000-0000-0000-0000-000000000103', 'estrellitas', 'Sala Estrellitas', '2 - 3 años', 24, 36, 'Exploradores', 'Control gradual de esfínteres, asambleas de diálogo y psicomotricidad.', null, false)
on conflict (id) do nothing;

-- ============================================================================
-- Catálogo de alergias (mock-enrollment.ts → allergyChips)
-- ============================================================================

insert into public.allergies (id, code, label, is_none)
values
  ('00000000-0000-0000-0000-000000000201', 'none', 'Sin alergias conocidas', true),
  ('00000000-0000-0000-0000-000000000202', 'aplv', 'APLV (Proteína leche vaca)', false),
  ('00000000-0000-0000-0000-000000000203', 'gluten', 'Gluten / Celíaco', false),
  ('00000000-0000-0000-0000-000000000204', 'nuts', 'Frutos secos', false),
  ('00000000-0000-0000-0000-000000000205', 'egg', 'Huevo', false),
  ('00000000-0000-0000-0000-000000000206', 'fish', 'Pescado', false)
on conflict (id) do nothing;

-- ============================================================================
-- Niños (mock-classroom.ts → students). Los 6 quedan en Sala Estrellitas y su
-- birth_date = 2024-10-24 menos la edad en meses del mock.
-- primary_educator_id = Elena Morales (lead de Estrellitas).
-- ============================================================================

insert into public.children (id, full_name, nickname, birth_date, gender, document, classroom_id, primary_educator_id, schedule)
values
  ('00000000-0000-0000-0000-000000000301', 'Mateo Gómez', null, '2023-04-24', 'boy', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day'),
  ('00000000-0000-0000-0000-000000000302', 'Sofía Navarro', null, '2023-02-24', 'girl', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day'),
  ('00000000-0000-0000-0000-000000000303', 'Lucas Martín', null, '2023-08-24', 'boy', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day'),
  ('00000000-0000-0000-0000-000000000304', 'Emma Díaz', null, '2022-12-24', 'girl', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day'),
  ('00000000-0000-0000-0000-000000000305', 'Leo Torres', null, '2023-06-24', 'boy', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day'),
  ('00000000-0000-0000-0000-000000000306', 'Martina Ramos', null, '2023-03-24', 'girl', null, '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'full_day')
on conflict (id) do nothing;

-- ============================================================================
-- Salud (mock-classroom.ts → healthTag / protocols)
-- Mateo: APLV + urgente + consentimiento. Emma: urgente (control térmico).
-- Martina: celíaca. Resto: sin particularidades.
-- ============================================================================

insert into public.child_health (child_id, pediatrician_name, pediatrician_phone, nap_notes, special_care_notes, medication_consent, urgent_medical_flag, vaccination_note)
values
  ('00000000-0000-0000-0000-000000000301', 'Dra. Mariana López', '+34 600 000 000', 'Duerme con su mantita azul de apego; prefiere caricias suaves en la espalda para conciliar el sueño.', 'APLV estricta. Bandeja de vajilla verde en cocina. Autoinyector en botiquín de aula 01.', true, true, null),
  ('00000000-0000-0000-0000-000000000302', null, null, null, null, false, false, null),
  ('00000000-0000-0000-0000-000000000303', null, null, null, null, false, false, null),
  ('00000000-0000-0000-0000-000000000304', null, null, null, 'Paracetamol oral 2.5 ml solo si la temperatura supera los 38.0°C. Autorización pediátrica validada. Control térmico con aviso a la familia.', true, true, null),
  ('00000000-0000-0000-0000-000000000305', null, null, null, null, false, false, null),
  ('00000000-0000-0000-0000-000000000306', null, null, null, 'Celíaca: evitar contacto cruzado con plastilinas con base de trigo. Plastilina de maíz habilitada. Menú 100% sin gluten.', false, false, null)
on conflict (child_id) do nothing;

-- ============================================================================
-- Alergias por niño (ninguno lleva más de una en el seed)
-- ============================================================================

insert into public.child_allergies (child_id, allergy_id, notes)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202', 'Reacción anafiláctica severa. Requiere adrenalina autoinyectable ubicada en el botiquín de aula.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', null),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', null),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', null),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000201', null),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000203', 'Celíaca, dieta 100% sin gluten.')
on conflict (child_id, allergy_id) do nothing;

-- ============================================================================
-- Tutores por niño (mock-classroom.ts → tutorLabel; Mateo suma Lucía Fernández
-- de SPEC 03). A lo sumo un tutor primario por niño (índice parcial único).
-- ============================================================================

insert into public.child_tutors (id, child_id, tutor_id, relationship, is_legal_guardian, is_primary)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000005', 'Padre', true, true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000006', 'Madre', true, false),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000007', 'Padre', true, true),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000008', 'Madre', true, true),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000009', 'Madre', true, true),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000010', 'Padre', true, true),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000011', 'Madre', true, true)
on conflict do nothing;

-- ============================================================================
-- Personas autorizadas de recogida
-- Mateo: las 3 de homeConfig.authorizedPeople (mock.ts).
-- Sofía: Roberto Navarro y Lucas: Carmen López (mock-classroom.ts → pickups).
-- ============================================================================

insert into public.authorized_pickup_persons (id, child_id, full_name, relationship, document, phone, is_active)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000301', 'Carmen López', 'Abuela materna', 'DNI ***4829J', null, true),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000301', 'David Gómez', 'Padre (Tutor legal)', 'DNI ***9182L', null, true),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000301', 'Laura Ramos', 'Tía', 'DNI ***6741K', null, true),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000302', 'Roberto Navarro', 'Padre', null, null, true),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000303', 'Carmen López', 'Abuela', 'DNI ***4829J', null, true)
on conflict (id) do nothing;

-- ============================================================================
-- Educadores por aula (mock-classroom.ts → educators; spec 05)
-- Estrellitas: Elena (lead) + Carlos · Soles: Camila (lead) · Cunas: Sofía.
-- ============================================================================

insert into public.classroom_educators (id, classroom_id, educator_id, is_lead)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', false),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', true),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000004', true)
on conflict (classroom_id, educator_id) do nothing;

-- ============================================================================
-- Asistencia del 2024-10-24 (mock-classroom.ts → footnote del roster).
-- Mateo 08:35 · Lucas 08:50 · Martina 08:20 · Sofía 08:35 + salida 13:00 ·
-- Emma entrada. Leo ausente: sin fila.
-- ============================================================================

insert into public.attendance_records (id, child_id, attendance_date, check_in_at, check_out_at, recorded_by, notes)
values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000301', '2024-10-24', '2024-10-24 08:35:00+00', null, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000303', '2024-10-24', '2024-10-24 08:50:00+00', null, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000306', '2024-10-24', '2024-10-24 08:20:00+00', null, '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000302', '2024-10-24', '2024-10-24 08:35:00+00', '2024-10-24 13:00:00+00', '00000000-0000-0000-0000-000000000001', null),
  ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000304', '2024-10-24', '2024-10-24 08:30:00+00', null, '00000000-0000-0000-0000-000000000001', null)
on conflict (child_id, attendance_date) do nothing;

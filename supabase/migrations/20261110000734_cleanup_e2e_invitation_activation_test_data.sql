-- Teardown de la verificación E2E de spec-11: elimina únicamente los datos
-- efímeros creados por la prueba (usuario tutor, su perfil, vínculo e invitación).
-- Es idempotente: si no existen, no hace nada.

delete from public.child_tutors ct
using public.profiles p
where p.id = ct.tutor_id
  and pg_catalog.lower(p.email) = 'familia.prueba.e2e@kiddicare.test';

delete from public.invitations i
where pg_catalog.lower(i.email) = 'familia.prueba.e2e@kiddicare.test';

delete from public.profiles p
where pg_catalog.lower(p.email) = 'familia.prueba.e2e@kiddicare.test';

delete from auth.users u
where pg_catalog.lower(u.email) = 'familia.prueba.e2e@kiddicare.test';

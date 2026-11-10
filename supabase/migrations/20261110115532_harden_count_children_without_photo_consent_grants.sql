-- SPEC 12 - Hardening de grants del RPC de consentimiento
-- Supabase concede EXECUTE a anon/authenticated/service_role por privilegios por
-- defecto en el schema public. `revoke ... from public` no elimina el grant
-- explicito a anon, asi que se revoca aqui para que solo authenticated pueda
-- ejecutar el RPC, siguiendo el patron de los demas RPCs del proyecto.

revoke all on function public.count_children_without_photo_consent(uuid) from anon;

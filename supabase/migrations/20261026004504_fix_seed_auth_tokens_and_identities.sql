-- SPEC 07 - Corrective migration for the seed auth users.
-- SPEC 05 inserted the 11 users directly into auth.users without normalizing
-- the token columns (GoTrue scans them as strings, NULL breaks login) and
-- without creating the matching auth.identities rows.
-- Idempotent: safe to re-run. No schema, RLS or profiles changes.

update auth.users
set
  confirmation_token = '',
  recovery_token = '',
  email_change = '',
  email_change_token_new = ''
where id::text like '00000000-0000-0000-0000-0000000000%';

insert into auth.identities (user_id, identity_data, provider, provider_id, created_at, updated_at)
select
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(),
  now()
from auth.users u
where u.id::text like '00000000-0000-0000-0000-0000000000%'
  and u.email is not null
on conflict (provider_id, provider) do nothing;

-- GoTrue scans created_at/updated_at as non-null timestamps; backfill any
-- identity created before this migration added them.
update auth.identities
set
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where user_id::text like '00000000-0000-0000-0000-0000000000%';

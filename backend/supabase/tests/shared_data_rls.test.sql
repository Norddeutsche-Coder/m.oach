begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000011', 'first-coach@example.test'),
  ('10000000-0000-0000-0000-000000000012', 'second-coach@example.test'),
  ('10000000-0000-0000-0000-000000000013', 'pending-coach@example.test'),
  ('10000000-0000-0000-0000-000000000014', 'declined-coach@example.test'),
  ('10000000-0000-0000-0000-000000000015', 'athlete@example.test'),
  ('10000000-0000-0000-0000-000000000016', 'other@example.test');

insert into public.coach_requests (id, coach_id, athlete_id, status)
values
  (
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000015',
    'accepted'
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000015',
    'accepted'
  ),
  (
    '20000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000015',
    'pending'
  ),
  (
    '20000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000015',
    'declined'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000015', true);

select lives_ok(
  $$
    insert into public.shared_data (athlete_id, payload)
    values ('10000000-0000-0000-0000-000000000015', '{"note":"initial"}'::jsonb)
  $$,
  'an athlete can insert their own shared data while coaching is accepted'
);

select results_eq(
  $$
    select payload
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  array['{"note":"initial"}'::jsonb],
  'an athlete can select their own shared data'
);

select results_eq(
  $$
    update public.shared_data
    set payload = '{"note":"updated"}'::jsonb
    where athlete_id = '10000000-0000-0000-0000-000000000015'
    returning payload
  $$,
  array['{"note":"updated"}'::jsonb],
  'an athlete can update their own shared data'
);

select results_eq(
  $$
    delete from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
    returning athlete_id
  $$,
  array['10000000-0000-0000-0000-000000000015'::uuid],
  'an athlete can delete their own shared data'
);

select lives_ok(
  $$
    insert into public.shared_data (athlete_id, payload)
    values ('10000000-0000-0000-0000-000000000015', '{"note":"shared"}'::jsonb)
  $$,
  'an athlete can recreate shared data for active coaching'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000016', true);

select is_empty(
  $$
    select athlete_id
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  'an unrelated user cannot select an athlete shared data'
);

select throws_ok(
  $$
    insert into public.shared_data (athlete_id, payload)
    values ('10000000-0000-0000-0000-000000000015', '{}'::jsonb)
  $$,
  '42501',
  'new row violates row-level security policy for table "shared_data"',
  'an unrelated user cannot insert shared data for an athlete'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000011', true);

select results_eq(
  $$
    select payload
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  array['{"note":"shared"}'::jsonb],
  'an accepted coach can select the athlete shared data'
);

select is_empty(
  $$
    update public.shared_data
    set payload = '{"note":"coach update"}'::jsonb
    where athlete_id = '10000000-0000-0000-0000-000000000015'
    returning athlete_id
  $$,
  'an accepted coach cannot update the athlete shared data'
);

select is_empty(
  $$
    delete from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
    returning athlete_id
  $$,
  'an accepted coach cannot delete the athlete shared data'
);

select throws_ok(
  $$
    insert into public.shared_data (athlete_id, payload)
    values ('10000000-0000-0000-0000-000000000011', '{}'::jsonb)
  $$,
  '42501',
  'new row violates row-level security policy for table "shared_data"',
  'an accepted coach cannot insert shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000013', true);

select is_empty(
  $$
    select athlete_id
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  'a coach with a pending request cannot select shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000014', true);

select is_empty(
  $$
    select athlete_id
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  'a coach with a declined request cannot select shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000012', true);

select results_eq(
  $$
    select payload
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  array['{"note":"shared"}'::jsonb],
  'a second accepted coach can select the athlete shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000015', true);

select lives_ok(
  $$
    delete from public.coach_requests
    where id = '20000000-0000-0000-0000-000000000011'
  $$,
  'the athlete can remove one of two accepted coaches'
);

select results_eq(
  $$
    select payload
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  array['{"note":"shared"}'::jsonb],
  'shared data remains while another accepted coach exists'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000011', true);

select is_empty(
  $$
    select athlete_id
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  'a removed coach immediately loses access to shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000012', true);

select results_eq(
  $$
    select payload
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  array['{"note":"shared"}'::jsonb],
  'the remaining accepted coach keeps access to shared data'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000015', true);

select lives_ok(
  $$
    delete from public.coach_requests
    where id = '20000000-0000-0000-0000-000000000012'
  $$,
  'the athlete can remove the last accepted coach'
);

select is_empty(
  $$
    select athlete_id
    from public.shared_data
    where athlete_id = '10000000-0000-0000-0000-000000000015'
  $$,
  'removing the last accepted coach deletes shared data server-side'
);

select * from finish();

rollback;

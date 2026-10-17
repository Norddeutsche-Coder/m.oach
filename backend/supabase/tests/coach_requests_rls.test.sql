begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'coach@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'athlete@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'other@example.test');

insert into public.admins (user_id)
values ('10000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$
    insert into public.coach_requests (id, coach_id, athlete_id)
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  'an admin coach can create a pending request for themself'
);

select results_eq(
  $$
    select status
    from public.coach_requests
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  array['pending'::text],
  'a newly created request is pending'
);

select is_empty(
  $$
    update public.coach_requests
    set status = 'accepted'
    where id = '20000000-0000-0000-0000-000000000001'
    returning status
  $$,
  'a coach cannot accept their own request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$
    update public.coach_requests
    set coach_id = '10000000-0000-0000-0000-000000000003'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'coach_id und athlete_id sind unveränderlich',
  'request participants cannot be changed'
);

select results_eq(
  $$
    update public.coach_requests
    set status = 'accepted'
    where id = '20000000-0000-0000-0000-000000000001'
    returning status
  $$,
  array['accepted'::text],
  'the athlete can accept a pending request'
);

select is_empty(
  $$
    update public.coach_requests
    set status = 'declined'
    where id = '20000000-0000-0000-0000-000000000001'
    returning status
  $$,
  'the athlete cannot change an accepted request to declined'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is_empty(
  $$
    update public.coach_requests
    set status = 'pending'
    where id = '20000000-0000-0000-0000-000000000001'
    returning status
  $$,
  'a coach cannot repeat an accepted request'
);

select lives_ok(
  $$
    insert into public.coach_requests (id, coach_id, athlete_id)
    values (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003'
    )
  $$,
  'an admin coach can create another pending request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select results_eq(
  $$
    update public.coach_requests
    set status = 'declined'
    where id = '20000000-0000-0000-0000-000000000002'
    returning status
  $$,
  array['declined'::text],
  'the athlete can decline a pending request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$
    update public.coach_requests
    set status = 'pending'
    where id = '20000000-0000-0000-0000-000000000002'
    returning status
  $$,
  array['pending'::text],
  'an admin coach can repeat a declined request'
);

select lives_ok(
  $$
    delete from public.coach_requests
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  'a coach can delete their own request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$
    delete from public.coach_requests
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  'an athlete can end accepted coaching access'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$
    insert into public.coach_requests (coach_id, athlete_id)
    values (
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "coach_requests"',
  'a non-admin cannot create a request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$
    insert into public.coach_requests (coach_id, athlete_id, status)
    values (
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003',
      'accepted'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "coach_requests"',
  'a coach cannot create an accepted request'
);

select * from finish();

rollback;

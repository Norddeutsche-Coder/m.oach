drop policy if exists req_update_athlete on public.coach_requests;

create policy req_update_athlete
on public.coach_requests
as permissive
for update
to authenticated
using (athlete_id = auth.uid() and status = 'pending'::text)
with check (
  athlete_id = auth.uid()
  and status = any (array['accepted'::text, 'declined'::text])
);

drop policy if exists req_update_coach on public.coach_requests;

create policy req_update_coach
on public.coach_requests
as permissive
for update
to authenticated
using (
  coach_id = auth.uid()
  and status = 'declined'::text
  and public.is_admin()
)
with check (
  coach_id = auth.uid()
  and status = 'pending'::text
  and public.is_admin()
);

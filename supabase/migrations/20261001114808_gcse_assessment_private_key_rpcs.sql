create or replace function public.gcse_store_assessment_key(
  p_assessment_id uuid,
  p_teacher_id uuid,
  p_marking_payload jsonb
) returns void
language sql
security invoker
set search_path = ''
as $$
  insert into private.gcse_assessment_keys (assessment_id, teacher_id, marking_payload, updated_at)
  values (p_assessment_id, p_teacher_id, coalesce(p_marking_payload, '[]'::jsonb), now())
  on conflict (assessment_id) do update
    set teacher_id = excluded.teacher_id,
        marking_payload = excluded.marking_payload,
        updated_at = now();
$$;

create or replace function public.gcse_fetch_assessment_key(p_assessment_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select marking_payload
  from private.gcse_assessment_keys
  where assessment_id = p_assessment_id
  limit 1;
$$;

revoke all on function public.gcse_store_assessment_key(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.gcse_fetch_assessment_key(uuid) from public, anon, authenticated;
grant execute on function public.gcse_store_assessment_key(uuid,uuid,jsonb) to service_role;
grant execute on function public.gcse_fetch_assessment_key(uuid) to service_role;
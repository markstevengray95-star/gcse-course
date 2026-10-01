revoke insert, update, delete on table public.gcse_assessment_attempts from authenticated;
revoke insert, update, delete on table public.gcse_assessments from authenticated;
revoke insert, update, delete on table public.gcse_assessment_targets from authenticated;
revoke usage on schema private from anon, authenticated, public;
grant usage on schema private to service_role;
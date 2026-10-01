create or replace function private.gcse_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gcse_assessments_touch_updated_at on public.gcse_assessments;
create trigger gcse_assessments_touch_updated_at before update on public.gcse_assessments for each row execute function private.gcse_touch_updated_at();
drop trigger if exists gcse_assessment_attempts_touch_updated_at on public.gcse_assessment_attempts;
create trigger gcse_assessment_attempts_touch_updated_at before update on public.gcse_assessment_attempts for each row execute function private.gcse_touch_updated_at();
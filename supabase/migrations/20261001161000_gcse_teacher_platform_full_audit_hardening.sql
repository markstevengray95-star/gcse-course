-- Full Teacher Platform audit hardening for phases 1-17.
-- Scope is limited to GCSE-course objects in this shared Supabase project.

-- Remove PostgreSQL table privileges browser roles never need.
-- TRUNCATE is especially important because it is not protected by RLS.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and left(c.relname,5)='gcse_'
  loop
    execute format('revoke truncate, references, trigger on table public.%I from anon, authenticated', r.relname);
  end loop;
end$$;

-- Entitlement helpers: only the caller-scoped RPC is browser callable.
revoke all on function public.gcse_subscription_entitlements(public.gcse_profiles) from public, anon, authenticated;
revoke all on function public.gcse_get_entitlements() from public, anon;
grant execute on function public.gcse_get_entitlements() to authenticated;

-- Phase 3 homework: strengthen teacher writes and move student status mutation server-side.
alter table public.gcse_assignments
  drop constraint if exists gcse_assignments_due_after_available_check;
alter table public.gcse_assignments
  add constraint gcse_assignments_due_after_available_check check (due_at > available_from);

drop policy if exists gcse_assignments_teacher_insert on public.gcse_assignments;
create policy gcse_assignments_teacher_insert on public.gcse_assignments
for insert to authenticated
with check (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
  and exists (
    select 1 from public.gcse_classes c
    where c.id=gcse_assignments.class_id
      and c.teacher_id=(select auth.uid())
      and not c.archived
  )
);

drop policy if exists gcse_assignments_teacher_update on public.gcse_assignments;
create policy gcse_assignments_teacher_update on public.gcse_assignments
for update to authenticated
using (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
)
with check (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
  and exists (
    select 1 from public.gcse_classes c
    where c.id=gcse_assignments.class_id
      and c.teacher_id=(select auth.uid())
  )
);

drop policy if exists gcse_assignment_targets_teacher_insert on public.gcse_assignment_targets;
create policy gcse_assignment_targets_teacher_insert on public.gcse_assignment_targets
for insert to authenticated
with check (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
  and exists (
    select 1
    from public.gcse_assignments a
    join public.gcse_class_members m
      on m.class_id=a.class_id
     and m.student_id=gcse_assignment_targets.student_id
     and m.status='joined'
    where a.id=gcse_assignment_targets.assignment_id
      and a.teacher_id=(select auth.uid())
      and a.class_id=gcse_assignment_targets.class_id
      and gcse_assignment_targets.teacher_id=a.teacher_id
  )
);

create or replace function public.gcse_set_assignment_submission_status(
  p_assignment_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid:=auth.uid();
  a public.gcse_assignments%rowtype;
  existing public.gcse_assignment_submissions%rowtype;
  saved public.gcse_assignment_submissions%rowtype;
  requested text:=lower(coalesce(p_status,''));
  now_at timestamptz:=now();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if requested not in ('in_progress','submitted') then raise exception 'invalid_submission_status'; end if;

  select * into a
  from public.gcse_assignments
  where id=p_assignment_id
    and status='published'
    and available_from<=now_at;
  if not found then raise exception 'assignment_unavailable'; end if;

  if a.assignment_type='intervention' then raise exception 'intervention_requires_mastery_flow'; end if;

  if not exists (
    select 1 from public.gcse_class_members m
    where m.class_id=a.class_id and m.student_id=uid and m.status='joined'
  ) then raise exception 'assignment_not_assigned'; end if;

  if a.audience_mode='selected' and not exists (
    select 1 from public.gcse_assignment_targets t
    where t.assignment_id=a.id and t.student_id=uid
  ) then raise exception 'assignment_not_assigned'; end if;

  select * into existing
  from public.gcse_assignment_submissions s
  where s.assignment_id=a.id and s.student_id=uid;

  if found and existing.status='submitted' then
    return jsonb_build_object(
      'id',existing.id,'assignmentId',existing.assignment_id,'status',existing.status,
      'startedAt',existing.started_at,'submittedAt',existing.submitted_at
    );
  end if;

  insert into public.gcse_assignment_submissions(
    assignment_id,class_id,teacher_id,student_id,status,started_at,submitted_at,updated_at
  ) values (
    a.id,a.class_id,a.teacher_id,uid,requested,
    coalesce(existing.started_at,now_at),
    case when requested='submitted' then now_at else null end,
    now_at
  )
  on conflict(assignment_id,student_id) do update set
    class_id=excluded.class_id,
    teacher_id=excluded.teacher_id,
    status=excluded.status,
    started_at=coalesce(public.gcse_assignment_submissions.started_at,excluded.started_at),
    submitted_at=case when excluded.status='submitted' then excluded.submitted_at else public.gcse_assignment_submissions.submitted_at end,
    updated_at=excluded.updated_at
  returning * into saved;

  return jsonb_build_object(
    'id',saved.id,'assignmentId',saved.assignment_id,'status',saved.status,
    'startedAt',saved.started_at,'submittedAt',saved.submitted_at
  );
end;
$$;

revoke all on function public.gcse_set_assignment_submission_status(uuid,text) from public, anon;
grant execute on function public.gcse_set_assignment_submission_status(uuid,text) to authenticated;

revoke insert, update, delete on table public.gcse_assignment_submissions from authenticated;
drop policy if exists gcse_assignment_submissions_student_insert on public.gcse_assignment_submissions;
drop policy if exists gcse_assignment_submissions_student_update on public.gcse_assignment_submissions;

-- Phases 8 and 11: reduce live-classroom mutation surface and enforce class ownership.
revoke insert, update, delete on table public.gcse_live_classroom_sessions from authenticated;
revoke insert, update, delete on table public.gcse_live_classroom_responses from authenticated;

drop policy if exists gcse_live_sessions_teacher_manage on public.gcse_live_classroom_sessions;
drop policy if exists gcse_live_sessions_student_read on public.gcse_live_classroom_sessions;
create policy gcse_live_sessions_read on public.gcse_live_classroom_sessions
for select to authenticated
using (
  (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
  or (
    status='live'
    and exists (
      select 1 from public.gcse_class_members m
      where m.class_id=gcse_live_classroom_sessions.class_id
        and m.student_id=(select auth.uid()) and m.status='joined'
    )
  )
);

drop policy if exists gcse_live_responses_teacher_read on public.gcse_live_classroom_responses;
drop policy if exists gcse_live_responses_student_read on public.gcse_live_classroom_responses;
drop policy if exists gcse_live_responses_student_insert on public.gcse_live_classroom_responses;
drop policy if exists gcse_live_responses_student_update on public.gcse_live_classroom_responses;
create policy gcse_live_responses_read on public.gcse_live_classroom_responses
for select to authenticated
using (
  (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
  or student_id=(select auth.uid())
);

drop policy if exists gcse_presentation_teacher_manage on public.gcse_presentation_sessions;
drop policy if exists gcse_presentation_student_read on public.gcse_presentation_sessions;
create policy gcse_presentation_read on public.gcse_presentation_sessions
for select to authenticated
using (
  (
    teacher_id=(select auth.uid())
    and (select private.gcse_has_teacher_access())
    and (class_id is null or exists (
      select 1 from public.gcse_classes c
      where c.id=gcse_presentation_sessions.class_id and c.teacher_id=(select auth.uid())
    ))
  )
  or (
    status='live' and class_id is not null
    and exists (
      select 1 from public.gcse_class_members m
      where m.class_id=gcse_presentation_sessions.class_id
        and m.student_id=(select auth.uid()) and m.status='joined'
    )
  )
);
create policy gcse_presentation_teacher_insert on public.gcse_presentation_sessions
for insert to authenticated
with check (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (
    select 1 from public.gcse_classes c
    where c.id=gcse_presentation_sessions.class_id and c.teacher_id=(select auth.uid())
  ))
);
create policy gcse_presentation_teacher_update on public.gcse_presentation_sessions
for update to authenticated
using (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
with check (
  teacher_id=(select auth.uid())
  and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (
    select 1 from public.gcse_classes c
    where c.id=gcse_presentation_sessions.class_id and c.teacher_id=(select auth.uid())
  ))
);
create policy gcse_presentation_teacher_delete on public.gcse_presentation_sessions
for delete to authenticated
using (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));

-- Phases 9, 10 and 13: class-linked teacher data must point only to the teacher's classes.
drop policy if exists gcse_teacher_resources_owner on public.gcse_teacher_resources;
create policy gcse_teacher_resources_owner on public.gcse_teacher_resources
for all to authenticated
using (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (select 1 from public.gcse_classes c where c.id=gcse_teacher_resources.class_id and c.teacher_id=(select auth.uid())))
)
with check (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (select 1 from public.gcse_classes c where c.id=gcse_teacher_resources.class_id and c.teacher_id=(select auth.uid())))
);

drop policy if exists gcse_lesson_plans_owner on public.gcse_lesson_plans;
create policy gcse_lesson_plans_owner on public.gcse_lesson_plans
for all to authenticated
using (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (select 1 from public.gcse_classes c where c.id=gcse_lesson_plans.class_id and c.teacher_id=(select auth.uid())))
)
with check (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and (class_id is null or exists (select 1 from public.gcse_classes c where c.id=gcse_lesson_plans.class_id and c.teacher_id=(select auth.uid())))
);

drop policy if exists gcse_teacher_reports_owner on public.gcse_teacher_reports;
create policy gcse_teacher_reports_owner on public.gcse_teacher_reports
for all to authenticated
using (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and exists (select 1 from public.gcse_classes c where c.id=gcse_teacher_reports.class_id and c.teacher_id=(select auth.uid()))
)
with check (
  teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())
  and exists (select 1 from public.gcse_classes c where c.id=gcse_teacher_reports.class_id and c.teacher_id=(select auth.uid()))
);
revoke insert, update on table public.gcse_teacher_reports from authenticated;

-- Phases 15 and 17: membership changes must pass RPC account/role validation.
revoke insert, update, delete on table public.gcse_department_members from authenticated;
drop policy if exists gcse_department_members_admin_insert on public.gcse_department_members;
drop policy if exists gcse_department_members_admin_update on public.gcse_department_members;
drop policy if exists gcse_department_members_admin_delete on public.gcse_department_members;

revoke insert, update, delete on table public.gcse_school_members from authenticated;
drop policy if exists gcse_school_members_admin_insert on public.gcse_school_members;
drop policy if exists gcse_school_members_admin_update on public.gcse_school_members;
drop policy if exists gcse_school_members_admin_delete on public.gcse_school_members;

-- Cover foreign keys used heavily by phases 3-5.
create index if not exists gcse_assessment_keys_teacher_idx on private.gcse_assessment_keys(teacher_id);
create index if not exists gcse_assessment_adjustments_class_idx on public.gcse_assessment_mark_adjustments(class_id);
create index if not exists gcse_assessment_adjustments_student_idx on public.gcse_assessment_mark_adjustments(student_id);
create index if not exists gcse_assessment_adjustments_teacher_idx on public.gcse_assessment_mark_adjustments(teacher_id);
create index if not exists gcse_assessment_targets_class_idx on public.gcse_assessment_targets(class_id);
create index if not exists gcse_assignment_submissions_class_idx on public.gcse_assignment_submissions(class_id);
create index if not exists gcse_assignment_submissions_teacher_idx on public.gcse_assignment_submissions(teacher_id);
create index if not exists gcse_assignment_targets_class_idx on public.gcse_assignment_targets(class_id);
create index if not exists gcse_assignment_targets_student_idx on public.gcse_assignment_targets(student_id);
create index if not exists gcse_assignment_targets_teacher_idx on public.gcse_assignment_targets(teacher_id);
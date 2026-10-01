-- Consolidate duplicate teacher/student SELECT policies found by the Supabase performance advisor.

-- Phase 3 assignments.
drop policy if exists gcse_assignments_student_select on public.gcse_assignments;
drop policy if exists gcse_assignments_teacher_select on public.gcse_assignments;
create policy gcse_assignments_select on public.gcse_assignments
for select to authenticated
using (
  (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
  or (
    status='published'
    and available_from<=now()
    and exists (
      select 1 from public.gcse_class_members m
      where m.class_id=gcse_assignments.class_id
        and m.student_id=(select auth.uid())
        and m.status='joined'
    )
    and (
      audience_mode='class'
      or exists (
        select 1 from public.gcse_assignment_targets t
        where t.assignment_id=gcse_assignments.id
          and t.student_id=(select auth.uid())
      )
    )
  )
);

-- Phase 3 assignment targets.
drop policy if exists gcse_assignment_targets_student_select on public.gcse_assignment_targets;
drop policy if exists gcse_assignment_targets_teacher_select on public.gcse_assignment_targets;
create policy gcse_assignment_targets_select on public.gcse_assignment_targets
for select to authenticated
using (
  student_id=(select auth.uid())
  or (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
);

-- Phase 3 assignment submissions.
drop policy if exists gcse_assignment_submissions_student_select on public.gcse_assignment_submissions;
drop policy if exists gcse_assignment_submissions_teacher_select on public.gcse_assignment_submissions;
create policy gcse_assignment_submissions_select on public.gcse_assignment_submissions
for select to authenticated
using (
  student_id=(select auth.uid())
  or (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
);

-- Phase 4 assessment attempts.
drop policy if exists gcse_assessment_attempts_student_select on public.gcse_assessment_attempts;
drop policy if exists gcse_assessment_attempts_teacher_select on public.gcse_assessment_attempts;
create policy gcse_assessment_attempts_select on public.gcse_assessment_attempts
for select to authenticated
using (
  student_id=(select auth.uid())
  or (teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()))
);
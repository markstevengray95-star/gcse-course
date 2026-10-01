grant select, insert, update, delete on table public.gcse_assignments to authenticated;
grant select, insert, delete on table public.gcse_assignment_targets to authenticated;
grant select, insert, update on table public.gcse_assignment_submissions to authenticated;

create policy "gcse_assignments_student_select" on public.gcse_assignments for select to authenticated
using (
  status = 'published'
  and available_from <= now()
  and exists (
    select 1 from public.gcse_class_members m
    where m.class_id = gcse_assignments.class_id
      and m.student_id = (select auth.uid())
      and m.status = 'joined'
  )
  and (
    audience_mode = 'class'
    or exists (
      select 1 from public.gcse_assignment_targets t
      where t.assignment_id = gcse_assignments.id
        and t.student_id = (select auth.uid())
    )
  )
);

create policy "gcse_assignment_targets_student_select" on public.gcse_assignment_targets for select to authenticated
using (student_id = (select auth.uid()));

create policy "gcse_assignment_submissions_student_insert" on public.gcse_assignment_submissions for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.gcse_assignments a
    where a.id = gcse_assignment_submissions.assignment_id
  )
);
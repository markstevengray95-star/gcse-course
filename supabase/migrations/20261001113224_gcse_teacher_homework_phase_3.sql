create table if not exists public.gcse_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  instructions text not null default '',
  assignment_type text not null default 'custom' check (assignment_type in ('lesson','topic','quiz','revision','mock','custom')),
  content_ref text,
  content_item text,
  audience_mode text not null default 'class' check (audience_mode in ('class','selected')),
  due_at timestamptz not null,
  available_from timestamptz not null default now(),
  status text not null default 'published' check (status in ('draft','published','closed')),
  min_score smallint check (min_score is null or min_score between 0 and 100),
  max_attempts smallint check (max_attempts is null or max_attempts between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gcse_assignment_targets (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.gcse_assignments(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.gcse_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.gcse_assignments(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted')),
  started_at timestamptz,
  submitted_at timestamptz,
  score numeric,
  max_score numeric,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create index if not exists gcse_assignments_teacher_idx on public.gcse_assignments(teacher_id, status, due_at);
create index if not exists gcse_assignments_class_idx on public.gcse_assignments(class_id, status, due_at);
create index if not exists gcse_assignment_targets_assignment_idx on public.gcse_assignment_targets(assignment_id, student_id);
create index if not exists gcse_assignment_submissions_assignment_idx on public.gcse_assignment_submissions(assignment_id, status);
create index if not exists gcse_assignment_submissions_student_idx on public.gcse_assignment_submissions(student_id, status);

alter table public.gcse_assignments enable row level security;
alter table public.gcse_assignment_targets enable row level security;
alter table public.gcse_assignment_submissions enable row level security;

revoke all on table public.gcse_assignments from anon, authenticated;
revoke all on table public.gcse_assignment_targets from anon, authenticated;
revoke all on table public.gcse_assignment_submissions from anon, authenticated;

create policy "gcse_assignments_teacher_select" on public.gcse_assignments for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignments_teacher_insert" on public.gcse_assignments for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignments_teacher_update" on public.gcse_assignments for update to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()))
with check (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignments_teacher_delete" on public.gcse_assignments for delete to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

create policy "gcse_assignment_targets_teacher_select" on public.gcse_assignment_targets for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignment_targets_teacher_insert" on public.gcse_assignment_targets for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignment_targets_teacher_delete" on public.gcse_assignment_targets for delete to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

create policy "gcse_assignment_submissions_teacher_select" on public.gcse_assignment_submissions for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy "gcse_assignment_submissions_student_select" on public.gcse_assignment_submissions for select to authenticated
using (student_id = (select auth.uid()));
create policy "gcse_assignment_submissions_student_update" on public.gcse_assignment_submissions for update to authenticated
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));
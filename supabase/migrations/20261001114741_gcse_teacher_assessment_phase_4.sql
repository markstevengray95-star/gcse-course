create table if not exists public.gcse_assessments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  instructions text not null default '',
  qualification text not null check (qualification in ('combined','separate')),
  subject text not null check (subject in ('biology','chemistry','physics')),
  paper smallint not null check (paper in (1,2)),
  tier text not null check (tier in ('foundation','higher')),
  topic_ids text[] not null default '{}',
  total_marks integer not null check (total_marks between 5 and 100),
  duration_minutes integer not null check (duration_minutes between 5 and 180),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  audience_mode text not null default 'class' check (audience_mode in ('class','selected')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  question_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gcse_assessments_window check (closes_at > opens_at)
);

create table if not exists private.gcse_assessment_keys (
  assessment_id uuid primary key references public.gcse_assessments(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  marking_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gcse_assessment_targets (
  assessment_id uuid not null references public.gcse_assessments(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assessment_id, student_id)
);

create table if not exists public.gcse_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.gcse_assessments(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  score integer,
  total_marks integer,
  percent integer,
  topic_breakdown jsonb not null default '{}'::jsonb,
  review jsonb not null default '[]'::jsonb,
  timed_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id),
  constraint gcse_assessment_attempt_score check (score is null or score >= 0),
  constraint gcse_assessment_attempt_percent check (percent is null or percent between 0 and 100)
);

create index if not exists gcse_assessments_teacher_idx on public.gcse_assessments(teacher_id, status, opens_at);
create index if not exists gcse_assessments_class_idx on public.gcse_assessments(class_id, status, opens_at);
create index if not exists gcse_assessment_targets_student_idx on public.gcse_assessment_targets(student_id, assessment_id);
create index if not exists gcse_assessment_targets_teacher_idx on public.gcse_assessment_targets(teacher_id, assessment_id);
create index if not exists gcse_assessment_attempts_teacher_idx on public.gcse_assessment_attempts(teacher_id, assessment_id);
create index if not exists gcse_assessment_attempts_student_idx on public.gcse_assessment_attempts(student_id, assessment_id);
create index if not exists gcse_assessment_attempts_class_idx on public.gcse_assessment_attempts(class_id, assessment_id);

alter table public.gcse_assessments enable row level security;
alter table public.gcse_assessment_targets enable row level security;
alter table public.gcse_assessment_attempts enable row level security;

revoke all on table public.gcse_assessments from anon;
revoke all on table public.gcse_assessment_targets from anon;
revoke all on table public.gcse_assessment_attempts from anon;
revoke all on table private.gcse_assessment_keys from anon, authenticated, public;

grant select on table public.gcse_assessments to authenticated;
grant select on table public.gcse_assessment_targets to authenticated;
grant select on table public.gcse_assessment_attempts to authenticated;
grant select, insert, update, delete on table public.gcse_assessments to service_role;
grant select, insert, update, delete on table public.gcse_assessment_targets to service_role;
grant select, insert, update, delete on table public.gcse_assessment_attempts to service_role;
grant select, insert, update, delete on table private.gcse_assessment_keys to service_role;

drop policy if exists gcse_assessments_teacher_select on public.gcse_assessments;
create policy gcse_assessments_teacher_select on public.gcse_assessments
for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

drop policy if exists gcse_assessment_targets_teacher_select on public.gcse_assessment_targets;
create policy gcse_assessment_targets_teacher_select on public.gcse_assessment_targets
for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

drop policy if exists gcse_assessment_attempts_teacher_select on public.gcse_assessment_attempts;
create policy gcse_assessment_attempts_teacher_select on public.gcse_assessment_attempts
for select to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

drop policy if exists gcse_assessment_attempts_student_select on public.gcse_assessment_attempts;
create policy gcse_assessment_attempts_student_select on public.gcse_assessment_attempts
for select to authenticated
using (student_id = (select auth.uid()));
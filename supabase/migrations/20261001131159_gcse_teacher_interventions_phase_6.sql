-- Teacher Platform Phase 6: targeted interventions and follow-up mastery checks.
-- The later Phase 6 RPC-alignment migration contains the final callable functions.

alter table public.gcse_assignments
  drop constraint if exists gcse_assignments_assignment_type_check;
alter table public.gcse_assignments
  add constraint gcse_assignments_assignment_type_check
  check (assignment_type = any (array[
    'lesson'::text,'topic'::text,'quiz'::text,'revision'::text,
    'mock'::text,'custom'::text,'intervention'::text
  ]));

create table if not exists private.gcse_interventions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  source_assessment_id uuid not null references public.gcse_assessments(id) on delete cascade,
  assignment_id uuid not null unique references public.gcse_assignments(id) on delete cascade,
  topic_id text not null,
  topic_code text not null,
  topic_title text not null,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'published' check (status in ('draft','published','closed')),
  threshold_percent integer not null default 50 check (threshold_percent between 1 and 100),
  target_score integer not null default 70 check (target_score between 0 and 100),
  max_questions integer not null default 3 check (max_questions between 1 and 5),
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.gcse_intervention_targets (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references private.gcse_interventions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  baseline_earned integer not null default 0 check (baseline_earned >= 0),
  baseline_possible integer not null check (baseline_possible > 0),
  baseline_percent integer not null check (baseline_percent between 0 and 100),
  support_level text not null check (support_level in ('priority','developing')),
  task_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(intervention_id,student_id)
);

create table if not exists private.gcse_intervention_keys (
  target_id uuid primary key references private.gcse_intervention_targets(id) on delete cascade,
  marking_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.gcse_intervention_attempts (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references private.gcse_interventions(id) on delete cascade,
  target_id uuid not null references private.gcse_intervention_targets(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  answers jsonb not null default '{}'::jsonb,
  review jsonb not null default '[]'::jsonb,
  score integer,
  total_marks integer,
  percent integer,
  improvement_points integer,
  improved boolean,
  target_met boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(intervention_id,student_id)
);

create index if not exists gcse_interventions_teacher_idx on private.gcse_interventions(teacher_id,created_at desc);
create index if not exists gcse_interventions_assessment_idx on private.gcse_interventions(source_assessment_id,created_at desc);
create index if not exists gcse_intervention_targets_student_idx on private.gcse_intervention_targets(student_id,intervention_id);
create index if not exists gcse_intervention_attempts_student_idx on private.gcse_intervention_attempts(student_id,intervention_id);

alter table private.gcse_interventions enable row level security;
alter table private.gcse_intervention_targets enable row level security;
alter table private.gcse_intervention_keys enable row level security;
alter table private.gcse_intervention_attempts enable row level security;

revoke all on table private.gcse_interventions from public,anon,authenticated;
revoke all on table private.gcse_intervention_targets from public,anon,authenticated;
revoke all on table private.gcse_intervention_keys from public,anon,authenticated;
revoke all on table private.gcse_intervention_attempts from public,anon,authenticated;

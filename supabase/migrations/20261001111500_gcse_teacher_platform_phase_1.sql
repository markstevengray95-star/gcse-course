alter table public.gcse_profiles
  add column if not exists role text not null default 'student';

alter table public.gcse_profiles
  drop constraint if exists gcse_profiles_role_check;
alter table public.gcse_profiles
  add constraint gcse_profiles_role_check
  check (role in ('student','teacher','school_admin','platform_admin'));

update public.gcse_profiles
set role = 'platform_admin'
where is_admin = true and role <> 'platform_admin';

drop policy if exists gcse_profiles_insert_own_free on public.gcse_profiles;
create policy gcse_profiles_insert_own_free
on public.gcse_profiles for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and plan = 'free'
  and subscription_status = 'free'
  and trial_ends_at is null
  and is_admin = false
  and role = 'student'
  and stripe_customer_id is null
  and stripe_subscription_id is null
  and stripe_price_id is null
);

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.gcse_has_teacher_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gcse_profiles p
    where p.user_id = (select auth.uid())
      and (
        p.is_admin
        or p.role in ('teacher','school_admin','platform_admin')
        or (
          lower(coalesce(p.plan,'free')) in ('teacher','school')
          and (
            lower(coalesce(p.subscription_status,'free')) = 'active'
            or (
              lower(coalesce(p.subscription_status,'free')) = 'trialing'
              and p.trial_ends_at is not null
              and p.trial_ends_at > now()
            )
          )
        )
      )
  );
$$;
revoke all on function private.gcse_has_teacher_access() from public;
grant execute on function private.gcse_has_teacher_access() to authenticated;

create table if not exists public.gcse_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  year_group text not null default 'Year 10' check (char_length(trim(year_group)) between 1 and 40),
  subject text not null default 'science' check (subject in ('science','biology','chemistry','physics')),
  course_type text not null default 'combined' check (course_type in ('combined','triple','mixed')),
  join_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(join_code)
);

create table if not exists public.gcse_class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,
  student_email text not null check (position('@' in student_email) > 1),
  student_email_key text generated always as (lower(trim(student_email))) stored,
  display_name text,
  status text not null default 'invited' check (status in ('invited','joined')),
  source text not null default 'manual' check (source in ('manual','csv','join_code')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, student_email_key),
  unique(class_id, student_id)
);

create index if not exists gcse_classes_teacher_id_idx on public.gcse_classes(teacher_id);
create index if not exists gcse_classes_join_code_idx on public.gcse_classes(join_code);
create index if not exists gcse_class_members_teacher_id_idx on public.gcse_class_members(teacher_id);
create index if not exists gcse_class_members_student_id_idx on public.gcse_class_members(student_id);
create index if not exists gcse_class_members_class_id_idx on public.gcse_class_members(class_id);

alter table public.gcse_classes enable row level security;
alter table public.gcse_class_members enable row level security;
revoke all on table public.gcse_classes from anon, authenticated;
revoke all on table public.gcse_class_members from anon, authenticated;
grant select, insert, update, delete on table public.gcse_classes to authenticated;
grant select, insert, update, delete on table public.gcse_class_members to authenticated;

create policy gcse_classes_select_teacher_or_member on public.gcse_classes for select to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (
    select 1 from public.gcse_class_members m
    where m.class_id = gcse_classes.id
      and m.student_id = (select auth.uid())
  )
);
create policy gcse_classes_insert_teacher on public.gcse_classes for insert to authenticated
with check (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_classes_update_teacher on public.gcse_classes for update to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()))
with check (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_classes_delete_teacher on public.gcse_classes for delete to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

create policy gcse_class_members_select_teacher_or_self on public.gcse_class_members for select to authenticated
using (teacher_id = (select auth.uid()) or student_id = (select auth.uid()));
create policy gcse_class_members_insert_teacher on public.gcse_class_members for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (select private.gcse_has_teacher_access())
  and exists (
    select 1 from public.gcse_classes c
    where c.id = class_id and c.teacher_id = (select auth.uid()) and c.archived = false
  )
);
create policy gcse_class_members_update_teacher on public.gcse_class_members for update to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()))
with check (
  teacher_id = (select auth.uid())
  and (select private.gcse_has_teacher_access())
  and exists (
    select 1 from public.gcse_classes c
    where c.id = class_id and c.teacher_id = (select auth.uid())
  )
);
create policy gcse_class_members_delete_teacher on public.gcse_class_members for delete to authenticated
using (teacher_id = (select auth.uid()) and (select private.gcse_has_teacher_access()));

create or replace function public.gcse_subscription_entitlements(p public.gcse_profiles)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with normalized as (
  select
    case
      when p.is_admin or p.role in ('teacher','school_admin','platform_admin') then 'teacher'
      when lower(coalesce(p.plan,'free')) in ('teacher','school') then 'teacher'
      when lower(coalesce(p.plan,'free')) in ('pro','premium') then 'pro'
      when lower(coalesce(p.plan,'free')) in ('plus','full','full_course','fullcourse') then 'plus'
      else 'free'
    end as plan_name,
    (
      p.is_admin
      or p.role in ('teacher','school_admin','platform_admin')
      or (lower(coalesce(p.subscription_status,'free')) = 'active' and lower(coalesce(p.plan,'free')) <> 'free')
      or (lower(coalesce(p.subscription_status,'free')) = 'trialing' and p.trial_ends_at is not null and p.trial_ends_at > now())
    ) as paid_access
)
select jsonb_build_object(
  'plan', n.plan_name,
  'access_active', (p.is_admin or p.role in ('teacher','school_admin','platform_admin') or n.paid_access),
  'is_admin', coalesce(p.is_admin,false),
  'role', coalesce(p.role,'student'),
  'free_preview', true,
  'full_course', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'textbook', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'notebook', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'simulations', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'presentations', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'progress_tools', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'revision_tools', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'required_practicals', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'exam_tools', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'exam_marker', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'question_generator', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'ai_coach', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'auto_marking', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'mastery_assessments', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'expert_challenges', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'advanced_progression', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'teacher_tools', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'teaching_plans', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'differentiation', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'classroom_controls', (p.is_admin or (n.paid_access and n.plan_name = 'teacher'))
)
from normalized n;
$$;
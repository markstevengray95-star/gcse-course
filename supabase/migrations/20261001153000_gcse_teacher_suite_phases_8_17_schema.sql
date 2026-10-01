-- Teacher Platform phases 8-17 schema.
-- Mirrors the production migration applied on 2026-10-01.

create or replace function private.gcse_has_school_admin_access()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gcse_profiles p where p.user_id=(select auth.uid()) and (p.is_admin or p.role in ('school_admin','platform_admin')));
$$;
revoke all on function private.gcse_has_school_admin_access() from public,anon;
grant execute on function private.gcse_has_school_admin_access() to authenticated;

create table if not exists public.gcse_live_classroom_sessions(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade, topic_id text,
  title text not null check(char_length(trim(title)) between 1 and 160), join_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  status text not null default 'live' check(status in ('live','ended')), current_activity text not null default 'welcome',
  activity_payload jsonb not null default '{}'::jsonb, started_at timestamptz not null default now(), ended_at timestamptz, updated_at timestamptz not null default now(), unique(join_code)
);
create table if not exists public.gcse_live_classroom_responses(
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.gcse_live_classroom_sessions(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade, teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade, prompt_id text not null,
  response_text text not null default '' check(char_length(response_text)<=2000), response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(session_id,student_id,prompt_id)
);
create table if not exists public.gcse_teacher_resources(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.gcse_classes(id) on delete set null, topic_id text,
  resource_type text not null check(resource_type in ('retrieval','worksheet','exit_ticket','homework','practical','revision','custom')),
  title text not null check(char_length(trim(title)) between 1 and 160), content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gcse_lesson_plans(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.gcse_classes(id) on delete set null, topic_id text,
  lesson_title text not null check(char_length(trim(lesson_title)) between 1 and 180), duration_minutes integer not null default 55 check(duration_minutes between 10 and 180),
  objectives jsonb not null default '[]'::jsonb, lesson_sequence jsonb not null default '[]'::jsonb, resource_ids uuid[] not null default '{}', teacher_notes text not null default '',
  status text not null default 'draft' check(status in ('draft','ready','taught')), planned_for date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gcse_presentation_sessions(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.gcse_classes(id) on delete cascade, topic_id text, lesson_title text,
  status text not null default 'live' check(status in ('live','ended')), slide_index integer not null default 0 check(slide_index>=0),
  display_mode text not null default 'normal' check(display_mode in ('normal','blackout','question','answer')), timer_ends_at timestamptz,
  presenter_payload jsonb not null default '{}'::jsonb, started_at timestamptz not null default now(), ended_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.gcse_teacher_reports(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  report_type text not null default 'class_progress' check(report_type in ('class_progress','assessment','homework','intervention')),
  title text not null, report_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists private.gcse_parent_summaries(
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade, student_id uuid not null references auth.users(id) on delete cascade,
  summary_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.gcse_departments(
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 2 and 120), description text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gcse_department_members(
  department_id uuid not null references public.gcse_departments(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'teacher' check(role in ('owner','lead','teacher')), joined_at timestamptz not null default now(), primary key(department_id,user_id)
);
create table if not exists public.gcse_collaboration_items(
  id uuid primary key default gen_random_uuid(), department_id uuid not null references public.gcse_departments(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade, item_type text not null default 'note' check(item_type in ('note','resource','lesson_plan','strategy')),
  title text not null check(char_length(trim(title)) between 1 and 160), content jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gcse_collaboration_comments(
  id uuid primary key default gen_random_uuid(), item_id uuid not null references public.gcse_collaboration_items(id) on delete cascade,
  department_id uuid not null references public.gcse_departments(id) on delete cascade, author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(trim(body)) between 1 and 2000), created_at timestamptz not null default now()
);
create table if not exists public.gcse_schools(
  id uuid primary key default gen_random_uuid(), owner_admin_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 2 and 160), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gcse_school_members(
  school_id uuid not null references public.gcse_schools(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'teacher' check(role in ('admin','department_lead','teacher')), joined_at timestamptz not null default now(), primary key(school_id,user_id)
);

create index if not exists gcse_live_sessions_teacher_idx on public.gcse_live_classroom_sessions(teacher_id,status,started_at desc);
create index if not exists gcse_live_sessions_class_idx on public.gcse_live_classroom_sessions(class_id,status);
create index if not exists gcse_live_responses_session_idx on public.gcse_live_classroom_responses(session_id,created_at);
create index if not exists gcse_live_responses_student_idx on public.gcse_live_classroom_responses(student_id,session_id);
create index if not exists gcse_teacher_resources_teacher_idx on public.gcse_teacher_resources(teacher_id,created_at desc);
create index if not exists gcse_lesson_plans_teacher_idx on public.gcse_lesson_plans(teacher_id,planned_for,status);
create index if not exists gcse_presentation_sessions_teacher_idx on public.gcse_presentation_sessions(teacher_id,status,started_at desc);
create index if not exists gcse_teacher_reports_teacher_idx on public.gcse_teacher_reports(teacher_id,class_id,created_at desc);
create index if not exists gcse_parent_summaries_teacher_idx on private.gcse_parent_summaries(teacher_id,class_id,created_at desc);
create index if not exists gcse_department_members_user_idx on public.gcse_department_members(user_id,department_id);
create index if not exists gcse_collaboration_items_department_idx on public.gcse_collaboration_items(department_id,created_at desc);
create index if not exists gcse_collaboration_comments_item_idx on public.gcse_collaboration_comments(item_id,created_at);
create index if not exists gcse_school_members_user_idx on public.gcse_school_members(user_id,school_id);

create or replace function private.gcse_is_department_member(p_department_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gcse_department_members m where m.department_id=p_department_id and m.user_id=(select auth.uid()));
$$;
create or replace function private.gcse_is_department_admin(p_department_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gcse_department_members m where m.department_id=p_department_id and m.user_id=(select auth.uid()) and m.role in ('owner','lead'));
$$;
create or replace function private.gcse_is_school_member(p_school_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gcse_school_members m where m.school_id=p_school_id and m.user_id=(select auth.uid()));
$$;
create or replace function private.gcse_is_school_admin(p_school_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.gcse_school_members m where m.school_id=p_school_id and m.user_id=(select auth.uid()) and m.role='admin') or (select private.gcse_has_school_admin_access());
$$;
revoke all on function private.gcse_is_department_member(uuid) from public,anon;
revoke all on function private.gcse_is_department_admin(uuid) from public,anon;
revoke all on function private.gcse_is_school_member(uuid) from public,anon;
revoke all on function private.gcse_is_school_admin(uuid) from public,anon;
grant execute on function private.gcse_is_department_member(uuid) to authenticated;
grant execute on function private.gcse_is_department_admin(uuid) to authenticated;
grant execute on function private.gcse_is_school_member(uuid) to authenticated;
grant execute on function private.gcse_is_school_admin(uuid) to authenticated;

alter table public.gcse_live_classroom_sessions enable row level security;
alter table public.gcse_live_classroom_responses enable row level security;
alter table public.gcse_teacher_resources enable row level security;
alter table public.gcse_lesson_plans enable row level security;
alter table public.gcse_presentation_sessions enable row level security;
alter table public.gcse_teacher_reports enable row level security;
alter table private.gcse_parent_summaries enable row level security;
alter table public.gcse_departments enable row level security;
alter table public.gcse_department_members enable row level security;
alter table public.gcse_collaboration_items enable row level security;
alter table public.gcse_collaboration_comments enable row level security;
alter table public.gcse_schools enable row level security;
alter table public.gcse_school_members enable row level security;

revoke all on table private.gcse_parent_summaries from public,anon,authenticated;
revoke all on table public.gcse_live_classroom_sessions from anon;
revoke all on table public.gcse_live_classroom_responses from anon;
revoke all on table public.gcse_teacher_resources from anon;
revoke all on table public.gcse_lesson_plans from anon;
revoke all on table public.gcse_presentation_sessions from anon;
revoke all on table public.gcse_teacher_reports from anon;
revoke all on table public.gcse_departments from anon;
revoke all on table public.gcse_department_members from anon;
revoke all on table public.gcse_collaboration_items from anon;
revoke all on table public.gcse_collaboration_comments from anon;
revoke all on table public.gcse_schools from anon;
revoke all on table public.gcse_school_members from anon;

grant select,insert,update,delete on public.gcse_live_classroom_sessions to authenticated;
grant select,insert,update,delete on public.gcse_live_classroom_responses to authenticated;
grant select,insert,update,delete on public.gcse_teacher_resources to authenticated;
grant select,insert,update,delete on public.gcse_lesson_plans to authenticated;
grant select,insert,update,delete on public.gcse_presentation_sessions to authenticated;
grant select,insert,delete on public.gcse_teacher_reports to authenticated;
grant select,insert,update,delete on public.gcse_departments to authenticated;
grant select,insert,update,delete on public.gcse_department_members to authenticated;
grant select,insert,update,delete on public.gcse_collaboration_items to authenticated;
grant select,insert,delete on public.gcse_collaboration_comments to authenticated;
grant select,insert,update,delete on public.gcse_schools to authenticated;
grant select,insert,update,delete on public.gcse_school_members to authenticated;

create policy gcse_live_sessions_teacher_manage on public.gcse_live_classroom_sessions for all to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())) with check(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_live_sessions_student_read on public.gcse_live_classroom_sessions for select to authenticated using(status='live' and exists(select 1 from public.gcse_class_members m where m.class_id=gcse_live_classroom_sessions.class_id and m.student_id=(select auth.uid()) and m.status='joined'));
create policy gcse_live_responses_teacher_read on public.gcse_live_classroom_responses for select to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_live_responses_student_read on public.gcse_live_classroom_responses for select to authenticated using(student_id=(select auth.uid()));
create policy gcse_live_responses_student_insert on public.gcse_live_classroom_responses for insert to authenticated with check(student_id=(select auth.uid()) and exists(select 1 from public.gcse_live_classroom_sessions s join public.gcse_class_members m on m.class_id=s.class_id where s.id=session_id and s.status='live' and m.student_id=(select auth.uid()) and m.status='joined'));
create policy gcse_live_responses_student_update on public.gcse_live_classroom_responses for update to authenticated using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()));
create policy gcse_teacher_resources_owner on public.gcse_teacher_resources for all to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())) with check(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_lesson_plans_owner on public.gcse_lesson_plans for all to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())) with check(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_presentation_teacher_manage on public.gcse_presentation_sessions for all to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())) with check(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_presentation_student_read on public.gcse_presentation_sessions for select to authenticated using(status='live' and class_id is not null and exists(select 1 from public.gcse_class_members m where m.class_id=gcse_presentation_sessions.class_id and m.student_id=(select auth.uid()) and m.status='joined'));
create policy gcse_teacher_reports_owner on public.gcse_teacher_reports for all to authenticated using(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access())) with check(teacher_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_departments_member_read on public.gcse_departments for select to authenticated using((select private.gcse_is_department_member(id)));
create policy gcse_departments_teacher_create on public.gcse_departments for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.gcse_has_teacher_access()));
create policy gcse_departments_admin_update on public.gcse_departments for update to authenticated using((select private.gcse_is_department_admin(id))) with check((select private.gcse_is_department_admin(id)));
create policy gcse_departments_admin_delete on public.gcse_departments for delete to authenticated using((select private.gcse_is_department_admin(id)));
create policy gcse_department_members_read on public.gcse_department_members for select to authenticated using((select private.gcse_is_department_member(department_id)));
create policy gcse_department_members_admin_insert on public.gcse_department_members for insert to authenticated with check((select private.gcse_is_department_admin(department_id)) or (user_id=(select auth.uid()) and role='owner' and exists(select 1 from public.gcse_departments d where d.id=department_id and d.owner_id=(select auth.uid()))));
create policy gcse_department_members_admin_update on public.gcse_department_members for update to authenticated using((select private.gcse_is_department_admin(department_id))) with check((select private.gcse_is_department_admin(department_id)));
create policy gcse_department_members_admin_delete on public.gcse_department_members for delete to authenticated using((select private.gcse_is_department_admin(department_id)));
create policy gcse_collaboration_items_member_read on public.gcse_collaboration_items for select to authenticated using((select private.gcse_is_department_member(department_id)));
create policy gcse_collaboration_items_member_insert on public.gcse_collaboration_items for insert to authenticated with check(author_id=(select auth.uid()) and (select private.gcse_is_department_member(department_id)));
create policy gcse_collaboration_items_author_update on public.gcse_collaboration_items for update to authenticated using(author_id=(select auth.uid()) or (select private.gcse_is_department_admin(department_id))) with check(author_id=(select auth.uid()) or (select private.gcse_is_department_admin(department_id)));
create policy gcse_collaboration_items_author_delete on public.gcse_collaboration_items for delete to authenticated using(author_id=(select auth.uid()) or (select private.gcse_is_department_admin(department_id)));
create policy gcse_collaboration_comments_member_read on public.gcse_collaboration_comments for select to authenticated using((select private.gcse_is_department_member(department_id)));
create policy gcse_collaboration_comments_member_insert on public.gcse_collaboration_comments for insert to authenticated with check(author_id=(select auth.uid()) and (select private.gcse_is_department_member(department_id)));
create policy gcse_collaboration_comments_author_delete on public.gcse_collaboration_comments for delete to authenticated using(author_id=(select auth.uid()) or (select private.gcse_is_department_admin(department_id)));
create policy gcse_schools_member_read on public.gcse_schools for select to authenticated using((select private.gcse_is_school_member(id)) or (select private.gcse_has_school_admin_access()));
create policy gcse_schools_admin_create on public.gcse_schools for insert to authenticated with check(owner_admin_id=(select auth.uid()) and (select private.gcse_has_school_admin_access()));
create policy gcse_schools_admin_update on public.gcse_schools for update to authenticated using((select private.gcse_is_school_admin(id))) with check((select private.gcse_is_school_admin(id)));
create policy gcse_schools_admin_delete on public.gcse_schools for delete to authenticated using((select private.gcse_is_school_admin(id)));
create policy gcse_school_members_read on public.gcse_school_members for select to authenticated using(user_id=(select auth.uid()) or (select private.gcse_is_school_admin(school_id)));
create policy gcse_school_members_admin_insert on public.gcse_school_members for insert to authenticated with check((select private.gcse_is_school_admin(school_id)) or (user_id=(select auth.uid()) and role='admin' and exists(select 1 from public.gcse_schools s where s.id=school_id and s.owner_admin_id=(select auth.uid()))));
create policy gcse_school_members_admin_update on public.gcse_school_members for update to authenticated using((select private.gcse_is_school_admin(school_id))) with check((select private.gcse_is_school_admin(school_id)));
create policy gcse_school_members_admin_delete on public.gcse_school_members for delete to authenticated using((select private.gcse_is_school_admin(school_id)));
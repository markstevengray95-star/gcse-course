alter table public.gcse_assignments
  add column if not exists adaptive_mode boolean not null default false,
  add column if not exists adaptive_topic_id text,
  add column if not exists adaptive_support_max smallint not null default 49,
  add column if not exists adaptive_stretch_min smallint not null default 80,
  add column if not exists adaptive_config jsonb not null default '{}'::jsonb;

alter table public.gcse_assignments
  drop constraint if exists gcse_assignments_adaptive_thresholds_check;
alter table public.gcse_assignments
  add constraint gcse_assignments_adaptive_thresholds_check
  check (
    adaptive_support_max between 0 and 99
    and adaptive_stretch_min between 1 and 100
    and adaptive_support_max < adaptive_stretch_min
  );

alter table public.gcse_assignments
  drop constraint if exists gcse_assignments_adaptive_topic_check;
alter table public.gcse_assignments
  add constraint gcse_assignments_adaptive_topic_check
  check (not adaptive_mode or (adaptive_topic_id is not null and btrim(adaptive_topic_id) <> ''));

alter table public.gcse_assignment_targets
  add column if not exists adaptive_pathway text,
  add column if not exists adaptive_override boolean not null default false;

alter table public.gcse_assignment_targets
  drop constraint if exists gcse_assignment_targets_adaptive_pathway_check;
alter table public.gcse_assignment_targets
  add constraint gcse_assignment_targets_adaptive_pathway_check
  check (adaptive_pathway is null or adaptive_pathway in ('support','core','stretch'));

create table if not exists private.gcse_adaptive_homework_evidence (
  assignment_id uuid not null references public.gcse_assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  recommended_pathway text not null check (recommended_pathway in ('support','core','stretch')),
  final_pathway text not null check (final_pathway in ('support','core','stretch')),
  evidence_percent integer check (evidence_percent is null or evidence_percent between 0 and 100),
  evidence_source text not null default 'none' check (evidence_source in ('none','assessment','intervention')),
  evidence_at timestamptz,
  teacher_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create index if not exists gcse_adaptive_evidence_teacher_idx on private.gcse_adaptive_homework_evidence(teacher_id, created_at desc);
create index if not exists gcse_adaptive_evidence_class_idx on private.gcse_adaptive_homework_evidence(class_id, created_at desc);
create index if not exists gcse_adaptive_evidence_student_idx on private.gcse_adaptive_homework_evidence(student_id, created_at desc);

alter table private.gcse_adaptive_homework_evidence enable row level security;
revoke all on table private.gcse_adaptive_homework_evidence from public, anon, authenticated;

drop function if exists public.gcse_adaptive_homework_recommendations(uuid,text,integer,integer);
create function public.gcse_adaptive_homework_recommendations(
  p_class_id uuid,
  p_topic_id text,
  p_support_max integer default 49,
  p_stretch_min integer default 80
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then
    raise exception 'teacher_access_required';
  end if;
  if p_topic_id is null or btrim(p_topic_id) = '' then
    raise exception 'topic_required';
  end if;
  if p_support_max < 0 or p_support_max > 99 or p_stretch_min < 1 or p_stretch_min > 100 or p_support_max >= p_stretch_min then
    raise exception 'invalid_thresholds';
  end if;
  if not exists (
    select 1 from public.gcse_classes c
    where c.id = p_class_id and c.teacher_id = uid and not c.archived
  ) then
    raise exception 'class_not_found';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'studentId', x.student_id,
      'displayName', x.display_name,
      'email', x.student_email,
      'recommendedPathway', x.recommended_pathway,
      'evidencePercent', x.evidence_percent,
      'evidenceSource', x.evidence_source,
      'evidenceAt', x.evidence_at
    ) order by lower(coalesce(x.display_name, x.student_email, ''))
  ), '[]'::jsonb)
  into result
  from (
    select
      m.student_id,
      m.display_name,
      m.student_email,
      ev.evidence_percent,
      coalesce(ev.evidence_source, 'none') as evidence_source,
      ev.evidence_at,
      case
        when ev.evidence_percent is null then 'core'
        when ev.evidence_percent <= p_support_max then 'support'
        when ev.evidence_percent >= p_stretch_min then 'stretch'
        else 'core'
      end as recommended_pathway
    from public.gcse_class_members m
    left join lateral (
      select e.evidence_percent, e.evidence_source, e.evidence_at
      from (
        select
          ia.percent as evidence_percent,
          'intervention'::text as evidence_source,
          ia.submitted_at as evidence_at
        from private.gcse_intervention_attempts ia
        join private.gcse_interventions i on i.id = ia.intervention_id
        where ia.student_id = m.student_id
          and ia.status = 'submitted'
          and ia.percent is not null
          and i.class_id = p_class_id
          and i.teacher_id = uid
          and i.topic_id = p_topic_id

        union all

        select
          case
            when jsonb_exists(coalesce(aa.topic_breakdown, '{}'::jsonb), p_topic_id)
              and coalesce((aa.topic_breakdown -> p_topic_id ->> 'possible')::integer, 0) > 0
            then round(
              coalesce((aa.topic_breakdown -> p_topic_id ->> 'earned')::integer, 0) * 100.0 /
              nullif((aa.topic_breakdown -> p_topic_id ->> 'possible')::integer, 0)
            )::integer
            else aa.percent
          end as evidence_percent,
          'assessment'::text as evidence_source,
          aa.submitted_at as evidence_at
        from public.gcse_assessment_attempts aa
        join public.gcse_assessments a on a.id = aa.assessment_id
        where aa.student_id = m.student_id
          and aa.status = 'submitted'
          and aa.percent is not null
          and a.class_id = p_class_id
          and a.teacher_id = uid
          and p_topic_id = any(a.topic_ids)
      ) e
      where e.evidence_percent is not null
      order by e.evidence_at desc nulls last
      limit 1
    ) ev on true
    where m.class_id = p_class_id
      and m.teacher_id = uid
      and m.status = 'joined'
      and m.student_id is not null
  ) x;

  return result;
end;
$$;

drop function if exists public.gcse_create_adaptive_homework(uuid,text,jsonb);
create function public.gcse_create_adaptive_homework(
  p_class_id uuid,
  p_topic_id text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  assignment_id uuid;
  class_name text;
  homework_title text;
  topic_title text;
  teacher_instructions text;
  homework_status text;
  due_at timestamptz;
  available_from timestamptz;
  support_max integer;
  stretch_min integer;
  min_score integer;
  max_attempts integer;
  config jsonb;
  overrides jsonb;
  recommendations jsonb;
  student jsonb;
  student_id uuid;
  recommended text;
  final_path text;
  override_path text;
  is_override boolean;
  support_count integer := 0;
  core_count integer := 0;
  stretch_count integer := 0;
  assigned_count integer := 0;
begin
  if uid is null or not private.gcse_has_teacher_access() then
    raise exception 'teacher_access_required';
  end if;
  if p_topic_id is null or btrim(p_topic_id) = '' then
    raise exception 'topic_required';
  end if;
  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object'
     or octet_length(coalesce(p_payload, '{}'::jsonb)::text) > 100000 then
    raise exception 'invalid_payload';
  end if;

  select c.name into class_name
  from public.gcse_classes c
  where c.id = p_class_id and c.teacher_id = uid and not c.archived;
  if class_name is null then raise exception 'class_not_found'; end if;

  support_max := greatest(0, least(99, coalesce((p_payload ->> 'supportMax')::integer, 49)));
  stretch_min := greatest(1, least(100, coalesce((p_payload ->> 'stretchMin')::integer, 80)));
  if support_max >= stretch_min then raise exception 'invalid_thresholds'; end if;

  homework_status := lower(coalesce(nullif(p_payload ->> 'status', ''), 'published'));
  if homework_status not in ('draft','published') then raise exception 'invalid_status'; end if;

  available_from := coalesce(nullif(p_payload ->> 'availableFrom','')::timestamptz, now());
  due_at := coalesce(nullif(p_payload ->> 'dueAt','')::timestamptz, now() + interval '3 days');
  if due_at <= available_from then raise exception 'invalid_due_date'; end if;

  topic_title := left(btrim(coalesce(nullif(p_payload ->> 'topicTitle',''), p_topic_id)), 160);
  homework_title := left(btrim(coalesce(nullif(p_payload ->> 'title',''), topic_title || ' personalised practice')), 160);
  if homework_title = '' then raise exception 'invalid_title'; end if;

  teacher_instructions := left(btrim(coalesce(p_payload ->> 'instructions','')), 4000);
  config := coalesce(p_payload -> 'config', '{}'::jsonb);
  if jsonb_typeof(config) <> 'object' or octet_length(config::text) > 25000 then raise exception 'invalid_adaptive_config'; end if;
  if not (config ? 'support' and config ? 'core' and config ? 'stretch') then raise exception 'adaptive_routes_required'; end if;

  overrides := coalesce(p_payload -> 'overrides', '{}'::jsonb);
  if jsonb_typeof(overrides) <> 'object' then raise exception 'invalid_overrides'; end if;

  min_score := case when nullif(p_payload ->> 'minScore','') is null then null else greatest(0, least(100, (p_payload ->> 'minScore')::integer)) end;
  max_attempts := case when nullif(p_payload ->> 'maxAttempts','') is null then null else greatest(1, least(20, (p_payload ->> 'maxAttempts')::integer)) end;

  recommendations := public.gcse_adaptive_homework_recommendations(p_class_id, p_topic_id, support_max, stretch_min);
  if jsonb_array_length(recommendations) = 0 then raise exception 'no_joined_students'; end if;

  insert into public.gcse_assignments(
    teacher_id,class_id,title,instructions,assignment_type,content_ref,content_item,audience_mode,
    due_at,available_from,status,min_score,max_attempts,adaptive_mode,adaptive_topic_id,
    adaptive_support_max,adaptive_stretch_min,adaptive_config
  ) values (
    uid,p_class_id,homework_title,teacher_instructions,'topic',p_topic_id,topic_title,'selected',
    due_at,available_from,homework_status,min_score,max_attempts,true,p_topic_id,
    support_max,stretch_min,config
  ) returning id into assignment_id;

  for student in select value from jsonb_array_elements(recommendations)
  loop
    student_id := (student ->> 'studentId')::uuid;
    recommended := coalesce(student ->> 'recommendedPathway','core');
    override_path := lower(coalesce(overrides ->> (student_id::text), ''));
    is_override := override_path in ('support','core','stretch');
    final_path := case when is_override then override_path else recommended end;

    insert into public.gcse_assignment_targets(
      assignment_id,class_id,teacher_id,student_id,adaptive_pathway,adaptive_override
    ) values (
      assignment_id,p_class_id,uid,student_id,final_path,is_override
    );

    insert into private.gcse_adaptive_homework_evidence(
      assignment_id,student_id,teacher_id,class_id,recommended_pathway,final_pathway,
      evidence_percent,evidence_source,evidence_at,teacher_override
    ) values (
      assignment_id,student_id,uid,p_class_id,recommended,final_path,
      case when student ->> 'evidencePercent' is null then null else (student ->> 'evidencePercent')::integer end,
      coalesce(student ->> 'evidenceSource','none'),
      case when student ->> 'evidenceAt' is null then null else (student ->> 'evidenceAt')::timestamptz end,
      is_override
    );

    assigned_count := assigned_count + 1;
    if final_path = 'support' then support_count := support_count + 1;
    elsif final_path = 'stretch' then stretch_count := stretch_count + 1;
    else core_count := core_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'assignmentId', assignment_id,
    'classId', p_class_id,
    'className', class_name,
    'topicId', p_topic_id,
    'topicTitle', topic_title,
    'title', homework_title,
    'status', homework_status,
    'assigned', assigned_count,
    'routes', jsonb_build_object('support',support_count,'core',core_count,'stretch',stretch_count)
  );
end;
$$;

drop function if exists public.gcse_teacher_adaptive_assignment(uuid);
create function public.gcse_teacher_adaptive_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if not exists (
    select 1 from public.gcse_assignments a
    where a.id=p_assignment_id and a.teacher_id=uid and a.adaptive_mode
  ) then raise exception 'adaptive_assignment_not_found'; end if;

  select jsonb_build_object(
    'assignmentId', a.id,
    'title', a.title,
    'classId', a.class_id,
    'topicId', a.adaptive_topic_id,
    'topicTitle', a.content_item,
    'status', a.status,
    'supportMax', a.adaptive_support_max,
    'stretchMin', a.adaptive_stretch_min,
    'config', a.adaptive_config,
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'studentId', e.student_id,
        'displayName', m.display_name,
        'email', m.student_email,
        'recommendedPathway', e.recommended_pathway,
        'pathway', e.final_pathway,
        'teacherOverride', e.teacher_override,
        'evidencePercent', e.evidence_percent,
        'evidenceSource', e.evidence_source,
        'evidenceAt', e.evidence_at,
        'submissionStatus', coalesce(s.status,'not_started'),
        'score', s.score,
        'maxScore', s.max_score,
        'submittedAt', s.submitted_at
      ) order by lower(coalesce(m.display_name,m.student_email,'')))
      from private.gcse_adaptive_homework_evidence e
      left join public.gcse_class_members m on m.class_id=e.class_id and m.student_id=e.student_id
      left join public.gcse_assignment_submissions s on s.assignment_id=e.assignment_id and s.student_id=e.student_id
      where e.assignment_id=a.id and e.teacher_id=uid
    ), '[]'::jsonb)
  ) into result
  from public.gcse_assignments a
  where a.id=p_assignment_id and a.teacher_id=uid;

  return result;
end;
$$;

drop function if exists public.gcse_set_adaptive_pathway(uuid,uuid,text);
create function public.gcse_set_adaptive_pathway(
  p_assignment_id uuid,
  p_student_id uuid,
  p_pathway text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  new_path text := lower(coalesce(p_pathway,''));
  recommended text;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if new_path not in ('support','core','stretch') then raise exception 'invalid_pathway'; end if;

  select e.recommended_pathway into recommended
  from private.gcse_adaptive_homework_evidence e
  join public.gcse_assignments a on a.id=e.assignment_id
  where e.assignment_id=p_assignment_id and e.student_id=p_student_id and e.teacher_id=uid
    and a.teacher_id=uid and a.adaptive_mode;
  if recommended is null then raise exception 'adaptive_target_not_found'; end if;

  update public.gcse_assignment_targets
  set adaptive_pathway=new_path, adaptive_override=(new_path <> recommended)
  where assignment_id=p_assignment_id and student_id=p_student_id and teacher_id=uid;

  update private.gcse_adaptive_homework_evidence
  set final_pathway=new_path, teacher_override=(new_path <> recommended), updated_at=now()
  where assignment_id=p_assignment_id and student_id=p_student_id and teacher_id=uid;

  return jsonb_build_object(
    'assignmentId',p_assignment_id,
    'studentId',p_student_id,
    'recommendedPathway',recommended,
    'pathway',new_path,
    'teacherOverride',(new_path <> recommended)
  );
end;
$$;

revoke execute on function public.gcse_adaptive_homework_recommendations(uuid,text,integer,integer) from public, anon;
revoke execute on function public.gcse_create_adaptive_homework(uuid,text,jsonb) from public, anon;
revoke execute on function public.gcse_teacher_adaptive_assignment(uuid) from public, anon;
revoke execute on function public.gcse_set_adaptive_pathway(uuid,uuid,text) from public, anon;

grant execute on function public.gcse_adaptive_homework_recommendations(uuid,text,integer,integer) to authenticated;
grant execute on function public.gcse_create_adaptive_homework(uuid,text,jsonb) to authenticated;
grant execute on function public.gcse_teacher_adaptive_assignment(uuid) to authenticated;
grant execute on function public.gcse_set_adaptive_pathway(uuid,uuid,text) to authenticated;
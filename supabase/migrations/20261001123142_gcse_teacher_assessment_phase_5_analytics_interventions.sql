-- Teacher Platform Phase 5: assessment analytics, intervention signals and auditable mark review.
-- This repository copy is consolidated to the final Phase 5 function definitions after live validation fixes.

create table if not exists public.gcse_assessment_mark_adjustments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.gcse_assessments(id) on delete cascade,
  attempt_id uuid not null references public.gcse_assessment_attempts(id) on delete cascade,
  class_id uuid not null references public.gcse_classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 220),
  auto_mark smallint not null check (auto_mark >= 0),
  previous_mark smallint not null check (previous_mark >= 0),
  new_mark smallint not null check (new_mark >= 0),
  max_marks smallint not null check (max_marks >= 1 and max_marks <= 12),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  created_at timestamptz not null default now()
);
create index if not exists gcse_assessment_mark_adjustments_assessment_idx on public.gcse_assessment_mark_adjustments(assessment_id,created_at desc);
create index if not exists gcse_assessment_mark_adjustments_attempt_idx on public.gcse_assessment_mark_adjustments(attempt_id,created_at desc);
alter table public.gcse_assessment_mark_adjustments enable row level security;
revoke all on table public.gcse_assessment_mark_adjustments from public,anon,authenticated;
grant all on table public.gcse_assessment_mark_adjustments to service_role;

create or replace function public.gcse_assessment_analytics_base(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid:=auth.uid(); a public.gcse_assessments%rowtype;
  submitted_count int:=0; assigned_count int:=0;
  question_metrics jsonb:='[]'::jsonb; topic_metrics jsonb:='[]'::jsonb; misconceptions jsonb:='[]'::jsonb;
  interventions jsonb:='[]'::jsonb; student_rows jsonb:='[]'::jsonb; adjustments jsonb:='[]'::jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  select * into a from public.gcse_assessments where id=p_assessment_id and teacher_id=uid;
  if not found then raise exception 'assessment_not_found'; end if;
  select count(*) into submitted_count from public.gcse_assessment_attempts at where at.assessment_id=a.id and at.status='submitted';
  if a.audience_mode='selected' then
    select count(*) into assigned_count from public.gcse_assessment_targets t where t.assessment_id=a.id;
  else
    select count(*) into assigned_count from public.gcse_class_members m where m.class_id=a.class_id and m.status='joined' and m.student_id is not null;
  end if;

  with qs as (select q.value q from jsonb_array_elements(a.question_payload) q(value)),
  submitted as (select at.* from public.gcse_assessment_attempts at where at.assessment_id=a.id and at.status='submitted'),
  metrics as (
    select q->>'id' question_id,q->>'number' question_number,q->>'prompt' prompt,q->>'topicId' topic_id,q->>'topicCode' topic_code,q->>'topicTitle' topic_title,
      greatest(1,coalesce((q->>'marks')::int,1)) max_marks,count(s.id)::int submissions,
      count(s.id) filter(where coalesce(trim(rv.item->>'answer'),'')<>'')::int answered,
      coalesce(sum(coalesce((rv.item->>'awarded')::int,0)),0)::int earned,
      count(s.id) filter(where coalesce((rv.item->>'awarded')::int,0)=greatest(1,coalesce((q->>'marks')::int,1)))::int full_marks,
      count(s.id) filter(where coalesce((rv.item->>'awarded')::int,0)=0)::int zero_marks,
      count(s.id) filter(where coalesce((rv.item->>'teacherAdjusted')::boolean,false))::int teacher_adjusted
    from qs left join submitted s on true
    left join lateral (select r.value item from jsonb_array_elements(coalesce(s.review,'[]'::jsonb)) r(value) where r.value->>'id'=q->>'id' limit 1) rv on true
    group by q
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'questionId',question_id,'number',question_number,'prompt',prompt,'topicId',topic_id,'topicCode',topic_code,'topicTitle',topic_title,'marks',max_marks,
    'submissions',submissions,'answered',answered,'earned',earned,'possible',max_marks*submissions,
    'successRate',case when submissions>0 then round(earned*100.0/nullif(max_marks*submissions,0))::int else null end,
    'fullMarkRate',case when submissions>0 then round(full_marks*100.0/submissions)::int else null end,
    'zeroMarkRate',case when submissions>0 then round(zero_marks*100.0/submissions)::int else null end,
    'teacherAdjusted',teacher_adjusted
  ) order by coalesce(nullif(question_number,''),'999'),question_id),'[]'::jsonb) into question_metrics from metrics;

  with rows as (
    select rv.value->>'topicId' topic_id,rv.value->>'topicCode' topic_code,rv.value->>'topicTitle' topic_title,
      coalesce((rv.value->>'awarded')::int,0) awarded,greatest(1,coalesce((rv.value->>'marks')::int,1)) marks
    from public.gcse_assessment_attempts at cross join lateral jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) rv(value)
    where at.assessment_id=a.id and at.status='submitted'
  ), grouped as (
    select topic_id,max(topic_code) topic_code,max(topic_title) topic_title,sum(awarded)::int earned,sum(marks)::int possible,count(*)::int question_responses
    from rows where coalesce(topic_id,'')<>'' group by topic_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('topicId',topic_id,'topicCode',topic_code,'topicTitle',topic_title,'earned',earned,'possible',possible,
    'questionResponses',question_responses,'successRate',case when possible>0 then round(earned*100.0/possible)::int else null end)
    order by case when possible>0 then earned*1.0/possible else 1 end,topic_code),'[]'::jsonb) into topic_metrics from grouped;

  with missed as (
    select rv.value->>'id' question_id,rv.value->>'number' question_number,rv.value->>'prompt' prompt,rv.value->>'topicId' topic_id,
      rv.value->>'topicCode' topic_code,rv.value->>'topicTitle' topic_title,mp.value missed_point,at.student_id
    from public.gcse_assessment_attempts at
    cross join lateral jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) rv(value)
    cross join lateral jsonb_array_elements_text(coalesce(rv.value->'missedPoints','[]'::jsonb)) mp(value)
    where at.assessment_id=a.id and at.status='submitted'
  ), grouped as (
    select question_id,max(question_number) question_number,max(prompt) prompt,max(topic_id) topic_id,max(topic_code) topic_code,max(topic_title) topic_title,
      missed_point,count(*)::int missed_count,count(distinct student_id)::int student_count
    from missed where coalesce(trim(missed_point),'')<>'' group by question_id,missed_point
  )
  select coalesce(jsonb_agg(jsonb_build_object('questionId',question_id,'number',question_number,'prompt',prompt,'topicId',topic_id,'topicCode',topic_code,
    'topicTitle',topic_title,'markingPoint',missed_point,'missedCount',missed_count,'studentCount',student_count,
    'missRate',case when submitted_count>0 then round(missed_count*100.0/submitted_count)::int else null end)
    order by missed_count desc,topic_code,question_number),'[]'::jsonb) into misconceptions from grouped;

  with student_topic as (
    select at.student_id,rv.value->>'topicId' topic_id,max(rv.value->>'topicCode') topic_code,max(rv.value->>'topicTitle') topic_title,
      sum(coalesce((rv.value->>'awarded')::int,0))::int earned,sum(greatest(1,coalesce((rv.value->>'marks')::int,1)))::int possible
    from public.gcse_assessment_attempts at cross join lateral jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) rv(value)
    where at.assessment_id=a.id and at.status='submitted' and coalesce(rv.value->>'topicId','')<>''
    group by at.student_id,rv.value->>'topicId'
  ), weak as (
    select st.*,round(st.earned*100.0/nullif(st.possible,0))::int topic_percent from student_topic st where st.possible>0 and st.earned*100.0/st.possible<50
  ), grouped as (
    select w.topic_id,max(w.topic_code) topic_code,max(w.topic_title) topic_title,count(*)::int student_count,
      jsonb_agg(jsonb_build_object('studentId',w.student_id,'displayName',coalesce(nullif(m.display_name,''),split_part(m.student_email,'@',1),'Student'),
        'email',m.student_email,'earned',w.earned,'possible',w.possible,'percent',w.topic_percent)
        order by w.topic_percent,coalesce(m.display_name,m.student_email)) group_students
    from weak w left join public.gcse_class_members m on m.class_id=a.class_id and m.student_id=w.student_id group by w.topic_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('id','topic:'||topic_id,'topicId',topic_id,'topicCode',topic_code,'topicTitle',topic_title,
    'studentCount',student_count,'students',group_students,'evidenceRule','Below 50% on this topic in this assessment',
    'suggestedAction','Re-teach the key ideas, then use a short targeted retrieval and exam-question check.') order by student_count desc,topic_code),'[]'::jsonb)
    into interventions from grouped;

  select coalesce(jsonb_agg(jsonb_build_object('attemptId',at.id,'studentId',at.student_id,
    'displayName',coalesce(nullif(m.display_name,''),split_part(m.student_email,'@',1),'Student'),'email',m.student_email,
    'score',at.score,'totalMarks',at.total_marks,'percent',at.percent,'submittedAt',at.submitted_at,'timedOut',at.timed_out,'review',at.review,
    'adjustmentCount',(select count(*) from public.gcse_assessment_mark_adjustments adj where adj.attempt_id=at.id))
    order by at.percent,coalesce(m.display_name,m.student_email)),'[]'::jsonb) into student_rows
  from public.gcse_assessment_attempts at left join public.gcse_class_members m on m.class_id=a.class_id and m.student_id=at.student_id
  where at.assessment_id=a.id and at.status='submitted';

  select coalesce(jsonb_agg(jsonb_build_object('id',adj.id,'attemptId',adj.attempt_id,'studentId',adj.student_id,'questionId',adj.question_id,
    'autoMark',adj.auto_mark,'previousMark',adj.previous_mark,'newMark',adj.new_mark,'maxMarks',adj.max_marks,'reason',adj.reason,'createdAt',adj.created_at)
    order by adj.created_at desc),'[]'::jsonb) into adjustments
  from public.gcse_assessment_mark_adjustments adj where adj.assessment_id=a.id and adj.teacher_id=uid;

  return jsonb_build_object('assessment',jsonb_build_object('id',a.id,'title',a.title,'classId',a.class_id,'subject',a.subject,'paper',a.paper,
    'qualification',a.qualification,'tier',a.tier,'totalMarks',a.total_marks,'assigned',assigned_count,'submitted',submitted_count),
    'questions',question_metrics,'topics',topic_metrics,'misconceptions',misconceptions,'interventions',interventions,'students',student_rows,'adjustments',adjustments);
end;$$;

revoke all on function public.gcse_assessment_analytics_base(uuid) from public,anon,authenticated;

create or replace function public.gcse_assessment_analytics(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare raw jsonb; filtered_misconceptions jsonb;
begin
  raw:=public.gcse_assessment_analytics_base(p_assessment_id);
  select coalesce(jsonb_agg(m.value),'[]'::jsonb) into filtered_misconceptions
  from jsonb_array_elements(coalesce(raw->'misconceptions','[]'::jsonb)) m(value)
  where not exists(select 1 from jsonb_array_elements(coalesce(raw->'questions','[]'::jsonb)) q(value)
    where q.value->>'questionId'=m.value->>'questionId' and coalesce((q.value->>'teacherAdjusted')::int,0)>0);
  return jsonb_set(raw,'{misconceptions}',filtered_misconceptions,true);
end;$$;

create or replace function public.gcse_adjust_assessment_mark(p_attempt_id uuid,p_question_id text,p_new_mark int,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid(); at public.gcse_assessment_attempts%rowtype; a public.gcse_assessments%rowtype; item jsonb; updated_item jsonb;
  updated_review jsonb:='[]'::jsonb; target jsonb; target_max_marks int; item_max_marks int; item_awarded int; previous_mark int; auto_mark int;
  total_score int:=0; calc_total_marks int:=0; pct int:=0; topic_id text; topic_code text; topic_title text; current_topic jsonb;
  breakdown jsonb:='{}'::jsonb; adjustment_id uuid; clean_reason text:=trim(coalesce(p_reason,''));
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_question_id is null or trim(p_question_id)='' then raise exception 'question_required'; end if;
  if char_length(clean_reason)<3 or char_length(clean_reason)>500 then raise exception 'adjustment_reason_required'; end if;
  select * into at from public.gcse_assessment_attempts where id=p_attempt_id and teacher_id=uid;
  if not found then raise exception 'attempt_not_found'; end if;
  if at.status<>'submitted' then raise exception 'attempt_not_submitted'; end if;
  select * into a from public.gcse_assessments where id=at.assessment_id and teacher_id=uid;
  if not found then raise exception 'assessment_not_found'; end if;
  select r.value into target from jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) r(value) where r.value->>'id'=p_question_id limit 1;
  if target is null then raise exception 'question_not_found'; end if;
  target_max_marks:=greatest(1,coalesce((target->>'marks')::int,1));
  previous_mark:=greatest(0,least(target_max_marks,coalesce((target->>'awarded')::int,0)));
  auto_mark:=greatest(0,least(target_max_marks,coalesce((target->>'autoAwarded')::int,(target->>'awarded')::int,0)));
  if p_new_mark<0 or p_new_mark>target_max_marks then raise exception 'invalid_mark'; end if;
  if p_new_mark=previous_mark then raise exception 'mark_unchanged'; end if;
  for item in select value from jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) loop
    if item->>'id'=p_question_id then
      updated_item:=jsonb_set(item,'{autoAwarded}',to_jsonb(auto_mark),true);
      updated_item:=jsonb_set(updated_item,'{awarded}',to_jsonb(p_new_mark),true);
      updated_item:=jsonb_set(updated_item,'{teacherAdjusted}','true'::jsonb,true);
      updated_item:=jsonb_set(updated_item,'{teacherAdjustment}',jsonb_build_object('teacherId',uid,'adjustedAt',now(),'reason',clean_reason,
        'autoMark',auto_mark,'previousMark',previous_mark,'newMark',p_new_mark),true);
      updated_review:=updated_review||jsonb_build_array(updated_item);
    else updated_review:=updated_review||jsonb_build_array(item); end if;
  end loop;
  for item in select value from jsonb_array_elements(updated_review) loop
    item_max_marks:=greatest(1,coalesce((item->>'marks')::int,1)); item_awarded:=greatest(0,least(item_max_marks,coalesce((item->>'awarded')::int,0)));
    total_score:=total_score+item_awarded; calc_total_marks:=calc_total_marks+item_max_marks;
    topic_id:=coalesce(item->>'topicId','unknown');topic_code:=coalesce(item->>'topicCode',topic_id);topic_title:=coalesce(item->>'topicTitle',topic_code);
    current_topic:=coalesce(breakdown->topic_id,jsonb_build_object('earned',0,'possible',0,'topicCode',topic_code,'topicTitle',topic_title));
    breakdown:=jsonb_set(breakdown,array[topic_id],jsonb_build_object('earned',coalesce((current_topic->>'earned')::int,0)+item_awarded,
      'possible',coalesce((current_topic->>'possible')::int,0)+item_max_marks,'topicCode',topic_code,'topicTitle',topic_title),true);
  end loop;
  pct:=case when calc_total_marks>0 then round(total_score*100.0/calc_total_marks)::int else 0 end;
  insert into public.gcse_assessment_mark_adjustments(assessment_id,attempt_id,class_id,teacher_id,student_id,question_id,auto_mark,previous_mark,new_mark,max_marks,reason)
    values(at.assessment_id,at.id,at.class_id,uid,at.student_id,p_question_id,auto_mark,previous_mark,p_new_mark,target_max_marks,clean_reason) returning id into adjustment_id;
  update public.gcse_assessment_attempts set review=updated_review,score=total_score,total_marks=calc_total_marks,percent=pct,topic_breakdown=breakdown
    where id=at.id returning * into at;
  return jsonb_build_object('adjustmentId',adjustment_id,'attempt',jsonb_build_object('id',at.id,'assessment_id',at.assessment_id,'student_id',at.student_id,
    'score',at.score,'total_marks',at.total_marks,'percent',at.percent,'topic_breakdown',at.topic_breakdown,'review',at.review,'updated_at',at.updated_at));
end;$$;

create or replace function public.gcse_assessment_adjustment_history(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if not exists(select 1 from public.gcse_assessment_attempts at where at.id=p_attempt_id and at.teacher_id=uid) then raise exception 'attempt_not_found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',adj.id,'assessmentId',adj.assessment_id,'attemptId',adj.attempt_id,'studentId',adj.student_id,
    'questionId',adj.question_id,'autoMark',adj.auto_mark,'previousMark',adj.previous_mark,'newMark',adj.new_mark,'maxMarks',adj.max_marks,
    'reason',adj.reason,'createdAt',adj.created_at) order by adj.created_at desc),'[]'::jsonb) into result
  from public.gcse_assessment_mark_adjustments adj where adj.attempt_id=p_attempt_id and adj.teacher_id=uid;
  return result;
end;$$;

revoke all on function public.gcse_assessment_analytics(uuid) from public,anon;
revoke all on function public.gcse_adjust_assessment_mark(uuid,text,int,text) from public,anon;
revoke all on function public.gcse_assessment_adjustment_history(uuid) from public,anon;
grant execute on function public.gcse_assessment_analytics(uuid) to authenticated;
grant execute on function public.gcse_adjust_assessment_mark(uuid,text,int,text) to authenticated;
grant execute on function public.gcse_assessment_adjustment_history(uuid) to authenticated;
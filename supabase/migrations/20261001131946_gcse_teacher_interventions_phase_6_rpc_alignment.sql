-- Align Phase 6 RPC payloads and duplicate protection with the client implementation.

create or replace function private.gcse_grade_intervention_target(p_target_id uuid,p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  tasks jsonb;
  keys jsonb;
  key_item jsonb;
  task_item jsonb;
  answer text;
  qtype text;
  correct text;
  max_marks int;
  awarded int;
  total int:=0;
  score int:=0;
  points jsonb;
  point jsonb;
  matched_points jsonb;
  missed_points jsonb;
  review jsonb:='[]'::jsonb;
  pct int;
begin
  if jsonb_typeof(coalesce(p_answers,'{}'::jsonb))<>'object'
     or octet_length(coalesce(p_answers,'{}'::jsonb)::text)>250000 then
    raise exception 'invalid_answers';
  end if;
  select t.task_payload,k.marking_payload into tasks,keys
  from private.gcse_intervention_targets t
  join private.gcse_intervention_keys k on k.target_id=t.id
  where t.id=p_target_id;
  if tasks is null or keys is null then raise exception 'intervention_key_missing'; end if;
  for key_item in select value from jsonb_array_elements(keys) loop
    select value into task_item from jsonb_array_elements(tasks)
    where value->>'id'=key_item->>'id' limit 1;
    if task_item is null then continue; end if;
    answer:=coalesce(p_answers->>(key_item->>'id'),'');
    qtype:=coalesce(key_item->>'type','short');
    correct:=coalesce(key_item->>'correct','');
    max_marks:=greatest(1,least(12,coalesce((key_item->>'marks')::int,1)));
    awarded:=0; matched_points:='[]'::jsonb; missed_points:='[]'::jsonb;
    points:=coalesce(key_item->'points','[]'::jsonb);
    if qtype='mcq' and correct<>'' then
      if private.gcse_assessment_clean_text(answer)=private.gcse_assessment_clean_text(correct) then awarded:=max_marks; end if;
      if awarded=max_marks then matched_points:=jsonb_build_array(correct); else missed_points:=jsonb_build_array(correct); end if;
    else
      for point in select value from jsonb_array_elements(points) loop
        if private.gcse_assessment_point_matches(answer,point#>>'{}') then matched_points:=matched_points||jsonb_build_array(point#>>'{}'); else missed_points:=missed_points||jsonb_build_array(point#>>'{}'); end if;
      end loop;
      if jsonb_array_length(points)>0 then awarded:=least(max_marks,jsonb_array_length(matched_points));
      elsif correct<>'' and private.gcse_assessment_point_matches(answer,correct) then awarded:=max_marks; matched_points:=jsonb_build_array(correct); end if;
    end if;
    score:=score+awarded; total:=total+max_marks;
    review:=review||jsonb_build_array(jsonb_build_object(
      'id',key_item->>'id','sourceQuestionId',key_item->>'sourceQuestionId','number',task_item->>'number',
      'prompt',task_item->>'prompt','answer',answer,'awarded',awarded,'marks',max_marks,
      'topicId',task_item->>'topicId','topicCode',task_item->>'topicCode','topicTitle',task_item->>'topicTitle',
      'markingPoints',points,'matchedPoints',matched_points,'missedPoints',missed_points,
      'correct',case when qtype='mcq' then correct else null end
    ));
  end loop;
  pct:=case when total>0 then round(score*100.0/total)::int else 0 end;
  return jsonb_build_object('score',score,'total_marks',total,'percent',pct,'review',review);
end;
$$;

create or replace function public.gcse_create_targeted_intervention(p_assessment_id uuid,p_topic_id text,p_options jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid:=auth.uid(); a public.gcse_assessments%rowtype; intervention_id uuid; assignment_id uuid;
  intervention_title text; intervention_status text; topic_code text; topic_title text; due_at timestamptz;
  target_score int; threshold_percent int:=50; max_questions int; student_count int:=0;
  at public.gcse_assessment_attempts%rowtype; baseline jsonb; baseline_earned int; baseline_possible int;
  baseline_percent int; support_level text; target_id uuid; review_item jsonb; key_item jsonb;
  assessment_keys jsonb; task_payload jsonb; marking_payload jsonb; selected_count int; item_no int;
  max_marks int; qtype text; prompt text; qid text; options jsonb; previous_answer text;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_topic_id is null or trim(p_topic_id)='' then raise exception 'topic_required'; end if;
  select * into a from public.gcse_assessments where id=p_assessment_id and teacher_id=uid;
  if not found then raise exception 'assessment_not_found'; end if;
  select q.value->>'topicCode',q.value->>'topicTitle' into topic_code,topic_title
  from jsonb_array_elements(a.question_payload) q(value) where q.value->>'topicId'=p_topic_id limit 1;
  if topic_code is null then raise exception 'topic_not_in_assessment'; end if;
  select k.marking_payload into assessment_keys from private.gcse_assessment_keys k where k.assessment_id=a.id and k.teacher_id=uid;
  if assessment_keys is null then raise exception 'assessment_key_missing'; end if;
  intervention_status:=lower(coalesce(p_options->>'status','published'));
  if intervention_status not in ('draft','published') then raise exception 'invalid_status'; end if;
  target_score:=greatest(0,least(100,coalesce((p_options->>'targetScore')::int,70)));
  max_questions:=greatest(1,least(5,coalesce((p_options->>'maxQuestions')::int,3)));
  due_at:=coalesce(nullif(p_options->>'dueAt','')::timestamptz,now()+interval '3 days');
  if due_at<=now() then raise exception 'invalid_due_date'; end if;
  intervention_title:=left(trim(coalesce(nullif(p_options->>'title',''),topic_code||' '||topic_title||' targeted follow-up')),160);
  if intervention_title='' then raise exception 'invalid_title'; end if;
  if exists(select 1 from private.gcse_interventions existing where existing.teacher_id=uid and existing.source_assessment_id=a.id and existing.topic_id=p_topic_id and existing.status in ('draft','published')) then raise exception 'active_intervention_exists'; end if;
  insert into public.gcse_assignments(teacher_id,class_id,title,instructions,assignment_type,content_ref,content_item,audience_mode,due_at,available_from,status,min_score,max_attempts)
  values(uid,a.class_id,intervention_title,'Targeted follow-up created from assessment evidence. Complete the reflection practice, then answer the mastery-check questions without notes.','intervention',p_topic_id,topic_title,'selected',due_at,now(),intervention_status,target_score,1)
  returning id into assignment_id;
  insert into private.gcse_interventions(teacher_id,class_id,source_assessment_id,assignment_id,topic_id,topic_code,topic_title,title,status,threshold_percent,target_score,max_questions,due_at)
  values(uid,a.class_id,a.id,assignment_id,p_topic_id,topic_code,topic_title,intervention_title,intervention_status,threshold_percent,target_score,max_questions,due_at)
  returning id into intervention_id;
  for at in select aa.* from public.gcse_assessment_attempts aa
    where aa.assessment_id=a.id and aa.teacher_id=uid and aa.status='submitted'
      and jsonb_exists(aa.topic_breakdown,p_topic_id)
      and coalesce((aa.topic_breakdown->p_topic_id->>'possible')::int,0)>0
      and round(coalesce((aa.topic_breakdown->p_topic_id->>'earned')::int,0)*100.0/nullif((aa.topic_breakdown->p_topic_id->>'possible')::int,0))<threshold_percent
    order by aa.percent nulls first,aa.student_id
  loop
    baseline:=at.topic_breakdown->p_topic_id; baseline_earned:=coalesce((baseline->>'earned')::int,0);
    baseline_possible:=greatest(1,coalesce((baseline->>'possible')::int,1)); baseline_percent:=round(baseline_earned*100.0/baseline_possible)::int;
    support_level:=case when baseline_percent<30 then 'priority' else 'developing' end;
    task_payload:='[]'::jsonb; marking_payload:='[]'::jsonb; selected_count:=0; item_no:=1;
    for review_item in select r.value from jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) r(value)
      where r.value->>'topicId'=p_topic_id and coalesce((r.value->>'awarded')::int,0)<greatest(1,coalesce((r.value->>'marks')::int,1))
      order by coalesce((r.value->>'awarded')::int,0)::numeric/greatest(1,coalesce((r.value->>'marks')::int,1)), greatest(1,coalesce((r.value->>'marks')::int,1)) desc, r.value->>'number'
      limit max_questions
    loop
      qid:=coalesce(review_item->>'id',''); if qid='' then continue; end if;
      select k.value into key_item from jsonb_array_elements(assessment_keys) k(value) where k.value->>'id'=qid limit 1;
      if key_item is null then continue; end if;
      prompt:=coalesce(review_item->>'prompt',''); previous_answer:=coalesce(review_item->>'answer','');
      max_marks:=greatest(1,coalesce((review_item->>'marks')::int,(key_item->>'marks')::int,1)); qtype:=coalesce(key_item->>'type','short');
      select q.value->'options' into options from jsonb_array_elements(a.question_payload) q(value) where q.value->>'id'=qid limit 1;
      task_payload:=task_payload||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'id','practice:'||qid,'sourceQuestionId',qid,'number',item_no||'A','stage','practice','topicId',p_topic_id,'topicCode',topic_code,'topicTitle',topic_title,
        'prompt','Review your earlier response, identify what you would improve, then write a short answer plan for: '||prompt,'previousAnswer',previous_answer,'marks',0,'type','reflection',
        'guidance',case when support_level='priority' then jsonb_build_array('Identify the key scientific idea first.','Use precise scientific vocabulary.','Build the explanation as a linked chain before the conclusion.') else jsonb_build_array('Identify the command word and the evidence needed.','Plan the scientific links before writing the final answer.') end
      )));
      task_payload:=task_payload||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'id','retest:'||qid,'sourceQuestionId',qid,'number',item_no||'B','stage','retest','topicId',p_topic_id,'topicCode',topic_code,'topicTitle',topic_title,
        'prompt',prompt,'marks',max_marks,'type',qtype,'options',options
      )));
      marking_payload:=marking_payload||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id','retest:'||qid,'sourceQuestionId',qid,'marks',max_marks,'type',qtype,'correct',key_item->>'correct','points',coalesce(key_item->'points','[]'::jsonb))));
      selected_count:=selected_count+1; item_no:=item_no+1;
    end loop;
    if selected_count=0 then
      for review_item in select r.value from jsonb_array_elements(coalesce(at.review,'[]'::jsonb)) r(value)
        where r.value->>'topicId'=p_topic_id order by greatest(1,coalesce((r.value->>'marks')::int,1)) desc limit 1
      loop
        qid:=coalesce(review_item->>'id',''); select k.value into key_item from jsonb_array_elements(assessment_keys) k(value) where k.value->>'id'=qid limit 1;
        if key_item is null then continue; end if;
        prompt:=coalesce(review_item->>'prompt',''); previous_answer:=coalesce(review_item->>'answer','');
        max_marks:=greatest(1,coalesce((review_item->>'marks')::int,(key_item->>'marks')::int,1)); qtype:=coalesce(key_item->>'type','short');
        select q.value->'options' into options from jsonb_array_elements(a.question_payload) q(value) where q.value->>'id'=qid limit 1;
        task_payload:=jsonb_build_array(
          jsonb_strip_nulls(jsonb_build_object('id','practice:'||qid,'sourceQuestionId',qid,'number','1A','stage','practice','topicId',p_topic_id,'topicCode',topic_code,'topicTitle',topic_title,'prompt','Review your earlier response and write a short improvement plan for: '||prompt,'previousAnswer',previous_answer,'marks',0,'type','reflection','guidance',jsonb_build_array('Identify the key scientific idea.','Plan a complete chain of reasoning.'))),
          jsonb_strip_nulls(jsonb_build_object('id','retest:'||qid,'sourceQuestionId',qid,'number','1B','stage','retest','topicId',p_topic_id,'topicCode',topic_code,'topicTitle',topic_title,'prompt',prompt,'marks',max_marks,'type',qtype,'options',options))
        );
        marking_payload:=jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id','retest:'||qid,'sourceQuestionId',qid,'marks',max_marks,'type',qtype,'correct',key_item->>'correct','points',coalesce(key_item->'points','[]'::jsonb))));
        selected_count:=1;
      end loop;
    end if;
    if selected_count=0 then continue; end if;
    insert into private.gcse_intervention_targets(intervention_id,student_id,baseline_earned,baseline_possible,baseline_percent,support_level,task_payload)
    values(intervention_id,at.student_id,baseline_earned,baseline_possible,baseline_percent,support_level,task_payload) returning id into target_id;
    insert into private.gcse_intervention_keys(target_id,marking_payload) values(target_id,marking_payload);
    insert into public.gcse_assignment_targets(assignment_id,class_id,teacher_id,student_id) values(assignment_id,a.class_id,uid,at.student_id) on conflict do nothing;
    student_count:=student_count+1;
  end loop;
  if student_count=0 then delete from private.gcse_interventions where id=intervention_id; delete from public.gcse_assignments where id=assignment_id; raise exception 'no_students_need_intervention'; end if;
  return jsonb_build_object('id',intervention_id,'assignmentId',assignment_id,'assessmentId',a.id,'topicId',p_topic_id,'topicCode',topic_code,'topicTitle',topic_title,'title',intervention_title,'status',intervention_status,'dueAt',due_at,'targetScore',target_score,'studentCount',student_count);
end;
$$;

create or replace function public.gcse_teacher_interventions(p_assessment_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'createdAt')::timestamptz desc),'[]'::jsonb) into result from (
    select jsonb_build_object(
      'id',i.id,'assignmentId',i.assignment_id,'assessmentId',i.source_assessment_id,'assessmentTitle',a.title,'classId',i.class_id,'className',c.name,
      'topicId',i.topic_id,'topicCode',i.topic_code,'topicTitle',i.topic_title,'title',i.title,'status',i.status,'dueAt',i.due_at,'targetScore',i.target_score,'createdAt',i.created_at,
      'summary',jsonb_build_object(
        'assigned',count(t.id)::int,'started',count(at.id)::int,'submitted',count(at.id) filter(where at.status='submitted')::int,
        'improved',count(at.id) filter(where at.status='submitted' and at.improved)::int,'targetMet',count(at.id) filter(where at.status='submitted' and at.target_met)::int,
        'averageBaseline',case when count(t.id)>0 then round(avg(t.baseline_percent))::int else null end,
        'averageRetest',case when count(at.id) filter(where at.status='submitted')>0 then round(avg(at.percent) filter(where at.status='submitted'))::int else null end,
        'averageGain',case when count(at.id) filter(where at.status='submitted')>0 then round(avg(at.improvement_points) filter(where at.status='submitted'))::int else null end
      ),
      'students',coalesce(jsonb_agg(jsonb_build_object(
        'targetId',t.id,'studentId',t.student_id,'displayName',coalesce(nullif(m.display_name,''),split_part(m.student_email,'@',1),'Student'),'email',m.student_email,
        'baselinePercent',t.baseline_percent,'supportLevel',t.support_level,'status',coalesce(at.status,'not_started'),
        'retestPercent',case when at.status='submitted' then at.percent else null end,'improvementPoints',case when at.status='submitted' then at.improvement_points else null end,
        'improved',case when at.status='submitted' then at.improved else null end,'targetMet',case when at.status='submitted' then at.target_met else null end,'submittedAt',at.submitted_at
      ) order by t.baseline_percent,coalesce(m.display_name,m.student_email)) filter(where t.id is not null),'[]'::jsonb)
    ) row_data
    from private.gcse_interventions i join public.gcse_assessments a on a.id=i.source_assessment_id join public.gcse_classes c on c.id=i.class_id
    left join private.gcse_intervention_targets t on t.intervention_id=i.id
    left join private.gcse_intervention_attempts at on at.intervention_id=i.id and at.student_id=t.student_id
    left join public.gcse_class_members m on m.class_id=i.class_id and m.student_id=t.student_id
    where i.teacher_id=uid and (p_assessment_id is null or i.source_assessment_id=p_assessment_id)
    group by i.id,a.title,c.name
  ) rows;
  return result;
end;
$$;

create or replace function public.gcse_student_interventions()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'assignmentId',i.assignment_id,'classId',i.class_id,'title',i.title,'topicId',i.topic_id,'topicCode',i.topic_code,'topicTitle',i.topic_title,
    'status',i.status,'dueAt',i.due_at,'targetScore',i.target_score,'baselinePercent',t.baseline_percent,'supportLevel',t.support_level,'tasks',t.task_payload,
    'attempt',case when at.id is null then null else jsonb_strip_nulls(jsonb_build_object(
      'id',at.id,'status',at.status,'startedAt',at.started_at,'submittedAt',at.submitted_at,'score',at.score,'totalMarks',at.total_marks,'percent',at.percent,
      'improvementPoints',at.improvement_points,'improved',at.improved,'targetMet',at.target_met,'review',case when at.status='submitted' then at.review else null end
    )) end
  ) order by i.due_at asc),'[]'::jsonb) into result
  from private.gcse_intervention_targets t join private.gcse_interventions i on i.id=t.intervention_id join public.gcse_assignments a on a.id=i.assignment_id
  left join private.gcse_intervention_attempts at on at.intervention_id=i.id and at.student_id=uid
  where t.student_id=uid and i.status in ('published','closed') and a.status in ('published','closed');
  return result;
end;
$$;

create or replace function public.gcse_start_intervention(p_intervention_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); i private.gcse_interventions%rowtype; t private.gcse_intervention_targets%rowtype; at private.gcse_intervention_attempts%rowtype; assignment public.gcse_assignments%rowtype; now_time timestamptz:=now();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into i from private.gcse_interventions where id=p_intervention_id; if not found then raise exception 'intervention_not_found'; end if;
  select * into t from private.gcse_intervention_targets where intervention_id=i.id and student_id=uid; if not found then raise exception 'intervention_not_assigned'; end if;
  select * into assignment from public.gcse_assignments where id=i.assignment_id;
  if i.status<>'published' or assignment.status<>'published' then
    if exists(select 1 from private.gcse_intervention_attempts x where x.intervention_id=i.id and x.student_id=uid and x.status='submitted') then
      select * into at from private.gcse_intervention_attempts where intervention_id=i.id and student_id=uid;
    else raise exception 'intervention_closed'; end if;
  end if;
  if at.id is null then select * into at from private.gcse_intervention_attempts where intervention_id=i.id and student_id=uid; end if;
  if at.id is null then
    insert into private.gcse_intervention_attempts(intervention_id,target_id,student_id,status,started_at) values(i.id,t.id,uid,'in_progress',now_time) returning * into at;
    insert into public.gcse_assignment_submissions(assignment_id,class_id,teacher_id,student_id,status,started_at,updated_at)
    values(i.assignment_id,i.class_id,i.teacher_id,uid,'in_progress',now_time,now_time)
    on conflict (assignment_id,student_id) do update set status=case when public.gcse_assignment_submissions.status='submitted' then public.gcse_assignment_submissions.status else 'in_progress' end,started_at=coalesce(public.gcse_assignment_submissions.started_at,excluded.started_at),updated_at=excluded.updated_at;
  end if;
  return jsonb_build_object(
    'intervention',jsonb_build_object('id',i.id,'assignmentId',i.assignment_id,'title',i.title,'topicId',i.topic_id,'topicCode',i.topic_code,'topicTitle',i.topic_title,'dueAt',i.due_at,'targetScore',i.target_score,'baselinePercent',t.baseline_percent,'supportLevel',t.support_level,'tasks',t.task_payload),
    'attempt',jsonb_build_object('id',at.id,'status',at.status,'answers',case when at.status='in_progress' then at.answers else '{}'::jsonb end,'startedAt',at.started_at,'submittedAt',at.submitted_at,'score',at.score,'totalMarks',at.total_marks,'percent',at.percent,'improvementPoints',at.improvement_points,'improved',at.improved,'targetMet',at.target_met,'review',case when at.status='submitted' then at.review else null end)
  );
end;
$$;

create or replace function public.gcse_save_intervention_answers(p_intervention_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); at private.gcse_intervention_attempts%rowtype;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(coalesce(p_answers,'{}'::jsonb))<>'object' or octet_length(coalesce(p_answers,'{}'::jsonb)::text)>250000 then raise exception 'invalid_answers'; end if;
  select * into at from private.gcse_intervention_attempts where intervention_id=p_intervention_id and student_id=uid;
  if not found then raise exception 'intervention_not_started'; end if;
  if at.status='submitted' then return to_jsonb(at); end if;
  update private.gcse_intervention_attempts set answers=p_answers,updated_at=now() where id=at.id returning * into at;
  return jsonb_build_object('id',at.id,'status',at.status,'answers',at.answers,'updatedAt',at.updated_at);
end;
$$;

create or replace function public.gcse_submit_intervention(p_intervention_id uuid,p_answers jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); i private.gcse_interventions%rowtype; t private.gcse_intervention_targets%rowtype; at private.gcse_intervention_attempts%rowtype; result jsonb; final_answers jsonb; score_value int; total_value int; percent_value int; gain_value int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(coalesce(p_answers,'{}'::jsonb))<>'object' or octet_length(coalesce(p_answers,'{}'::jsonb)::text)>250000 then raise exception 'invalid_answers'; end if;
  select * into i from private.gcse_interventions where id=p_intervention_id; if not found then raise exception 'intervention_not_found'; end if;
  select * into t from private.gcse_intervention_targets where intervention_id=i.id and student_id=uid; if not found then raise exception 'intervention_not_assigned'; end if;
  select * into at from private.gcse_intervention_attempts where intervention_id=i.id and student_id=uid; if not found then raise exception 'intervention_not_started'; end if;
  if at.status='submitted' then return jsonb_build_object('id',at.id,'status',at.status,'score',at.score,'totalMarks',at.total_marks,'percent',at.percent,'baselinePercent',t.baseline_percent,'improvementPoints',at.improvement_points,'improved',at.improved,'targetMet',at.target_met,'review',at.review); end if;
  final_answers:=case when coalesce(p_answers,'{}'::jsonb)='{}'::jsonb then at.answers else p_answers end;
  result:=private.gcse_grade_intervention_target(t.id,final_answers); score_value:=coalesce((result->>'score')::int,0); total_value:=coalesce((result->>'total_marks')::int,0); percent_value:=coalesce((result->>'percent')::int,0); gain_value:=percent_value-t.baseline_percent;
  update private.gcse_intervention_attempts set answers=final_answers,status='submitted',submitted_at=now(),score=score_value,total_marks=total_value,percent=percent_value,improvement_points=gain_value,improved=(percent_value>t.baseline_percent),target_met=(percent_value>=i.target_score),review=result->'review',updated_at=now() where id=at.id returning * into at;
  insert into public.gcse_assignment_submissions(assignment_id,class_id,teacher_id,student_id,status,started_at,submitted_at,score,max_score,updated_at)
  values(i.assignment_id,i.class_id,i.teacher_id,uid,'submitted',at.started_at,at.submitted_at,score_value,total_value,now())
  on conflict (assignment_id,student_id) do update set status='submitted',submitted_at=excluded.submitted_at,score=excluded.score,max_score=excluded.max_score,updated_at=excluded.updated_at;
  return jsonb_build_object('id',at.id,'status',at.status,'score',score_value,'totalMarks',total_value,'percent',percent_value,'baselinePercent',t.baseline_percent,'improvementPoints',gain_value,'improved',at.improved,'targetMet',at.target_met,'targetScore',i.target_score,'review',at.review);
end;
$$;

create or replace function public.gcse_set_intervention_status(p_intervention_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); i private.gcse_interventions%rowtype;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_status not in ('draft','published','closed') then raise exception 'invalid_status'; end if;
  select * into i from private.gcse_interventions where id=p_intervention_id and teacher_id=uid; if not found then raise exception 'intervention_not_found'; end if;
  update private.gcse_interventions set status=p_status,updated_at=now() where id=i.id;
  update public.gcse_assignments set status=p_status,updated_at=now() where id=i.assignment_id and teacher_id=uid;
  return true;
end;
$$;

revoke all on function private.gcse_grade_intervention_target(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.gcse_create_targeted_intervention(uuid,text,jsonb) from public,anon;
revoke all on function public.gcse_teacher_interventions(uuid) from public,anon;
revoke all on function public.gcse_student_interventions() from public,anon;
revoke all on function public.gcse_start_intervention(uuid) from public,anon;
revoke all on function public.gcse_save_intervention_answers(uuid,jsonb) from public,anon;
revoke all on function public.gcse_submit_intervention(uuid,jsonb) from public,anon;
revoke all on function public.gcse_set_intervention_status(uuid,text) from public,anon;

grant execute on function public.gcse_create_targeted_intervention(uuid,text,jsonb) to authenticated;
grant execute on function public.gcse_teacher_interventions(uuid) to authenticated;
grant execute on function public.gcse_student_interventions() to authenticated;
grant execute on function public.gcse_start_intervention(uuid) to authenticated;
grant execute on function public.gcse_save_intervention_answers(uuid,jsonb) to authenticated;
grant execute on function public.gcse_submit_intervention(uuid,jsonb) to authenticated;
grant execute on function public.gcse_set_intervention_status(uuid,text) to authenticated;

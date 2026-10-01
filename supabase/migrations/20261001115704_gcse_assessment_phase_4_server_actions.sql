create or replace function private.gcse_assessment_clean_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(regexp_replace(lower(coalesce(p_value,'')), '[^a-z0-9\.\- ]+', ' ', 'g'), '\s+', ' ', 'g'));
$$;

create or replace function private.gcse_assessment_point_matches(p_answer text, p_point text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  a text := private.gcse_assessment_clean_text(p_answer);
  p text := private.gcse_assessment_clean_text(p_point);
  words text[];
  w text;
  useful int := 0;
  matched int := 0;
begin
  if a = '' or p = '' then return false; end if;
  if position(p in a) > 0 then return true; end if;
  words := regexp_split_to_array(p, '\s+');
  foreach w in array words loop
    if length(w) >= 3 and w not in ('the','and','with','from','that','this','into','than','then','when','where','which','because','there','their','they','are','was','were','has','have','for','but','not') then
      useful := useful + 1;
      if position(w in a) > 0 then matched := matched + 1; end if;
    end if;
  end loop;
  if useful = 0 then return position(p in a) > 0; end if;
  return matched >= greatest(1, ceil(useful * 0.55)::int);
end;
$$;

create or replace function private.gcse_grade_assessment(p_assessment_id uuid,p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  questions jsonb; marking jsonb; item jsonb; q jsonb; qid text; answer text; qtype text; correct text;
  topic_id text; topic_code text; topic_title text; max_marks int; awarded int; total int := 0; score int := 0;
  points jsonb; point jsonb; matched_points jsonb := '[]'::jsonb; missed_points jsonb := '[]'::jsonb;
  review jsonb := '[]'::jsonb; breakdown jsonb := '{}'::jsonb; current_topic jsonb; pct int;
begin
  select a.question_payload,k.marking_payload into questions,marking
  from public.gcse_assessments a join private.gcse_assessment_keys k on k.assessment_id=a.id
  where a.id=p_assessment_id;
  if questions is null or marking is null then raise exception 'assessment_key_missing'; end if;
  for item in select value from jsonb_array_elements(marking) loop
    qid:=coalesce(item->>'id','');
    select value into q from jsonb_array_elements(questions) where value->>'id'=qid limit 1;
    if q is null then continue; end if;
    answer:=coalesce(p_answers->>qid,''); qtype:=coalesce(item->>'type',q->>'type','short'); correct:=coalesce(item->>'correct','');
    topic_id:=coalesce(item->>'topicId',q->>'topicId','unknown'); topic_code:=coalesce(item->>'topicCode',q->>'topicCode',topic_id); topic_title:=coalesce(item->>'topicTitle',q->>'topicTitle',topic_code);
    max_marks:=greatest(1,least(12,coalesce((item->>'marks')::int,(q->>'marks')::int,1))); total:=total+max_marks; awarded:=0; matched_points:='[]'::jsonb; missed_points:='[]'::jsonb; points:=coalesce(item->'points','[]'::jsonb);
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
    score:=score+awarded;
    current_topic:=coalesce(breakdown->topic_id,jsonb_build_object('earned',0,'possible',0,'topicCode',topic_code,'topicTitle',topic_title));
    breakdown:=jsonb_set(breakdown,array[topic_id],jsonb_build_object('earned',coalesce((current_topic->>'earned')::int,0)+awarded,'possible',coalesce((current_topic->>'possible')::int,0)+max_marks,'topicCode',topic_code,'topicTitle',topic_title),true);
    review:=review||jsonb_build_array(jsonb_build_object('id',qid,'number',q->>'number','prompt',q->>'prompt','answer',answer,'awarded',awarded,'marks',max_marks,'topicId',topic_id,'topicCode',topic_code,'topicTitle',topic_title,'markingPoints',points,'matchedPoints',matched_points,'missedPoints',missed_points,'correct',case when qtype='mcq' then correct else null end,'confidence',case when max_marks<=2 then 'high' else 'indicative' end));
  end loop;
  pct:=case when total>0 then round(score*100.0/total)::int else 0 end;
  return jsonb_build_object('score',score,'total_marks',total,'percent',pct,'review',review,'topic_breakdown',breakdown);
end;
$$;

create or replace function public.gcse_create_assessment(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid:=auth.uid(); class_id uuid; assessment_id uuid; audience text; q jsonb; k jsonb;
  safe_questions jsonb:='[]'::jsonb; safe_keys jsonb:='[]'::jsonb; student jsonb; sid uuid;
  marks_total int:=0; question_count int:=0; key_count int:=0; opens timestamptz; closes timestamptz;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  class_id:=(p_payload->>'class_id')::uuid;
  if not exists(select 1 from public.gcse_classes c where c.id=class_id and c.teacher_id=uid) then raise exception 'class_not_owned'; end if;
  audience:=coalesce(p_payload->>'audience_mode','class'); if audience not in ('class','selected') then raise exception 'invalid_audience'; end if;
  if jsonb_typeof(p_payload->'question_payload')<>'array' or jsonb_typeof(p_payload->'marking_payload')<>'array' then raise exception 'invalid_question_payload'; end if;
  opens:=(p_payload->>'opens_at')::timestamptz; closes:=(p_payload->>'closes_at')::timestamptz; if closes<=opens then raise exception 'invalid_window'; end if;
  for q in select value from jsonb_array_elements(p_payload->'question_payload') loop
    if coalesce(q->>'id','')='' or coalesce(q->>'prompt','')='' then raise exception 'invalid_question'; end if;
    marks_total:=marks_total+greatest(1,least(12,coalesce((q->>'marks')::int,1))); question_count:=question_count+1;
    safe_questions:=safe_questions||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id',q->>'id','number',q->>'number','topicId',q->>'topicId','topicCode',q->>'topicCode','topicTitle',q->>'topicTitle','prompt',q->>'prompt','marks',greatest(1,least(12,coalesce((q->>'marks')::int,1))),'type',coalesce(q->>'type','short'),'options',q->'options')));
  end loop;
  for k in select value from jsonb_array_elements(p_payload->'marking_payload') loop
    key_count:=key_count+1;
    safe_keys:=safe_keys||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id',k->>'id','marks',greatest(1,least(12,coalesce((k->>'marks')::int,1))),'type',coalesce(k->>'type','short'),'topicId',k->>'topicId','topicCode',k->>'topicCode','topicTitle',k->>'topicTitle','correct',k->>'correct','points',coalesce(k->'points','[]'::jsonb))));
  end loop;
  if question_count=0 or question_count<>key_count then raise exception 'question_key_mismatch'; end if;
  if marks_total<>(p_payload->>'total_marks')::int then raise exception 'mark_total_mismatch'; end if;
  if exists(select 1 from jsonb_array_elements(safe_questions) sq where not exists(select 1 from jsonb_array_elements(safe_keys) sk where sk->>'id'=sq->>'id')) then raise exception 'question_key_mismatch'; end if;
  insert into public.gcse_assessments(teacher_id,class_id,title,instructions,qualification,subject,paper,tier,topic_ids,total_marks,duration_minutes,opens_at,closes_at,audience_mode,status,question_payload)
  values(uid,class_id,trim(p_payload->>'title'),coalesce(p_payload->>'instructions',''),p_payload->>'qualification',p_payload->>'subject',(p_payload->>'paper')::smallint,p_payload->>'tier',coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'topic_ids','[]'::jsonb))),'{}'::text[]),(p_payload->>'total_marks')::int,(p_payload->>'duration_minutes')::int,opens,closes,audience,coalesce(p_payload->>'status','draft'),safe_questions)
  returning id into assessment_id;
  insert into private.gcse_assessment_keys(assessment_id,teacher_id,marking_payload) values(assessment_id,uid,safe_keys);
  if audience='selected' then
    if jsonb_typeof(p_payload->'student_ids')<>'array' or jsonb_array_length(p_payload->'student_ids')=0 then raise exception 'selected_students_required'; end if;
    for student in select value from jsonb_array_elements(p_payload->'student_ids') loop
      sid:=trim(both '"' from student::text)::uuid;
      if not exists(select 1 from public.gcse_class_members m where m.class_id=class_id and m.teacher_id=uid and m.student_id=sid and m.status='joined') then raise exception 'student_not_in_class'; end if;
      insert into public.gcse_assessment_targets(assessment_id,class_id,teacher_id,student_id) values(assessment_id,class_id,uid,sid) on conflict do nothing;
    end loop;
  end if;
  return assessment_id;
end;
$$;

create or replace function public.gcse_set_assessment_status(p_assessment_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_status not in ('draft','published','closed') then raise exception 'invalid_status'; end if;
  update public.gcse_assessments set status=p_status where id=p_assessment_id and teacher_id=uid; return found;
end;$$;

create or replace function public.gcse_teacher_assessment_key(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  select k.marking_payload into result from private.gcse_assessment_keys k join public.gcse_assessments a on a.id=k.assessment_id where k.assessment_id=p_assessment_id and a.teacher_id=uid;
  if result is null then raise exception 'assessment_not_found'; end if; return result;
end;$$;

create or replace function public.gcse_student_assessments()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'opens_at')::timestamptz asc),'[]'::jsonb) into result from (
    select jsonb_strip_nulls(jsonb_build_object('id',a.id,'class_id',a.class_id,'class_name',c.name,'title',a.title,'instructions',a.instructions,'qualification',a.qualification,'subject',a.subject,'paper',a.paper,'tier',a.tier,'topic_ids',to_jsonb(a.topic_ids),'total_marks',a.total_marks,'duration_minutes',a.duration_minutes,'opens_at',a.opens_at,'closes_at',a.closes_at,'status',a.status,'attempt',case when at.id is null then null else jsonb_strip_nulls(jsonb_build_object('id',at.id,'status',at.status,'started_at',at.started_at,'ends_at',at.ends_at,'submitted_at',at.submitted_at,'score',at.score,'total_marks',at.total_marks,'percent',at.percent,'topic_breakdown',at.topic_breakdown,'review',case when at.status='submitted' then at.review else null end,'timed_out',at.timed_out)) end)) as row_data
    from public.gcse_assessments a join public.gcse_classes c on c.id=a.class_id join public.gcse_class_members m on m.class_id=a.class_id and m.student_id=uid and m.status='joined'
    left join public.gcse_assessment_attempts at on at.assessment_id=a.id and at.student_id=uid
    where a.status in ('published','closed') and (a.audience_mode='class' or exists(select 1 from public.gcse_assessment_targets t where t.assessment_id=a.id and t.student_id=uid))
  ) s; return result;
end;$$;

create or replace function public.gcse_start_assessment(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); a public.gcse_assessments%rowtype; at public.gcse_assessment_attempts%rowtype; finish jsonb; final_end timestamptz;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into a from public.gcse_assessments where id=p_assessment_id; if not found then raise exception 'assessment_not_found'; end if;
  if not exists(select 1 from public.gcse_class_members m where m.class_id=a.class_id and m.student_id=uid and m.status='joined') then raise exception 'assessment_not_assigned'; end if;
  if a.audience_mode='selected' and not exists(select 1 from public.gcse_assessment_targets t where t.assessment_id=a.id and t.student_id=uid) then raise exception 'assessment_not_assigned'; end if;
  select * into at from public.gcse_assessment_attempts where assessment_id=a.id and student_id=uid;
  if at.id is not null and at.status='submitted' then return jsonb_build_object('assessment',jsonb_build_object('id',a.id,'title',a.title,'instructions',a.instructions,'qualification',a.qualification,'subject',a.subject,'paper',a.paper,'tier',a.tier,'total_marks',a.total_marks,'duration_minutes',a.duration_minutes,'opens_at',a.opens_at,'closes_at',a.closes_at,'questions',a.question_payload),'attempt',to_jsonb(at)); end if;
  if a.status<>'published' then raise exception 'assessment_closed'; end if; if now()<a.opens_at then raise exception 'assessment_not_open'; end if; if at.id is null and now()>a.closes_at then raise exception 'assessment_closed'; end if;
  if at.id is null then final_end:=least(a.closes_at,now()+make_interval(mins=>a.duration_minutes)); insert into public.gcse_assessment_attempts(assessment_id,class_id,teacher_id,student_id,status,started_at,ends_at,answers) values(a.id,a.class_id,a.teacher_id,uid,'in_progress',now(),final_end,'{}'::jsonb) returning * into at;
  elsif at.status='in_progress' and now()>=at.ends_at then finish:=private.gcse_grade_assessment(a.id,at.answers); update public.gcse_assessment_attempts set status='submitted',submitted_at=now(),score=(finish->>'score')::int,total_marks=(finish->>'total_marks')::int,percent=(finish->>'percent')::int,topic_breakdown=finish->'topic_breakdown',review=finish->'review',timed_out=true where id=at.id returning * into at; end if;
  return jsonb_build_object('assessment',jsonb_build_object('id',a.id,'title',a.title,'instructions',a.instructions,'qualification',a.qualification,'subject',a.subject,'paper',a.paper,'tier',a.tier,'topic_ids',to_jsonb(a.topic_ids),'total_marks',a.total_marks,'duration_minutes',a.duration_minutes,'opens_at',a.opens_at,'closes_at',a.closes_at,'questions',a.question_payload),'attempt',to_jsonb(at));
end;$$;

create or replace function public.gcse_save_assessment_answers(p_assessment_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); at public.gcse_assessment_attempts%rowtype;
begin
  if uid is null then raise exception 'not_authenticated'; end if; if jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>250000 then raise exception 'invalid_answers'; end if;
  select * into at from public.gcse_assessment_attempts where assessment_id=p_assessment_id and student_id=uid; if not found then raise exception 'attempt_not_started'; end if; if at.status='submitted' then return to_jsonb(at); end if;
  if now()>=at.ends_at then return public.gcse_submit_assessment(p_assessment_id,p_answers); end if; update public.gcse_assessment_attempts set answers=p_answers where id=at.id returning * into at;
  return jsonb_build_object('id',at.id,'status',at.status,'ends_at',at.ends_at,'saved_at',at.updated_at);
end;$$;

create or replace function public.gcse_submit_assessment(p_assessment_id uuid,p_answers jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); at public.gcse_assessment_attempts%rowtype; result jsonb; answers jsonb; timed boolean;
begin
  if uid is null then raise exception 'not_authenticated'; end if; if jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>250000 then raise exception 'invalid_answers'; end if;
  select * into at from public.gcse_assessment_attempts where assessment_id=p_assessment_id and student_id=uid; if not found then raise exception 'attempt_not_started'; end if; if at.status='submitted' then return to_jsonb(at); end if;
  answers:=case when p_answers='{}'::jsonb then at.answers else p_answers end; timed:=now()>=at.ends_at; result:=private.gcse_grade_assessment(p_assessment_id,answers);
  update public.gcse_assessment_attempts set answers=answers,status='submitted',submitted_at=now(),score=(result->>'score')::int,total_marks=(result->>'total_marks')::int,percent=(result->>'percent')::int,topic_breakdown=result->'topic_breakdown',review=result->'review',timed_out=timed where id=at.id returning * into at; return to_jsonb(at);
end;$$;

revoke all on function public.gcse_create_assessment(jsonb) from public,anon;
revoke all on function public.gcse_set_assessment_status(uuid,text) from public,anon;
revoke all on function public.gcse_teacher_assessment_key(uuid) from public,anon;
revoke all on function public.gcse_student_assessments() from public,anon;
revoke all on function public.gcse_start_assessment(uuid) from public,anon;
revoke all on function public.gcse_save_assessment_answers(uuid,jsonb) from public,anon;
revoke all on function public.gcse_submit_assessment(uuid,jsonb) from public,anon;
grant execute on function public.gcse_create_assessment(jsonb) to authenticated;
grant execute on function public.gcse_set_assessment_status(uuid,text) to authenticated;
grant execute on function public.gcse_teacher_assessment_key(uuid) to authenticated;
grant execute on function public.gcse_student_assessments() to authenticated;
grant execute on function public.gcse_start_assessment(uuid) to authenticated;
grant execute on function public.gcse_save_assessment_answers(uuid,jsonb) to authenticated;
grant execute on function public.gcse_submit_assessment(uuid,jsonb) to authenticated;
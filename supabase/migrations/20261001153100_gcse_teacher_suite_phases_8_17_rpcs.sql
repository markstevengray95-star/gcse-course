-- Teacher Platform phases 8-17 server actions.
-- All SECURITY DEFINER functions validate the authenticated caller internally.

create or replace function public.gcse_start_live_classroom(p_class_id uuid,p_topic_id text default null,p_title text default 'Live classroom')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.gcse_live_classroom_sessions%rowtype;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if not exists(select 1 from public.gcse_classes c where c.id=p_class_id and c.teacher_id=uid and not c.archived) then raise exception 'class_not_found'; end if;
  update public.gcse_live_classroom_sessions set status='ended',ended_at=now(),updated_at=now() where teacher_id=uid and class_id=p_class_id and status='live';
  insert into public.gcse_live_classroom_sessions(teacher_id,class_id,topic_id,title)
  values(uid,p_class_id,nullif(trim(p_topic_id),''),left(coalesce(nullif(trim(p_title),''),'Live classroom'),160)) returning * into s;
  return jsonb_build_object('id',s.id,'joinCode',s.join_code,'title',s.title,'classId',s.class_id,'topicId',s.topic_id,'status',s.status,'startedAt',s.started_at);
end;$$;

create or replace function public.gcse_update_live_classroom(p_session_id uuid,p_activity text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.gcse_live_classroom_sessions%rowtype;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  update public.gcse_live_classroom_sessions set current_activity=left(coalesce(nullif(trim(p_activity),''),'welcome'),80),activity_payload=coalesce(p_payload,'{}'::jsonb),updated_at=now()
  where id=p_session_id and teacher_id=uid and status='live' returning * into s;
  if not found then raise exception 'live_session_not_found'; end if;
  return jsonb_build_object('id',s.id,'activity',s.current_activity,'payload',s.activity_payload,'updatedAt',s.updated_at);
end;$$;

create or replace function public.gcse_end_live_classroom(p_session_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); n int;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  update public.gcse_live_classroom_sessions set status='ended',ended_at=now(),updated_at=now() where id=p_session_id and teacher_id=uid and status='live';
  get diagnostics n=row_count; return n>0;
end;$$;

create or replace function public.gcse_join_live_classroom(p_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.gcse_live_classroom_sessions%rowtype;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  select x.* into s from public.gcse_live_classroom_sessions x
  where upper(x.join_code)=upper(trim(p_code)) and x.status='live'
    and exists(select 1 from public.gcse_class_members m where m.class_id=x.class_id and m.student_id=uid and m.status='joined')
  order by x.started_at desc limit 1;
  if not found then raise exception 'live_session_not_found'; end if;
  return jsonb_build_object('id',s.id,'title',s.title,'topicId',s.topic_id,'activity',s.current_activity,'payload',s.activity_payload,'startedAt',s.started_at);
end;$$;

create or replace function public.gcse_submit_live_response(p_session_id uuid,p_prompt_id text,p_response text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.gcse_live_classroom_sessions%rowtype; r public.gcse_live_classroom_responses%rowtype;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  select * into s from public.gcse_live_classroom_sessions where id=p_session_id and status='live'; if not found then raise exception 'live_session_not_found'; end if;
  if not exists(select 1 from public.gcse_class_members m where m.class_id=s.class_id and m.student_id=uid and m.status='joined') then raise exception 'class_membership_required'; end if;
  insert into public.gcse_live_classroom_responses(session_id,class_id,teacher_id,student_id,prompt_id,response_text,response_payload)
  values(s.id,s.class_id,s.teacher_id,uid,left(coalesce(nullif(trim(p_prompt_id),''),'response'),120),left(coalesce(p_response,''),2000),coalesce(p_payload,'{}'::jsonb))
  on conflict(session_id,student_id,prompt_id) do update set response_text=excluded.response_text,response_payload=excluded.response_payload,updated_at=now() returning * into r;
  return jsonb_build_object('id',r.id,'promptId',r.prompt_id,'savedAt',r.updated_at);
end;$$;

create or replace function public.gcse_live_classroom_snapshot(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s public.gcse_live_classroom_sessions%rowtype; result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  select * into s from public.gcse_live_classroom_sessions where id=p_session_id and teacher_id=uid; if not found then raise exception 'live_session_not_found'; end if;
  select jsonb_build_object(
    'id',s.id,'title',s.title,'joinCode',s.join_code,'status',s.status,'activity',s.current_activity,'payload',s.activity_payload,
    'responses',coalesce(jsonb_agg(jsonb_build_object('studentId',r.student_id,'name',coalesce(m.display_name,m.student_email),'promptId',r.prompt_id,'response',r.response_text,'payload',r.response_payload,'updatedAt',r.updated_at) order by r.updated_at desc) filter(where r.id is not null),'[]'::jsonb)
  ) into result
  from public.gcse_live_classroom_responses r left join public.gcse_class_members m on m.class_id=s.class_id and m.student_id=r.student_id where r.session_id=s.id;
  return result;
end;$$;

create or replace function public.gcse_intervention_dashboard(p_class_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_class_id is not null and not exists(select 1 from public.gcse_classes c where c.id=p_class_id and c.teacher_id=uid) then raise exception 'class_not_found'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object('active',count(*) filter(where i.status='published'),'students',count(distinct t.student_id),'submitted',count(a.id) filter(where a.status='submitted'),'targetMet',count(a.id) filter(where a.status='submitted' and a.target_met),'averageImprovement',round(avg(a.improvement_points) filter(where a.status='submitted'))),
    'rows',coalesce(jsonb_agg(jsonb_build_object('interventionId',i.id,'classId',i.class_id,'className',c.name,'topicId',i.topic_id,'topicCode',i.topic_code,'topicTitle',i.topic_title,'title',i.title,'status',i.status,'dueAt',i.due_at,'studentId',t.student_id,'studentName',coalesce(m.display_name,m.student_email),'baseline',t.baseline_percent,'supportLevel',t.support_level,'retest',a.percent,'improvement',a.improvement_points,'targetMet',a.target_met,'attemptStatus',a.status) order by i.due_at,t.baseline_percent) filter(where t.id is not null),'[]'::jsonb)
  ) into result
  from private.gcse_interventions i join public.gcse_classes c on c.id=i.class_id
  left join private.gcse_intervention_targets t on t.intervention_id=i.id
  left join private.gcse_intervention_attempts a on a.target_id=t.id
  left join public.gcse_class_members m on m.class_id=i.class_id and m.student_id=t.student_id
  where i.teacher_id=uid and (p_class_id is null or i.class_id=p_class_id);
  return coalesce(result,jsonb_build_object('summary',jsonb_build_object('active',0,'students',0,'submitted',0,'targetMet',0,'averageImprovement',null),'rows','[]'::jsonb));
end;$$;

create or replace function public.gcse_build_teacher_report(p_class_id uuid,p_report_type text default 'class_progress')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); c public.gcse_classes%rowtype; payload jsonb; rid uuid; rtype text:=lower(coalesce(p_report_type,'class_progress'));
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if rtype not in ('class_progress','assessment','homework','intervention') then raise exception 'invalid_report_type'; end if;
  select * into c from public.gcse_classes where id=p_class_id and teacher_id=uid; if not found then raise exception 'class_not_found'; end if;
  select jsonb_build_object(
    'classId',c.id,'className',c.name,'yearGroup',c.year_group,'subject',c.subject,'courseType',c.course_type,'generatedAt',now(),
    'summary',jsonb_build_object(
      'students',(select count(*) from public.gcse_class_members m where m.class_id=c.id and m.status='joined'),
      'assignments',(select count(*) from public.gcse_assignments a where a.class_id=c.id and a.teacher_id=uid),
      'homeworkSubmitted',(select count(*) from public.gcse_assignment_submissions s where s.class_id=c.id and s.teacher_id=uid and s.status='submitted'),
      'assessmentAverage',(select round(avg(a.percent)) from public.gcse_assessment_attempts a where a.class_id=c.id and a.teacher_id=uid and a.status='submitted'),
      'interventions',(select count(*) from private.gcse_interventions i where i.class_id=c.id and i.teacher_id=uid),
      'interventionTargetMet',(select count(*) from private.gcse_intervention_attempts ia join private.gcse_interventions i on i.id=ia.intervention_id where i.class_id=c.id and i.teacher_id=uid and ia.status='submitted' and ia.target_met)
    ),
    'students',coalesce((select jsonb_agg(jsonb_build_object(
      'studentId',m.student_id,'name',coalesce(m.display_name,m.student_email),'email',m.student_email,
      'assessmentAverage',(select round(avg(aa.percent)) from public.gcse_assessment_attempts aa where aa.class_id=c.id and aa.student_id=m.student_id and aa.status='submitted'),
      'homeworkSubmitted',(select count(*) from public.gcse_assignment_submissions hs where hs.class_id=c.id and hs.student_id=m.student_id and hs.status='submitted'),
      'homeworkTotal',(select count(*) from public.gcse_assignments ga where ga.class_id=c.id and ga.teacher_id=uid and ga.status in ('published','closed')),
      'activeInterventions',(select count(*) from private.gcse_intervention_targets it join private.gcse_interventions gi on gi.id=it.intervention_id where gi.class_id=c.id and it.student_id=m.student_id and gi.status='published'),
      'targetMet',(select count(*) from private.gcse_intervention_attempts ia join private.gcse_interventions gi on gi.id=ia.intervention_id where gi.class_id=c.id and ia.student_id=m.student_id and ia.status='submitted' and ia.target_met)
    ) order by coalesce(m.display_name,m.student_email)) from public.gcse_class_members m where m.class_id=c.id and m.status='joined'),'[]'::jsonb)
  ) into payload;
  insert into public.gcse_teacher_reports(teacher_id,class_id,report_type,title,report_payload)
  values(uid,c.id,rtype,c.name||' '||replace(rtype,'_',' ')||' report',payload) returning id into rid;
  return jsonb_build_object('id',rid,'type',rtype,'payload',payload);
end;$$;

create or replace function public.gcse_build_parent_summary(p_class_id uuid,p_student_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); c public.gcse_classes%rowtype; m public.gcse_class_members%rowtype; avg_assessment int; hw_done int; hw_total int; intervention_count int; target_met int; payload jsonb; sid uuid;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  select * into c from public.gcse_classes where id=p_class_id and teacher_id=uid; if not found then raise exception 'class_not_found'; end if;
  select * into m from public.gcse_class_members where class_id=c.id and student_id=p_student_id and status='joined'; if not found then raise exception 'student_not_found'; end if;
  select round(avg(percent))::int into avg_assessment from public.gcse_assessment_attempts where class_id=c.id and student_id=p_student_id and status='submitted';
  select count(*) filter(where status='submitted')::int,count(*)::int into hw_done,hw_total from public.gcse_assignment_submissions where class_id=c.id and student_id=p_student_id;
  select count(*)::int into intervention_count from private.gcse_intervention_targets t join private.gcse_interventions i on i.id=t.intervention_id where i.class_id=c.id and t.student_id=p_student_id;
  select count(*)::int into target_met from private.gcse_intervention_attempts a join private.gcse_interventions i on i.id=a.intervention_id where i.class_id=c.id and a.student_id=p_student_id and a.status='submitted' and a.target_met;
  payload:=jsonb_build_object(
    'studentId',p_student_id,'studentName',coalesce(m.display_name,m.student_email),'className',c.name,'generatedAt',now(),
    'assessmentAverage',avg_assessment,'homeworkSubmitted',coalesce(hw_done,0),'homeworkRecorded',coalesce(hw_total,0),'interventions',coalesce(intervention_count,0),'targetsMet',coalesce(target_met,0),
    'summary',case when avg_assessment is null then coalesce(m.display_name,'The student')||' is building evidence across the GCSE Science course.' when avg_assessment>=70 then coalesce(m.display_name,'The student')||' is currently demonstrating secure understanding across recent assessed work.' when avg_assessment>=50 then coalesce(m.display_name,'The student')||' is making progress and is developing consistency across recent assessed work.' else coalesce(m.display_name,'The student')||' would benefit from continued focused practice on identified priority topics.' end,
    'nextSteps',jsonb_build_array('Complete assigned practice by the due date.','Review feedback from recent assessments and intervention work.','Use the course revision tools to revisit weaker topics before the next assessment.'),
    'note','This is a learning-progress summary generated from work recorded in this course and is not an official predicted grade.'
  );
  insert into private.gcse_parent_summaries(teacher_id,class_id,student_id,summary_payload) values(uid,c.id,p_student_id,payload) returning id into sid;
  return jsonb_build_object('id',sid,'payload',payload);
end;$$;

create or replace function public.gcse_create_department(p_name text,p_description text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); did uuid;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  insert into public.gcse_departments(owner_id,name,description) values(uid,left(trim(p_name),120),left(coalesce(p_description,''),1000)) returning id into did;
  insert into public.gcse_department_members(department_id,user_id,role) values(did,uid,'owner');
  return jsonb_build_object('id',did,'name',left(trim(p_name),120),'role','owner');
end;$$;

create or replace function public.gcse_department_add_teacher(p_department_id uuid,p_email text,p_role text default 'teacher')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target uuid; role_name text:=lower(coalesce(p_role,'teacher'));
begin
  if uid is null or not private.gcse_is_department_admin(p_department_id) then raise exception 'department_admin_required'; end if;
  if role_name not in ('lead','teacher') then raise exception 'invalid_role'; end if;
  select u.id into target from auth.users u where lower(u.email)=lower(trim(p_email)) limit 1; if target is null then raise exception 'teacher_account_not_found'; end if;
  if not exists(select 1 from public.gcse_profiles p where p.user_id=target and (p.is_admin or p.role in ('teacher','school_admin','platform_admin') or lower(coalesce(p.plan,'free')) in ('teacher','school'))) then raise exception 'teacher_account_required'; end if;
  insert into public.gcse_department_members(department_id,user_id,role) values(p_department_id,target,role_name) on conflict(department_id,user_id) do update set role=excluded.role;
  return jsonb_build_object('departmentId',p_department_id,'userId',target,'role',role_name);
end;$$;

create or replace function public.gcse_department_dashboard(p_department_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null or not private.gcse_is_department_member(p_department_id) then raise exception 'department_membership_required'; end if;
  select jsonb_build_object(
    'department',jsonb_build_object('id',d.id,'name',d.name,'description',d.description),
    'summary',jsonb_build_object(
      'teachers',(select count(*) from public.gcse_department_members dm where dm.department_id=d.id),
      'classes',(select count(*) from public.gcse_classes c join public.gcse_department_members dm on dm.user_id=c.teacher_id where dm.department_id=d.id and not c.archived),
      'students',(select count(distinct cm.student_id) from public.gcse_class_members cm join public.gcse_classes c on c.id=cm.class_id join public.gcse_department_members dm on dm.user_id=c.teacher_id where dm.department_id=d.id and cm.status='joined'),
      'assessmentAverage',(select round(avg(a.percent)) from public.gcse_assessment_attempts a join public.gcse_department_members dm on dm.user_id=a.teacher_id where dm.department_id=d.id and a.status='submitted')
    ),
    'members',coalesce((select jsonb_agg(jsonb_build_object('userId',dm.user_id,'role',dm.role,'email',coalesce(p.email,'')) order by dm.role,coalesce(p.email,'')) from public.gcse_department_members dm left join public.gcse_profiles p on p.user_id=dm.user_id where dm.department_id=d.id),'[]'::jsonb)
  ) into result from public.gcse_departments d where d.id=p_department_id;
  return result;
end;$$;

create or replace function public.gcse_create_school(p_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid;
begin
  if uid is null or not private.gcse_has_school_admin_access() then raise exception 'school_admin_required'; end if;
  insert into public.gcse_schools(owner_admin_id,name) values(uid,left(trim(p_name),160)) returning id into sid;
  insert into public.gcse_school_members(school_id,user_id,role) values(sid,uid,'admin');
  return jsonb_build_object('id',sid,'name',left(trim(p_name),160));
end;$$;

create or replace function public.gcse_school_add_staff(p_school_id uuid,p_email text,p_role text default 'teacher')
returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid; role_name text:=lower(coalesce(p_role,'teacher'));
begin
  if auth.uid() is null or not private.gcse_is_school_admin(p_school_id) then raise exception 'school_admin_required'; end if;
  if role_name not in ('admin','department_lead','teacher') then raise exception 'invalid_role'; end if;
  select u.id into target from auth.users u where lower(u.email)=lower(trim(p_email)) limit 1; if target is null then raise exception 'account_not_found'; end if;
  if not exists(select 1 from public.gcse_profiles p where p.user_id=target) then raise exception 'gcse_account_required'; end if;
  insert into public.gcse_school_members(school_id,user_id,role) values(p_school_id,target,role_name) on conflict(school_id,user_id) do update set role=excluded.role;
  return jsonb_build_object('schoolId',p_school_id,'userId',target,'role',role_name);
end;$$;

create or replace function public.gcse_school_dashboard(p_school_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null or not private.gcse_is_school_admin(p_school_id) then raise exception 'school_admin_required'; end if;
  select jsonb_build_object(
    'school',jsonb_build_object('id',s.id,'name',s.name),
    'summary',jsonb_build_object(
      'staff',(select count(*) from public.gcse_school_members sm where sm.school_id=s.id),
      'classes',(select count(*) from public.gcse_classes c join public.gcse_school_members sm on sm.user_id=c.teacher_id where sm.school_id=s.id and not c.archived),
      'students',(select count(distinct cm.student_id) from public.gcse_class_members cm join public.gcse_classes c on c.id=cm.class_id join public.gcse_school_members sm on sm.user_id=c.teacher_id where sm.school_id=s.id and cm.status='joined'),
      'assessmentAverage',(select round(avg(a.percent)) from public.gcse_assessment_attempts a join public.gcse_school_members sm on sm.user_id=a.teacher_id where sm.school_id=s.id and a.status='submitted'),
      'activeInterventions',(select count(*) from private.gcse_interventions i join public.gcse_school_members sm on sm.user_id=i.teacher_id where sm.school_id=s.id and i.status='published')
    ),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('userId',sm.user_id,'role',sm.role,'email',coalesce(p.email,'')) order by sm.role,coalesce(p.email,'')) from public.gcse_school_members sm left join public.gcse_profiles p on p.user_id=sm.user_id where sm.school_id=s.id),'[]'::jsonb)
  ) into result from public.gcse_schools s where s.id=p_school_id;
  return result;
end;$$;

do $$
declare f text;
begin
  foreach f in array array[
    'gcse_start_live_classroom(uuid,text,text)','gcse_update_live_classroom(uuid,text,jsonb)','gcse_end_live_classroom(uuid)',
    'gcse_join_live_classroom(text)','gcse_submit_live_response(uuid,text,text,jsonb)','gcse_live_classroom_snapshot(uuid)',
    'gcse_intervention_dashboard(uuid)','gcse_build_teacher_report(uuid,text)','gcse_build_parent_summary(uuid,uuid)',
    'gcse_create_department(text,text)','gcse_department_add_teacher(uuid,text,text)','gcse_department_dashboard(uuid)',
    'gcse_create_school(text)','gcse_school_add_staff(uuid,text,text)','gcse_school_dashboard(uuid)'
  ] loop
    execute 'revoke all on function public.'||f||' from public,anon';
    execute 'grant execute on function public.'||f||' to authenticated';
  end loop;
end$$;
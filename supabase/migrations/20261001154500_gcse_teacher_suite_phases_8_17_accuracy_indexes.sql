-- Teacher Suite phases 8-17 release refinements.
-- Adds FK-supporting indexes and tightens intervention/homework summary accuracy.

create index if not exists gcse_live_responses_class_idx on public.gcse_live_classroom_responses(class_id);
create index if not exists gcse_live_responses_teacher_idx on public.gcse_live_classroom_responses(teacher_id);
create index if not exists gcse_teacher_resources_class_idx on public.gcse_teacher_resources(class_id) where class_id is not null;
create index if not exists gcse_lesson_plans_class_idx on public.gcse_lesson_plans(class_id) where class_id is not null;
create index if not exists gcse_presentation_sessions_class_idx on public.gcse_presentation_sessions(class_id) where class_id is not null;
create index if not exists gcse_teacher_reports_class_idx on public.gcse_teacher_reports(class_id);
create index if not exists gcse_parent_summaries_class_idx on private.gcse_parent_summaries(class_id);
create index if not exists gcse_parent_summaries_student_idx on private.gcse_parent_summaries(student_id);
create index if not exists gcse_departments_owner_idx on public.gcse_departments(owner_id);
create index if not exists gcse_collaboration_items_author_idx on public.gcse_collaboration_items(author_id);
create index if not exists gcse_collaboration_comments_department_idx on public.gcse_collaboration_comments(department_id);
create index if not exists gcse_collaboration_comments_author_idx on public.gcse_collaboration_comments(author_id);
create index if not exists gcse_schools_owner_idx on public.gcse_schools(owner_admin_id);

create or replace function public.gcse_intervention_dashboard(p_class_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
  if uid is null or not private.gcse_has_teacher_access() then raise exception 'teacher_access_required'; end if;
  if p_class_id is not null and not exists(select 1 from public.gcse_classes c where c.id=p_class_id and c.teacher_id=uid) then raise exception 'class_not_found'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'active',count(distinct i.id) filter(where i.status='published'),
      'students',count(distinct t.student_id),
      'submitted',count(a.id) filter(where a.status='submitted'),
      'targetMet',count(a.id) filter(where a.status='submitted' and a.target_met),
      'averageImprovement',round(avg(a.improvement_points) filter(where a.status='submitted'))
    ),
    'rows',coalesce(jsonb_agg(jsonb_build_object(
      'interventionId',i.id,'classId',i.class_id,'className',c.name,'topicId',i.topic_id,'topicCode',i.topic_code,'topicTitle',i.topic_title,
      'title',i.title,'status',i.status,'dueAt',i.due_at,'studentId',t.student_id,'studentName',coalesce(m.display_name,m.student_email),
      'baseline',t.baseline_percent,'supportLevel',t.support_level,'retest',a.percent,'improvement',a.improvement_points,'targetMet',a.target_met,'attemptStatus',a.status
    ) order by i.due_at,t.baseline_percent) filter(where t.id is not null),'[]'::jsonb)
  ) into result
  from private.gcse_interventions i
  join public.gcse_classes c on c.id=i.class_id
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
      'homeworkTotal',(select count(*) from public.gcse_assignments ga where ga.class_id=c.id and ga.teacher_id=uid and ga.status in ('published','closed') and (ga.audience_mode='class' or exists(select 1 from public.gcse_assignment_targets gt where gt.assignment_id=ga.id and gt.student_id=m.student_id))),
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
  select count(*)::int into hw_done from public.gcse_assignment_submissions where class_id=c.id and student_id=p_student_id and status='submitted';
  select count(*)::int into hw_total from public.gcse_assignments ga
  where ga.class_id=c.id and ga.teacher_id=uid and ga.status in ('published','closed')
    and (ga.audience_mode='class' or exists(select 1 from public.gcse_assignment_targets gt where gt.assignment_id=ga.id and gt.student_id=p_student_id));
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
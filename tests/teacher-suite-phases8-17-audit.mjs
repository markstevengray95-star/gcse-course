import fs from 'node:fs';

const read = path => fs.readFileSync(path,'utf8');
const must = (condition,message) => {
  if (!condition) { console.error(`✗ ${message}`); process.exitCode = 1; }
  else console.log(`✓ ${message}`);
};
const contains = (text,value,message) => must(text.includes(value),message);

const js = read('teacher-suite-phases8-17.js');
const enhancements = read('teacher-suite-live-enhancements.js');
const css = read('teacher-suite-phases8-17.css');
const loader = read('course-audit-fixes.js');
const schema = read('supabase/migrations/20261001153000_gcse_teacher_suite_phases_8_17_schema.sql');
const rpc = read('supabase/migrations/20261001153100_gcse_teacher_suite_phases_8_17_rpcs.sql');
const accuracy = read('supabase/migrations/20261001154500_gcse_teacher_suite_phases_8_17_accuracy_indexes.sql');

contains(loader,'teacher-suite-phases8-17.css','Teacher Suite styles are loaded');
contains(loader,'teacher-suite-phases8-17.js','Teacher Suite client is loaded');
contains(loader,'teacher-suite-live-enhancements.js','Teacher Suite live enhancements are loaded after the main suite');
contains(js,"['live','8','Live Classroom']",'Phase 8 Live Classroom is registered');
contains(js,"['resources','9','Resource Generator']",'Phase 9 Resource Generator is registered');
contains(js,"['planning','10','Lesson Planning']",'Phase 10 Lesson Planning is registered');
contains(js,"['presentation','11','Presentation Controls']",'Phase 11 Presentation Controls is registered');
contains(js,"['interventions','12','Intervention Dashboard']",'Phase 12 Intervention Dashboard is registered');
contains(js,"['reports','13','Reports']",'Phase 13 Reports is registered');
contains(js,"['parents','14','Parent Summaries']",'Phase 14 Parent Summaries is registered');
contains(js,"['department','15','Department Dashboard']",'Phase 15 Department Dashboard is registered');
contains(js,"['collaboration','16','Teacher Collaboration']",'Phase 16 Teacher Collaboration is registered');
contains(js,"['school','17','School Admin']",'Phase 17 School Admin is registered');

for (const fn of ['gcse_start_live_classroom','gcse_update_live_classroom','gcse_end_live_classroom','gcse_join_live_classroom','gcse_submit_live_response','gcse_live_classroom_snapshot']) {
  contains(js,fn,`Phase 8 client calls ${fn}`);
  contains(rpc,fn,`Phase 8 server versions ${fn}`);
}
contains(js,'data-student-live-classroom','students get a live-classroom join surface');
contains(rpc,'class_membership_required','live responses require class membership');
contains(rpc,"m.status='joined'",'live session join is scoped to joined students');
contains(enhancements,'data-live-student-refresh','students can refresh to receive the teacher’s next live activity');
contains(enhancements,'joinForm.requestSubmit()','student activity refresh re-checks the authenticated live session');

for (const type of ['retrieval','worksheet','exit_ticket','homework','practical','revision']) contains(js,`type==='${type}'`,`Phase 9 generates ${type} resources`);
contains(js,'gcse_teacher_resources','Phase 9 resources persist to Supabase');
contains(js,'printResource','Phase 9 resources can be printed');

for (const stage of ['Retrieval starter','Knowledge build','Worked model','Guided practice','Independent application','Exit check']) contains(js,stage,`Phase 10 includes ${stage}`);
contains(js,'gcse_lesson_plans','Phase 10 plans persist to Supabase');
contains(js,'duration_minutes','Phase 10 stores lesson duration');

for (const mode of ['normal','blackout','question','answer']) contains(schema,`'${mode}'`,`Phase 11 schema permits ${mode} mode`);
contains(js,'slide_index','Phase 11 controls slide position');
contains(js,'timer_ends_at','Phase 11 controls a classroom timer');
contains(js,'Open course presentation','Phase 11 links presentation controls back to course content');
contains(enhancements,'setInterval(tick,1000)','Phase 11 classroom timer visibly ticks every second');
contains(enhancements,"gcse_presentation_sessions",'timer enhancement restores the live timer after a UI render');

contains(js,'gcse_intervention_dashboard','Phase 12 uses server-side intervention analytics');
contains(rpc,'private.gcse_intervention_attempts','Phase 12 reads intervention evidence server-side');
contains(js,'Avg improvement','Phase 12 shows improvement evidence');
contains(accuracy,'count(distinct i.id)','Phase 12 active intervention count is not multiplied by student targets');

contains(js,'gcse_build_teacher_report','Phase 13 builds reports server-side');
contains(js,'Export CSV','Phase 13 supports CSV export');
contains(rpc,"'assessmentAverage'",'Phase 13 report includes assessment evidence');
contains(rpc,"'homeworkSubmitted'",'Phase 13 report includes homework evidence');
contains(accuracy,"ga.audience_mode='class'",'Phase 13 homework totals only include work actually assigned to a student');
contains(accuracy,'public.gcse_assignment_targets gt','Phase 13 selected-student homework is counted accurately');

contains(js,'gcse_build_parent_summary','Phase 14 builds parent summaries server-side');
contains(schema,'private.gcse_parent_summaries','Phase 14 summaries are stored in the private schema');
contains(schema,'revoke all on table private.gcse_parent_summaries from public,anon,authenticated','parent summary table is not directly browser-readable');
contains(rpc,'not an official predicted grade','parent summary labels evidence appropriately');
contains(accuracy,"homeworkRecorded",'Phase 14 uses the refined assigned-homework total');

contains(js,'gcse_create_department','Phase 15 can create departments');
contains(js,'gcse_department_add_teacher','Phase 15 can add explicit teacher members');
contains(js,'gcse_department_dashboard','Phase 15 loads a department dashboard');
contains(schema,'private.gcse_is_department_member','department access is membership-gated');
contains(schema,'private.gcse_is_department_admin','department management is lead/owner-gated');

contains(js,'gcse_collaboration_items','Phase 16 persists shared collaboration items');
contains(js,'gcse_collaboration_comments','Phase 16 supports department comments');
contains(schema,'gcse_collaboration_items_member_read','collaboration is limited to department members');

contains(js,'schoolAdminEligible','Phase 17 hides school admin controls from ordinary teachers');
contains(js,'gcse_create_school','Phase 17 can create school workspaces');
contains(js,'gcse_school_add_staff','Phase 17 manages explicit staff membership');
contains(js,'gcse_school_dashboard','Phase 17 loads school-wide summary data');
contains(schema,'private.gcse_has_school_admin_access','school administration is server role-gated');
contains(schema,"p.role in ('school_admin','platform_admin')",'school admin helper recognises school/platform admin roles');

for (const table of [
  'gcse_live_classroom_sessions','gcse_live_classroom_responses','gcse_teacher_resources','gcse_lesson_plans','gcse_presentation_sessions','gcse_teacher_reports',
  'gcse_departments','gcse_department_members','gcse_collaboration_items','gcse_collaboration_comments','gcse_schools','gcse_school_members'
]) contains(schema,`public.${table}`,`${table} is versioned in the schema`);
contains(schema,'enable row level security','new public teacher-suite tables use RLS');
contains(rpc,'private.gcse_has_teacher_access()','teacher RPCs validate teacher access');
contains(rpc,'private.gcse_has_school_admin_access()','school creation validates school-admin access');
for(const index of ['gcse_live_responses_class_idx','gcse_live_responses_teacher_idx','gcse_parent_summaries_student_idx','gcse_collaboration_comments_department_idx','gcse_schools_owner_idx']) contains(accuracy,index,`${index} is versioned for release performance`);

contains(css,'.teacher-suite-modal','Teacher Suite modal is styled');
contains(css,'body.teacher-suite-open{overflow:hidden}','Teacher Suite correctly locks background scrolling while open');
contains(css,'@media(max-width:600px)','Teacher Suite has mobile layout rules');
contains(css,'.student-live-classroom','student live-classroom panel is styled');

if(process.exitCode){console.error('\nTeacher Platform phases 8-17 audit failed.');process.exit(process.exitCode);}
console.log('\nTeacher Platform phases 8-17 audit passed.');
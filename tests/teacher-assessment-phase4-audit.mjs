import fs from 'node:fs';

const ui = fs.readFileSync('teacher-assessments.js','utf8');
const css = fs.readFileSync('teacher-assessments.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const schema = fs.readFileSync('supabase/migrations/20261001114741_gcse_teacher_assessment_phase_4.sql','utf8');
const server = fs.readFileSync('supabase/migrations/20261001115704_gcse_assessment_phase_4_server_actions.sql','utf8');
const permissions = fs.readFileSync('supabase/migrations/20261001114845_gcse_assessment_attempt_answer_permissions.sql','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Assessments & markbook',
  'Assessment builder',
  '+ Create assessment',
  'Whole class',
  'Selected students',
  'Combined Science',
  'Separate / Triple Science',
  'Foundation',
  'Higher',
  'Paper 1',
  "rpc('gcse_create_assessment'",
  "rpc('gcse_student_assessments'",
  "rpc('gcse_start_assessment'",
  "rpc('gcse_save_assessment_answers'",
  "rpc('gcse_submit_assessment'",
  "rpc('gcse_teacher_assessment_key'",
  'Mark scheme',
  'assessment-run-modal',
  'data-student-assessments',
  'ends_at',
  'Automated practice mark',
  'indicative automated marking'
]) must(ui.includes(token), `Missing Phase 4 assessment behaviour: ${token}`);

for (const token of [
  'create table if not exists public.gcse_assessments',
  'create table if not exists private.gcse_assessment_keys',
  'create table if not exists public.gcse_assessment_targets',
  'create table if not exists public.gcse_assessment_attempts',
  'alter table public.gcse_assessments enable row level security',
  'alter table public.gcse_assessment_targets enable row level security',
  'alter table public.gcse_assessment_attempts enable row level security',
  'revoke all on table private.gcse_assessment_keys from anon, authenticated, public',
  'gcse_assessment_attempts_student_select'
]) must(schema.toLowerCase().includes(token.toLowerCase()), `Missing Phase 4 schema/security rule: ${token}`);

for (const token of [
  'private.gcse_grade_assessment',
  'private.gcse_assessment_point_matches',
  'public.gcse_create_assessment',
  'public.gcse_set_assessment_status',
  'public.gcse_teacher_assessment_key',
  'public.gcse_student_assessments',
  'public.gcse_start_assessment',
  'public.gcse_save_assessment_answers',
  'public.gcse_submit_assessment',
  'private.gcse_assessment_keys',
  "raise exception 'teacher_access_required'",
  "raise exception 'assessment_not_assigned'",
  'least(a.closes_at,now()+make_interval',
  'timed_out=true',
  'topic_breakdown',
  'review'
]) must(server.toLowerCase().includes(token.toLowerCase()), `Missing secure assessment server rule: ${token}`);

must(permissions.includes('revoke insert, update, delete on table public.gcse_assessment_attempts from authenticated'), 'Students must not directly mutate assessment attempts.');
must(loader.includes('teacher-assessments.css'), 'Assessment stylesheet is not loaded.');
must(loader.includes('teacher-assessments.js'), 'Assessment script is not loaded.');
must(css.includes('.teacher-assessment-modal'), 'Teacher assessment modal styles missing.');
must(css.includes('.assessment-run-modal'), 'Timed student assessment styles missing.');
must(css.includes('.assessment-review-modal'), 'Assessment mark-scheme styles missing.');
must(!ui.includes('service_role'), 'Frontend assessment code must never contain a service-role key.');
must(!ui.includes('gcse_assessment_keys'), 'Frontend must never directly read the private answer-key table.');

console.log('TEACHER ASSESSMENT PHASE 4 AUDIT PASSED: builder, targeting, timed student mode, private answer keys, server-side marking, markbook and post-submit review are present.');
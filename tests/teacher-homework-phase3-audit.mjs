import fs from 'node:fs';

const ui = fs.readFileSync('teacher-homework.js','utf8');
const css = fs.readFileSync('teacher-homework.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const schema = fs.readFileSync('supabase/migrations/20261001113224_gcse_teacher_homework_phase_3.sql','utf8');
const access = fs.readFileSync('supabase/migrations/20261001113247_gcse_teacher_homework_phase_3_client_access.sql','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Homework & assignments',
  '+ Set homework',
  "client.from('gcse_assignments')",
  "client.from('gcse_assignment_targets')",
  "client.from('gcse_assignment_submissions')",
  'Whole class',
  'Selected students',
  'Available from',
  'Due date',
  'Minimum score %',
  'Attempts allowed',
  'Publish now',
  'Save as draft',
  'View students',
  'Mark submitted',
  'student-homework-panel',
  'data-homework-start',
  'data-homework-submit'
]) must(ui.includes(token), `Missing homework behaviour: ${token}`);

for (const token of [
  'create table if not exists public.gcse_assignments',
  'create table if not exists public.gcse_assignment_targets',
  'create table if not exists public.gcse_assignment_submissions',
  "assignment_type in ('lesson','topic','quiz','revision','mock','custom')",
  "audience_mode in ('class','selected')",
  "status in ('draft','published','closed')",
  'alter table public.gcse_assignments enable row level security',
  'alter table public.gcse_assignment_targets enable row level security',
  'alter table public.gcse_assignment_submissions enable row level security',
  'private.gcse_has_teacher_access()'
]) must(schema.includes(token), `Missing homework schema/security rule: ${token}`);

for (const token of [
  'gcse_assignments_student_select',
  "status = 'published'",
  'available_from <= now()',
  'gcse_class_members',
  'gcse_assignment_targets_student_select',
  'gcse_assignment_submissions_student_insert',
  'student_id = (select auth.uid())'
]) must(access.toLowerCase().includes(token.toLowerCase()), `Missing student assignment access rule: ${token}`);

must(loader.includes('teacher-homework.css'), 'Homework stylesheet is not loaded.');
must(loader.includes('teacher-homework.js'), 'Homework script is not loaded.');
must(css.includes('.teacher-homework-modal'), 'Teacher homework modal styles missing.');
must(css.includes('.student-homework-panel'), 'Student homework inbox styles missing.');
must(!ui.includes('service_role'), 'Frontend homework code must never contain a service-role key.');

console.log('TEACHER HOMEWORK PHASE 3 AUDIT PASSED: class/selected assignments, due dates, drafts/publishing, student inbox, submission states, teacher tracking, RLS and course links are present.');
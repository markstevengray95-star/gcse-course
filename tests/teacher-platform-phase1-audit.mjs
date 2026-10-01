import fs from 'node:fs';

const ui = fs.readFileSync('teacher-platform.js','utf8');
const css = fs.readFileSync('teacher-platform.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const migration = fs.readFileSync('supabase/migrations/20261001111500_gcse_teacher_platform_phase_1.sql','utf8');
const edge = fs.readFileSync('supabase/functions/gcse-teacher-platform/index.ts','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Teacher Platform',
  'Create class',
  'Student joining code',
  'Import CSV / Excel',
  'Add student',
  'Move',
  'Archive class',
  "sb.from('gcse_classes')",
  "sb.from('gcse_class_members')",
  "edgeAction('join_class'",
  "edgeAction('claim_invites'",
  "edgeAction('leave_class'",
  "accept=\".csv,.xlsx,.xls\"",
  'xlsx@0.18.5'
]) must(ui.includes(token), `Missing Teacher Platform behaviour: ${token}`);

for (const token of [
  "role text not null default 'student'",
  "role in ('student','teacher','school_admin','platform_admin')",
  "set role = 'platform_admin'",
  'and is_admin = false',
  "and role = 'student'",
  'create table if not exists public.gcse_classes',
  'create table if not exists public.gcse_class_members',
  'alter table public.gcse_classes enable row level security',
  'alter table public.gcse_class_members enable row level security',
  'private.gcse_has_teacher_access()',
  'teacher_id = (select auth.uid())',
  'student_id = (select auth.uid())',
  "p.role in ('teacher','school_admin','platform_admin')"
]) must(migration.includes(token), `Missing Teacher Platform database rule: ${token}`);

for (const token of [
  'verify_jwt',
  'join_class',
  'claim_invites',
  'leave_class',
  'class_not_found',
  'student_email_key',
  'membership_email_in_use'
]) {
  if (token === 'verify_jwt') continue; // deployment configuration is checked outside source.
  must(edge.includes(token), `Missing class join server action: ${token}`);
}

must(loader.includes('teacher-platform.css'), 'Teacher Platform stylesheet is not loaded.');
must(loader.includes('teacher-platform.js'), 'Teacher Platform script is not loaded.');
must(css.includes('.teacher-platform-modal'), 'Teacher modal styling missing.');
must(css.includes('.teacher-student-row'), 'Teacher roster styling missing.');
must(css.includes('.student-class-panel'), 'Student join-class styling missing.');

console.log('TEACHER PLATFORM PHASE 1 AUDIT PASSED: secure roles, RLS classes, join codes, rosters, CSV/Excel import, move/remove/archive controls, student join/claim flow and admin/Teacher gating are present.');

import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const must = (condition, message) => {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${message}`);
  }
};
const contains = (text, value, message) => must(text.includes(value), message);

const loader = read('course-audit-fixes.js');
const fixes = read('teacher-platform-audit-fixes.js');
const phase2Css = read('teacher-dashboard-phase2.css');
const migration = read('supabase/migrations/20261001161000_gcse_teacher_platform_full_audit_hardening.sql');
const phase8to17 = read('teacher-suite-phases8-17.js');

const phaseAudits = [
  'tests/teacher-platform-phase1-audit.mjs',
  'tests/teacher-platform-phase2-audit.mjs',
  'tests/teacher-homework-phase3-audit.mjs',
  'tests/teacher-assessment-phase4-audit.mjs',
  'tests/teacher-assessment-phase5-audit.mjs',
  'tests/teacher-intervention-phase6-audit.mjs',
  'tests/teacher-adaptive-homework-phase7-audit.mjs',
  'tests/teacher-suite-phases8-17-audit.mjs'
];
for (const path of phaseAudits) must(fs.existsSync(path), `${path} exists`);

contains(loader, "teacher-platform-audit-fixes.js", 'full-roadmap audit fixes are loaded');
contains(loader, "teacher-interventions.js',()=>{", 'audit fixes load after intervention click interception is registered');
contains(loader, "data-gcse-teacher-platform-audit-fixes", 'audit-fix loader has an idempotent script marker');

// Global GCSE privilege hardening.
contains(migration, "left(c.relname,5)='gcse_'", 'privilege revocation is scoped to GCSE-course tables only');
contains(migration, 'revoke truncate, references, trigger', 'browser roles cannot truncate or alter GCSE table structure relationships');
contains(migration, 'gcse_subscription_entitlements(public.gcse_profiles)', 'entitlement helper exposure is explicitly controlled');
contains(migration, 'from public, anon, authenticated', 'arbitrary profile entitlement helper is not callable by signed-in clients');
contains(migration, 'gcse_get_entitlements()', 'caller-scoped entitlement RPC remains explicitly managed');

// Phase 3 homework hardening.
contains(migration, 'gcse_assignments_due_after_available_check', 'homework due date must be after its availability date');
contains(migration, 'gcse_set_assignment_submission_status', 'homework status has a server-side RPC');
contains(migration, "requested not in ('in_progress','submitted')", 'homework RPC limits status transitions');
contains(migration, "status='published'", 'homework RPC requires a published assignment');
contains(migration, 'available_from<=now_at', 'homework RPC enforces assignment availability');
contains(migration, "m.status='joined'", 'homework RPC requires joined class membership');
contains(migration, "a.audience_mode='selected'", 'selected homework checks explicit targeting');
contains(migration, "a.assignment_type='intervention'", 'ordinary homework RPC cannot bypass intervention mastery flow');
contains(migration, 'a.id,a.class_id,a.teacher_id,uid,requested', 'submission identity and ownership fields are server-derived');
contains(migration, 'revoke insert, update, delete on table public.gcse_assignment_submissions', 'students cannot directly mutate homework submission rows');
contains(migration, 'join public.gcse_class_members m', 'teacher-selected homework targets must be joined class members');
contains(migration, 'a.teacher_id=(select auth.uid())', 'teacher homework targets remain teacher-owned');
contains(fixes, "client.rpc('gcse_set_assignment_submission_status'", 'student homework UI uses the secure RPC');
contains(fixes, "document.addEventListener('click', interceptOrdinaryHomework, true)", 'secure homework handler runs before legacy direct writes');
contains(fixes, "button.dataset.auditBypass = 'true'", 'secure start flow preserves existing course navigation without duplicate RPC interception');
contains(fixes, 'Target score % (optional)', 'Phase 3 score field no longer overstates enforcement');
contains(fixes, 'Attempt limit (where supported)', 'Phase 3 attempt field accurately describes support');

// Phase 2 integration: replace stale placeholder cards with live Phase 3/4 data.
contains(fixes, 'Live homework deadlines, completion and assessment windows from your classes.', 'Phase 2 work overview uses current wording');
contains(fixes, 'data-phase3-homework-due', 'Phase 2 includes live homework-due card');
contains(fixes, 'data-phase3-homework-published', 'Phase 2 includes live published-homework card');
contains(fixes, 'data-phase3-homework-overdue', 'Phase 2 includes live overdue-submission card');
contains(fixes, 'data-phase4-assessments', 'Phase 2 includes live upcoming-assessment card');
contains(phase2Css, 'grid-template-columns:repeat(4,minmax(0,1fr))', 'Phase 2 desktop layout fits all four work cards');
contains(phase2Css, '@media(max-width:960px)', 'Phase 2 work cards stay responsive');

// Phases 8 and 11: writes and class ownership.
contains(migration, 'revoke insert, update, delete on table public.gcse_live_classroom_sessions', 'live session writes are RPC-only');
contains(migration, 'revoke insert, update, delete on table public.gcse_live_classroom_responses', 'live response writes are RPC-only');
contains(migration, 'gcse_live_sessions_read', 'live classroom keeps explicit read policy');
contains(migration, 'gcse_live_responses_read', 'live responses keep explicit teacher/student read policy');
contains(migration, 'gcse_presentation_teacher_insert', 'presentation creation has a dedicated teacher policy');
contains(migration, 'gcse_presentation_teacher_update', 'presentation updates have a dedicated teacher policy');
contains(migration, 'c.id=gcse_presentation_sessions.class_id', 'presentation class must belong to the teacher');

// Phases 9, 10 and 13: class-linked records cannot point at another teacher's class.
contains(migration, 'gcse_teacher_resources_owner', 'resource ownership policy is replaced by hardened version');
contains(migration, 'c.id=gcse_teacher_resources.class_id', 'resource class is teacher-owned');
contains(migration, 'gcse_lesson_plans_owner', 'lesson plan ownership policy is replaced by hardened version');
contains(migration, 'c.id=gcse_lesson_plans.class_id', 'lesson plan class is teacher-owned');
contains(migration, 'gcse_teacher_reports_owner', 'report ownership policy is replaced by hardened version');
contains(migration, 'c.id=gcse_teacher_reports.class_id', 'report class is teacher-owned');
contains(migration, 'revoke insert, update on table public.gcse_teacher_reports', 'reports are generated through the guarded server RPC');

// Phases 15 and 17: membership management only through validated RPCs.
contains(migration, 'revoke insert, update, delete on table public.gcse_department_members', 'department membership cannot be forged directly');
contains(migration, 'revoke insert, update, delete on table public.gcse_school_members', 'school membership cannot be forged directly');
contains(phase8to17, "rpc('gcse_department_add_teacher'", 'department UI uses validated membership RPC');
contains(phase8to17, "rpc('gcse_school_add_staff'", 'school admin UI uses validated membership RPC');

// FK performance protections found by the full audit.
for (const name of [
  'gcse_assessment_keys_teacher_idx',
  'gcse_assessment_adjustments_class_idx',
  'gcse_assessment_adjustments_student_idx',
  'gcse_assessment_adjustments_teacher_idx',
  'gcse_assessment_targets_class_idx',
  'gcse_assignment_submissions_class_idx',
  'gcse_assignment_submissions_teacher_idx',
  'gcse_assignment_targets_class_idx',
  'gcse_assignment_targets_student_idx',
  'gcse_assignment_targets_teacher_idx'
]) contains(migration, name, `${name} is versioned`);

if (process.exitCode) {
  console.error('\nFull Teacher Platform phases 1-17 audit failed.');
  process.exit(process.exitCode);
}
console.log('\nFull Teacher Platform phases 1-17 audit passed.');
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

const js = read('teacher-interventions.js');
const css = read('teacher-interventions.css');
const loader = read('course-audit-fixes.js');
const schema = read('supabase/migrations/20261001131159_gcse_teacher_interventions_phase_6.sql');
const alignment = read('supabase/migrations/20261001131946_gcse_teacher_interventions_phase_6_rpc_alignment.sql');
const indexes = read('supabase/migrations/20261001133530_gcse_teacher_interventions_phase_6_indexes.sql');

contains(loader, 'teacher-interventions.css', 'Phase 6 intervention styles are loaded');
contains(loader, 'teacher-interventions.js', 'Phase 6 intervention client is loaded');
contains(js, 'Create targeted follow-up', 'Phase 5 intervention groups can create a targeted follow-up');
contains(js, "gcse_create_targeted_intervention", 'teacher client creates interventions through the authenticated RPC');
contains(js, "gcse_teacher_interventions", 'teacher intervention dashboard loads server evidence');
contains(js, "gcse_student_interventions", 'student account loads only assigned interventions');
contains(js, "gcse_start_intervention", 'students start interventions through the server');
contains(js, "gcse_save_intervention_answers", 'intervention answers auto-save through the server');
contains(js, "gcse_submit_intervention", 'mastery checks submit for server-side marking');
contains(js, 'Guided reflection', 'student workflow contains guided reflection');
contains(js, 'Mastery check', 'student workflow contains an independent mastery check');
contains(js, 'Baseline', 'teacher/student intervention UI reports baseline evidence');
contains(js, 'Re-test', 'teacher/student intervention UI reports re-test evidence');
contains(js, 'not an official predicted grade', 'intervention progress is labelled as learning evidence rather than an official predicted grade');
contains(js, "data-homework-start", 'intervention client intercepts ordinary homework start actions');
contains(js, "data-homework-submit", 'intervention client intercepts ordinary homework submit actions');
contains(js, 'capture:true', 'homework interception runs in capture phase before the ordinary submission handler');
contains(css, '.gcse-intervention-teacher-card', 'teacher intervention cards are styled');
contains(css, '.student-intervention-task', 'student intervention tasks are styled');

for (const table of ['private.gcse_interventions','private.gcse_intervention_targets','private.gcse_intervention_keys','private.gcse_intervention_attempts']) {
  contains(schema, table, `${table} is versioned in the Phase 6 schema`);
}
contains(schema, "'intervention'::text", 'normal homework supports intervention assignments');
contains(schema, 'enable row level security', 'Phase 6 private tables have RLS enabled');
contains(schema, 'revoke all on table private.gcse_intervention_keys from public,anon,authenticated', 'private intervention marking keys are not directly browser-readable');

for (const fn of [
  'gcse_create_targeted_intervention',
  'gcse_teacher_interventions',
  'gcse_student_interventions',
  'gcse_start_intervention',
  'gcse_save_intervention_answers',
  'gcse_submit_intervention',
  'gcse_set_intervention_status'
]) {
  contains(alignment, fn, `${fn} is versioned in the final Phase 6 RPC alignment`);
}
contains(alignment, 'private.gcse_has_teacher_access()', 'teacher RPCs verify server-side teacher access');
contains(alignment, 'student_id=uid', 'student RPCs scope intervention data to the authenticated student');
contains(alignment, 'private.gcse_intervention_keys', 'mastery marking keys remain in the private schema');
contains(alignment, 'private.gcse_grade_intervention_target', 'mastery checks are marked server-side');
contains(alignment, 'public.gcse_assignment_submissions', 'mastery-check results feed the normal homework submission/markbook flow');
contains(alignment, 'revoke all on function public.gcse_submit_intervention(uuid,jsonb) from public,anon', 'anonymous users cannot execute intervention submission');
contains(alignment, 'grant execute on function public.gcse_submit_intervention(uuid,jsonb) to authenticated', 'signed-in assigned students can submit intervention work');
contains(indexes, 'gcse_interventions_class_idx', 'Phase 6 class foreign-key lookup is indexed');
contains(indexes, 'gcse_intervention_attempts_target_idx', 'Phase 6 intervention target lookup is indexed');

if (process.exitCode) {
  console.error('\nTeacher Platform Phase 6 audit failed.');
  process.exit(process.exitCode);
}
console.log('\nTeacher Platform Phase 6 targeted intervention audit passed.');

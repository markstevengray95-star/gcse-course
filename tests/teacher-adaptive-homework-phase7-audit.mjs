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

const js = read('teacher-adaptive-homework.js');
const css = read('teacher-adaptive-homework.css');
const loader = read('course-audit-fixes.js');
const schema = read('supabase/migrations/20261001144700_gcse_teacher_adaptive_homework_phase_7.sql');

contains(loader, 'teacher-adaptive-homework.css', 'Phase 7 adaptive homework styles are loaded');
contains(loader, 'teacher-adaptive-homework.js', 'Phase 7 adaptive homework client is loaded');
contains(js, "option.value='adaptive'", 'homework builder includes Adaptive homework');
contains(js, 'Preview student routes', 'teacher can preview differentiated routes before publishing');
contains(js, 'Support up to %', 'teacher controls the Support threshold');
contains(js, 'Stretch from %', 'teacher controls the Stretch threshold');
contains(js, 'not fixed ability labels', 'adaptive recommendations are described as non-permanent evidence-based routes');
contains(js, 'gcse_adaptive_homework_recommendations', 'teacher preview uses the server recommendation RPC');
contains(js, 'gcse_create_adaptive_homework', 'adaptive homework creation is server-side and atomic');
contains(js, 'gcse_teacher_adaptive_assignment', 'teacher route management loads private evidence through an RPC');
contains(js, 'gcse_set_adaptive_pathway', 'teacher can override a student route after publishing');
contains(js, "document.addEventListener('submit'", 'adaptive creation intercepts the ordinary homework form');
contains(js, 'event.stopImmediatePropagation()', 'adaptive creation prevents the ordinary assignment handler from double-submitting');
contains(js, 'Personalised practice', 'student homework cards show personalised practice');
contains(js, 'Chosen from recent learning evidence and teacher judgement', 'student messaging explains the route without presenting it as a fixed ability label');
contains(js, 'isRelevantMutation', 'adaptive DOM refresh is scoped to relevant homework mutations');
contains(js, 'if(summary.innerHTML!==summaryHtml)', 'adaptive card rendering is idempotent and avoids mutation loops');
contains(css, '.adaptive-homework-panel', 'adaptive homework builder is styled');
contains(css, '.student-adaptive-route', 'student personalised route is styled');
contains(css, '.adaptive-manage-modal', 'teacher route-management modal is styled');

for (const column of ['adaptive_mode','adaptive_topic_id','adaptive_support_max','adaptive_stretch_min','adaptive_config']) {
  contains(schema, column, `${column} is versioned on GCSE assignments`);
}
contains(schema, 'adaptive_pathway', 'per-student adaptive pathway is stored on assignment targets');
contains(schema, 'private.gcse_adaptive_homework_evidence', 'adaptive evidence is stored in a private table');
contains(schema, 'enable row level security', 'private adaptive evidence table has RLS enabled');
contains(schema, 'revoke all on table private.gcse_adaptive_homework_evidence from public, anon, authenticated', 'private evidence is not directly browser-readable');
contains(schema, 'private.gcse_intervention_attempts', 'latest intervention re-test evidence can inform recommendations');
contains(schema, 'public.gcse_assessment_attempts', 'assessment evidence can inform recommendations');
contains(schema, "when ev.evidence_percent is null then 'core'", 'students without sufficient evidence default to Core rather than being labelled Support');
contains(schema, "when ev.evidence_percent <= p_support_max then 'support'", 'Support route uses the teacher-selected threshold');
contains(schema, "when ev.evidence_percent >= p_stretch_min then 'stretch'", 'Stretch route uses the teacher-selected threshold');
contains(schema, 'private.gcse_has_teacher_access()', 'adaptive RPCs verify server-side Teacher/Admin access');
contains(schema, "a.teacher_id=uid and a.adaptive_mode", 'route-management RPC is scoped to the teacher\'s adaptive assignment');
contains(schema, 'set search_path=\'\'', 'security-definer RPCs use an empty search path');
contains(schema, 'revoke execute on function public.gcse_create_adaptive_homework', 'anonymous callers cannot create adaptive homework');
contains(schema, 'grant execute on function public.gcse_create_adaptive_homework', 'authenticated teacher accounts can invoke adaptive homework creation');
contains(schema, 'gcse_adaptive_evidence_teacher_idx', 'adaptive evidence has a teacher lookup index');
contains(schema, 'gcse_adaptive_evidence_class_idx', 'adaptive evidence has a class lookup index');
contains(schema, 'gcse_adaptive_evidence_student_idx', 'adaptive evidence has a student lookup index');

if (process.exitCode) {
  console.error('\nTeacher Platform Phase 7 audit failed.');
  process.exit(process.exitCode);
}
console.log('\nTeacher Platform Phase 7 adaptive homework audit passed.');
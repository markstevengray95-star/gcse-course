import fs from 'node:fs';

const ui = fs.readFileSync('teacher-assessment-analytics.js','utf8');
const css = fs.readFileSync('teacher-assessment-analytics.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const migration = fs.readFileSync('supabase/migrations/20261001123142_gcse_teacher_assessment_phase_5_analytics_interventions.sql','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Assessment analytics',
  'Question-by-question analysis',
  'Student × question heatmap',
  'Misconception / missed-point heatmap',
  'Suggested intervention groups',
  'Teacher mark review',
  'Mark adjustment audit trail',
  "rpc('gcse_assessment_analytics'",
  "rpc('gcse_adjust_assessment_mark'",
  'data-adjust-attempt',
  'Reason for change',
  'Original automated mark',
  'gcse-assessment-mark-adjusted',
  'professional judgement',
  'not diagnoses or permanent labels'
]) must(ui.includes(token), `Missing Phase 5 analytics behaviour: ${token}`);

for (const token of [
  'create table if not exists public.gcse_assessment_mark_adjustments',
  'auto_mark smallint',
  'previous_mark smallint',
  'new_mark smallint',
  'reason text not null',
  'enable row level security',
  'revoke all on table public.gcse_assessment_mark_adjustments from public,anon,authenticated',
  'public.gcse_assessment_analytics_base',
  'public.gcse_assessment_analytics',
  'public.gcse_adjust_assessment_mark',
  'public.gcse_assessment_adjustment_history',
  'private.gcse_has_teacher_access()',
  "raise exception 'teacher_access_required'",
  "raise exception 'adjustment_reason_required'",
  "raise exception 'mark_unchanged'",
  "'{autoAwarded}'",
  "'{teacherAdjusted}'",
  "'{teacherAdjustment}'",
  "'evidenceRule','Below 50% on this topic in this assessment'",
  "coalesce((q.value->>'teacherAdjusted')::int,0)>0",
  'score=total_score',
  'percent=pct',
  'topic_breakdown=breakdown',
  'revoke all on function public.gcse_assessment_analytics_base(uuid) from public,anon,authenticated'
]) must(migration.toLowerCase().includes(token.toLowerCase()), `Missing Phase 5 server/security rule: ${token}`);

must(loader.includes('teacher-assessment-analytics.css'), 'Phase 5 analytics stylesheet is not loaded.');
must(loader.includes('teacher-assessment-analytics.js'), 'Phase 5 analytics script is not loaded.');
must(css.includes('.assessment-heatmap'), 'Assessment heatmap styles missing.');
must(css.includes('.assessment-intervention-list'), 'Intervention group styles missing.');
must(css.includes('.assessment-adjustment-modal'), 'Mark-adjustment modal styles missing.');
must(css.includes('@media(max-width:820px)'), 'Phase 5 mobile layout missing.');
must(!ui.includes('gcse_assessment_mark_adjustments'), 'Frontend must not directly query the mark-adjustment audit table.');
must(!ui.includes('service_role'), 'Frontend Phase 5 code must never contain a service-role key.');

console.log('TEACHER ASSESSMENT PHASE 5 AUDIT PASSED: question analytics, heatmaps, misconception signals, suggested intervention groups, secure teacher mark adjustments, audit history and mobile UI are present.');
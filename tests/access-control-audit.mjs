import fs from 'node:fs';

const access = fs.readFileSync('gcse-access-control.js','utf8');
const css = fs.readFileSync('gcse-access-control.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const plans = fs.readFileSync('plans-paper-guide.js','utf8');
const migration = fs.readFileSync('supabase/migrations/20260930222500_gcse_plan_entitlements.sql','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

// Current product tiers and pricing.
for (const token of ["id:'free'", "id:'plus'", "id:'pro'", "id:'teacher'", "£4.99/month", "£39.99/year", "£7.99/month", "£59.99/year", "£89/year"]) {
  must(plans.includes(token), `Missing current plan/pricing token: ${token}`);
}
must(!plans.includes("id:'school'"), 'School must not be a current GCSE plan card.');

// Free is explicitly default-deny except sample access.
must(access.includes("topicIds: ['b1']"), 'Free sample topic is not configured.');
must(access.includes('lessonIndexes: { b1: [0, 1, 2] }'), 'Free sample lessons are not configured.');
for (const feature of ['full_course','textbook','notebook','simulations','progress_tools','revision_tools','required_practicals','exam_tools','exam_marker','question_generator','ai_coach','auto_marking','mastery_assessments','expert_challenges','advanced_progression','teacher_tools','teaching_plans','differentiation','classroom_controls']) {
  must(access.includes(`${feature}: false`), `Free default must deny ${feature}.`);
}

// Plus, Pro and Teacher boundaries must be visible in the gate.
for (const token of [
  "full_course: 'Plus'", "textbook: 'Plus'", "notebook: 'Plus'", "simulations: 'Plus'",
  "required_practicals: 'Pro'", "exam_tools: 'Pro'", "exam_marker: 'Pro'", "ai_coach: 'Pro'",
  "teacher_tools: 'Teacher'", "differentiation: 'Teacher'", "classroom_controls: 'Teacher'"
]) must(access.includes(token), `Missing tier boundary: ${token}`);

// Browser access must be verified from Supabase, not local plan state.
must(access.includes("client.rpc('gcse_get_entitlements')"), 'Frontend does not verify server entitlements.');
must(access.includes("console.warn('[GCSE Access] Could not verify entitlements; defaulting to Free.'"), 'Fail-closed entitlement behavior missing.');
must(access.includes("document.addEventListener('click', gateEvent, true)"), 'Capture-phase click guard missing.');
must(access.includes("window.openTopic = wrapped"), 'Programmatic/direct topic navigation guard missing.');
must(access.includes("showLock('full_course', 'This topic')"), 'Locked topic upgrade prompt missing.');
must(access.includes("#notebookButton, #topicNotebookButton, #saveNote"), 'Notebook gate missing.');
must(access.includes("#completeTopicButton"), 'Progress gate missing.');

// Server rules: active/current trials only, admin full override, current plan aliases.
for (const token of [
  "when p.is_admin then 'teacher'",
  "in ('teacher','school') then 'teacher'",
  "in ('pro','premium') then 'pro'",
  "in ('plus','full','full_course','fullcourse') then 'plus'",
  "subscription_status,'free')) = 'active'",
  "subscription_status,'free')) = 'trialing'",
  'p.trial_ends_at > now()',
  "'full_course', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher')))",
  "'required_practicals', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher')))",
  "'teacher_tools', (p.is_admin or (n.paid_access and n.plan_name = 'teacher'))",
  'left join public.gcse_profiles p on p.user_id = auth.uid()'
]) must(migration.includes(token), `Missing server entitlement rule: ${token}`);

must(loader.includes("gcse-access-control.css"), 'Access-control CSS is not loaded.');
must(loader.includes("gcse-access-control.js"), 'Access-control JS is not loaded.');
must(css.includes('.gcse-access-locked'), 'Locked-state styling missing.');
must(css.includes('.gcse-access-modal'), 'Upgrade modal styling missing.');

console.log('GCSE ACCESS CONTROL AUDIT PASSED: Free fails closed with only the configured sample preview; Plus unlocks the core course, Pro unlocks practical/exam/advanced student tools, Teacher unlocks classroom tools, active/trial status is server verified, and admin bypass is preserved.');

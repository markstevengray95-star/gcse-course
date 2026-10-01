import fs from 'node:fs';

const dashboard = fs.readFileSync('teacher-dashboard-phase2.js','utf8');
const css = fs.readFileSync('teacher-dashboard-phase2.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');
const edge = fs.readFileSync('supabase/functions/gcse-teacher-platform/index.ts','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Science progress dashboard',
  'Average progress',
  'Needs attention',
  'Active this week',
  'Class progress',
  'Weakest topics',
  'Recent learning activity',
  'Homework & assessments',
  'function studentProgress',
  'function topicEvidenceForClass',
  'function attentionStudents',
  'function overallWeakTopics',
  "action:'teacher_dashboard'",
  'gcse_classes',
  'gcse_class_members',
  'completed_lessons',
  'topic_scores',
  'mistakes',
  'mocks'
]) must(dashboard.includes(token), `Missing Teacher Platform phase 2 dashboard behaviour: ${token}`);

for (const token of [
  'teacher_dashboard',
  'teacherAccess',
  'gcse-science-lessons-v1',
  'gcse-revision-performance-v1',
  'gcse-mistake-bank-v1',
  'gcse-real-exam-history-v1',
  'completed_lessons',
  'topic_scores',
  'last_activity',
  'teacher_access_required',
  'status=eq.joined',
  'student_id=not.is.null'
]) must(edge.includes(token), `Missing secure teacher analytics behaviour: ${token}`);

must(!dashboard.includes("from('gcse_user_state')"), 'Browser dashboard must not directly read another student\'s gcse_user_state rows.');
must(!edge.includes('gcse-science-notebook'), 'Teacher analytics endpoint must not expose student notebook content.');
must(loader.includes('teacher-dashboard-phase2.css'), 'Teacher phase 2 stylesheet is not loaded.');
must(loader.includes('teacher-dashboard-phase2.js'), 'Teacher phase 2 script is not loaded.');
for (const selector of ['.teacher-dashboard-kpis','.teacher-dashboard-grid','.teacher-attention-list','.teacher-class-insights','.teacher-rag']) {
  must(css.includes(selector), `Missing Teacher dashboard styling: ${selector}`);
}

console.log('TEACHER PLATFORM PHASE 2 AUDIT PASSED: secure class analytics, progress KPIs, class snapshots, attention signals, weakest topics, recent activity, class insights and workload placeholders are present.');

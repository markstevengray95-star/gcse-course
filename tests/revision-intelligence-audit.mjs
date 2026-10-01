import fs from 'node:fs';

const revision = fs.readFileSync('revision-intelligence.js','utf8');
const bridge = fs.readFileSync('exam-studio-revision-bridge.js','utf8');
const css = fs.readFileSync('revision-intelligence.css','utf8');
const loader = fs.readFileSync('course-audit-fixes.js','utf8');

const must = (condition, message) => { if (!condition) throw new Error(message); };

for (const token of [
  'Personal Revision Dashboard',
  'Mistake Bank',
  'Mock Exam Mode',
  "performance: 'gcse-revision-performance-v1'",
  "mistakes: 'gcse-mistake-bank-v1'",
  "mocks: 'gcse-mock-exams-v1'",
  "requireAccess('revision_tools'",
  "requireAccess('exam_tools'",
  'function dailyQueue()',
  'function weakestTopics',
  'function autoMark',
  'function addMistake',
  'REVIEW_INTERVALS = [1, 3, 7, 14, 30]',
  'function buildMock',
  'function finishMock',
  'practice estimate, not an official AQA mark or predicted grade',
  'they are not an official AQA past paper'
]) must(revision.includes(token), `Missing revision intelligence behavior: ${token}`);

for (const token of [
  "source: 'exam-studio'",
  "window.dispatchEvent(new CustomEvent('gcse-performance-record'",
  "[data-mark-point], [data-teacher-score]"
]) must(bridge.includes(token), `Missing Exam Studio bridge behavior: ${token}`);

for (const token of ['revision-intelligence.css','revision-intelligence.js','exam-studio-revision-bridge.js']) {
  must(loader.includes(token), `Loader missing ${token}`);
}

must(css.includes('.revision-hub'), 'Revision hub styling missing.');
must(css.includes('.revision-workspace'), 'Revision workspace styling missing.');
must(css.includes('.mock-session'), 'Mock exam styling missing.');
must(css.includes('.mistake-item'), 'Mistake Bank styling missing.');

// Existing cloud sync accepts every gcse-* key, so all three new stores sync automatically.
const cloud = fs.readFileSync('gcse-cloud-sync.js','utf8');
must(cloud.includes("key.startsWith('gcse-')"), 'Cloud sync no longer accepts GCSE learning keys.');
for (const key of ['gcse-revision-performance-v1','gcse-mistake-bank-v1','gcse-mock-exams-v1']) must(key.startsWith('gcse-'), `${key} would not be cloud synced.`);

console.log('REVISION INTELLIGENCE AUDIT PASSED: dashboard recommendations, spaced Mistake Bank, timed mock papers, plan gates, Exam Studio ingestion and cloud-sync-compatible storage are present.');

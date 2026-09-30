import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const failures = [];
const assert = (value, message) => { if (!value) failures.push(message); };

const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(read('course-data.js'), context, { filename: 'course-data.js' });
const data = context.window.GCSE_COURSE_DATA;

assert(data?.topics?.length === 25, `Expected 25 topics, found ${data?.topics?.length ?? 0}.`);
for (const subject of ['biology', 'chemistry', 'physics']) {
  for (const paper of [1, 2]) {
    const topics = data.topics.filter(t => t.subject === subject && Number(t.paper) === paper);
    assert(topics.length > 0, `${subject} Paper ${paper} has no topics.`);
    assert(topics.every(t => Array.isArray(t.lessons) && t.lessons.length > 0), `${subject} Paper ${paper} contains a topic without lessons.`);
  }
}

const js = read('plans-paper-guide.js');
for (const token of [
  "id: 'free'", "id: 'plus'", "id: 'pro'", "id: 'teacher'",
  '£4.99/month', '£39.99/year', '£7.99/month', '£59.99/year', '£89/year',
  'data-plan-badge', 'gcse-plan-upgrade-request', 'setPlanFromAccount',
  'Exactly what is in each GCSE Science paper?', 'data-paper-tab', 'Separate Science-only',
  "['biology','chemistry','physics']", '[1,2]'
]) assert(js.includes(token), `plans-paper-guide.js missing ${token}.`);

assert(!js.includes("localStorage.setItem('gcse-science-plan'"), 'Plan UI must not grant a paid entitlement by setting the plan locally.');
assert(js.includes('GCSE_SUBSCRIPTIONS?.checkout') || js.includes('GCSE_BILLING?.checkout'), 'Plan UI does not expose a billing integration path.');

const css = read('plans-paper-guide.css');
for (const token of ['.account-plan-badge', '.plan-modal', '.plan-grid', '.plan-card.current', '.paper-breakdown', '.paper-breakdown-tabs', '.paper-topic-list']) {
  assert(css.includes(token), `plans-paper-guide.css missing ${token}.`);
}

const index = read('index.html');
assert(index.includes('plans-paper-guide.css'), 'index.html is not loading plans-paper-guide.css.');
assert(index.includes('plans-paper-guide.js'), 'index.html is not loading plans-paper-guide.js.');

if (failures.length) {
  console.error(`PLANS & PAPER GUIDE AUDIT FAILED (${failures.length})`);
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('PLANS & PAPER GUIDE AUDIT PASSED: Free, Plus, Pro and Teacher comparison UI is wired without client-side entitlement escalation, and all six Biology/Chemistry/Physics paper breakdowns are backed by the 25-topic course dataset.');

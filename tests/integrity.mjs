import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const context = {window:{},console};
vm.createContext(context);
vm.runInContext(read('course-data.js'), context, {filename:'course-data.js'});
vm.runInContext(read('rich-content.js'), context, {filename:'rich-content.js'});
vm.runInContext(read('question-bank.js'), context, {filename:'question-bank.js'});

const data = context.window.GCSE_COURSE_DATA;
const rich = context.window.GCSE_RICH_CONTENT;
const failures = [];
const assert = (condition, message) => { if(!condition) failures.push(message); };

assert(data && Array.isArray(data.topics), 'Course data did not load.');
assert(data?.topics?.length === 25, `Expected 25 GCSE topics, found ${data?.topics?.length ?? 0}.`);
assert(rich?.guides, 'Rich content guides did not load.');
assert(context.window.GCSE_EXTRA_QUESTION_BANK, 'Expanded question bank did not load.');

const ids = new Set();
let examQuestionCount = 0;
for(const topic of data.topics){
  assert(!ids.has(topic.id), `Duplicate topic id: ${topic.id}`);
  ids.add(topic.id);
  assert(['biology','chemistry','physics'].includes(topic.subject), `${topic.id}: invalid subject.`);
  assert([1,2].includes(topic.paper), `${topic.id}: invalid paper.`);
  assert(['combined','triple'].includes(topic.scope), `${topic.id}: invalid scope.`);
  assert(Array.isArray(topic.lessons) && topic.lessons.length > 0, `${topic.id}: no lessons.`);
  for(const [name,scope] of topic.lessons || []){
    assert(Boolean(name), `${topic.id}: lesson missing title.`);
    assert(['combined','triple'].includes(scope), `${topic.id}: lesson '${name}' has invalid scope.`);
  }
  assert(Array.isArray(topic.quiz) && topic.quiz.length >= 3, `${topic.id}: retrieval quiz should have at least 3 questions.`);
  const guide = rich.guides[topic.id];
  assert(Boolean(guide), `${topic.id}: missing rich-content guide.`);
  if(guide){
    assert(Array.isArray(guide.textbook) && guide.textbook.length >= 3, `${topic.id}: needs at least 3 textbook sections.`);
    assert(Array.isArray(guide.terms) && guide.terms.length >= 4, `${topic.id}: needs at least 4 key terms.`);
    assert(guide.worked?.title && Array.isArray(guide.worked?.steps), `${topic.id}: worked example incomplete.`);
    assert(guide.activity?.title && guide.activity?.task, `${topic.id}: activity incomplete.`);
    assert(Boolean(guide.sim), `${topic.id}: missing simulation type.`);
    assert(Array.isArray(guide.exam) && guide.exam.length >= 5, `${topic.id}: needs at least 5 exam questions after loading the expanded bank.`);
    examQuestionCount += guide.exam?.length || 0;
    for(const q of guide.exam || []){
      assert(typeof q[0] === 'string' && q[0].length > 5, `${topic.id}: invalid exam question.`);
      assert(Number.isFinite(q[1]) && q[1] > 0, `${topic.id}: invalid exam mark value.`);
      assert(Array.isArray(q[2]) && q[2].length > 0, `${topic.id}: exam question missing mark points.`);
    }
  }
}

const biology = data.topics.filter(t=>t.subject==='biology');
const chemistry = data.topics.filter(t=>t.subject==='chemistry');
const physics = data.topics.filter(t=>t.subject==='physics');
assert(biology.length===7, `Expected 7 Biology topics, found ${biology.length}.`);
assert(chemistry.length===10, `Expected 10 Chemistry topics, found ${chemistry.length}.`);
assert(physics.length===8, `Expected 8 Physics topics, found ${physics.length}.`);
assert(data.topics.find(t=>t.id==='p8')?.scope==='triple', 'P8 Space Physics must remain Separate Physics only.');
assert(examQuestionCount >= 125, `Expected at least 125 original exam-practice questions, found ${examQuestionCount}.`);

const index = read('index.html');
for(const asset of ['styles.css','rich-learning.css','course-enhancements.css','lesson-sequences.css','revision-mode.css','course-data.js','rich-content.js','question-bank.js','app.js','course-enhancements.js','lesson-sequences.js','revision-mode.js']){
  assert(index.includes(asset), `index.html does not reference ${asset}.`);
}
for(const tab of ['overview','lessons','textbook','practicals','activities','simulation','equations','exam','quiz','coach']){
  assert(index.includes(`data-tab="${tab}"`), `Missing topic tab: ${tab}.`);
}

const sequenceSource = read('lesson-sequences.js');
for(const required of ['Retrieval starter','Teaching chunks','Guided practice','Independent practice','Exam challenge','Plenary / exit ticket','Required practical mastery']){
  assert(sequenceSource.includes(required), `lesson-sequences.js missing required learning phase: ${required}.`);
}
assert(sequenceSource.includes('practicalRules'), 'Detailed practical rule bank is missing.');
assert(sequenceSource.includes('promptRules'), 'Detailed lesson prompt rule bank is missing.');

const revisionSource = read('revision-mode.js');
for(const required of ['Practice tier','Mixed revision','Foundation practice','Higher practice','Mastery:','gcse-science-mixed-revision-history-v1']){
  assert(revisionSource.includes(required), `revision-mode.js missing required feature text: ${required}.`);
}
assert(revisionSource.includes('source:\'mixed-revision\''), 'Mixed revision attempts are not linked to mastery tracking.');
assert(revisionSource.includes('filter(matchesTier)'), 'Practice tier filter is not applied to question selection.');

if(failures.length){
  console.error(`Integrity checks failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`GCSE course integrity checks passed: ${data.topics.length} topics, ${data.topics.reduce((n,t)=>n+t.lessons.length,0)} lesson entries, ${Object.keys(rich.guides).length} rich guides, ${examQuestionCount} exam-practice questions, guided lessons and mixed revision present.`);

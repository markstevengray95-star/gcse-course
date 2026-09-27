import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const context = {window:{},console};
vm.createContext(context);
vm.runInContext(read('course-data.js'), context, {filename:'course-data.js'});
vm.runInContext(read('physics-spec-detail.js'), context, {filename:'physics-spec-detail.js'});
vm.runInContext(read('rich-content.js'), context, {filename:'rich-content.js'});
vm.runInContext(read('physics-lesson-content.js'), context, {filename:'physics-lesson-content.js'});
vm.runInContext(read('question-bank.js'), context, {filename:'question-bank.js'});

const data = context.window.GCSE_COURSE_DATA;
const physicsSpec = context.window.GCSE_PHYSICS_SPEC_DETAIL;
const physicsLessonContent = context.window.GCSE_PHYSICS_LESSON_CONTENT;
const rich = context.window.GCSE_RICH_CONTENT;
const failures = [];
const assert = (condition, message) => { if(!condition) failures.push(message); };

assert(data && Array.isArray(data.topics), 'Course data did not load.');
assert(data?.topics?.length === 25, `Expected 25 GCSE topics, found ${data?.topics?.length ?? 0}.`);
assert(physicsSpec?.topics, 'Detailed AQA Physics specification map did not load.');
assert(physicsLessonContent?.rules, 'Lesson-specific Physics teaching content did not load.');
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

const expectedPhysics = [
  ['p1','4.1','Energy',1],
  ['p2','4.2','Electricity',1],
  ['p3','4.3','Particle model of matter',1],
  ['p4','4.4','Atomic structure',1],
  ['p5','4.5','Forces',2],
  ['p6','4.6','Waves',2],
  ['p7','4.7','Magnetism and electromagnetism',2],
  ['p8','4.8','Space physics (Physics only)',2]
];
for(const [id,ref,title,paper] of expectedPhysics){
  const mapped = physicsSpec.topics[id];
  const topic = data.topics.find(t=>t.id===id);
  assert(Boolean(mapped), `${id}: missing detailed Physics specification map.`);
  assert(mapped?.spec===ref, `${id}: expected AQA reference ${ref}, found ${mapped?.spec ?? 'none'}.`);
  assert(mapped?.title===title, `${id}: expected Physics title '${title}'.`);
  assert(mapped?.paper===paper, `${id}: expected Paper ${paper}.`);
  assert(topic?.specRef===ref, `${id}: course topic is not carrying AQA reference ${ref}.`);
  assert(Array.isArray(mapped?.sections) && mapped.sections.length>0, `${id}: no AQA subsection groups.`);
}
assert(JSON.stringify(physicsSpec.paper1)===JSON.stringify(['p1','p2','p3','p4']), 'Physics Paper 1 topic map is incorrect.');
assert(JSON.stringify(physicsSpec.paper2)===JSON.stringify(['p5','p6','p7','p8']), 'Physics Paper 2 topic map is incorrect.');

const minPhysicsLessons={p1:11,p2:15,p3:8,p4:13,p5:28,p6:17,p7:12,p8:6};
let physicsLessonCount=0, physicsOnlyCount=0, higherCount=0, practicalLinkedCount=0;
for(const [topicId,mapped] of Object.entries(physicsSpec.topics)){
  const lessons=mapped.sections.flatMap(s=>s.lessons);
  physicsLessonCount += lessons.length;
  assert(lessons.length >= minPhysicsLessons[topicId], `${topicId}: expected at least ${minPhysicsLessons[topicId]} detailed Physics lessons, found ${lessons.length}.`);
  for(const lesson of lessons){
    assert(typeof lesson.title==='string' && lesson.title.length>3, `${topicId}: detailed lesson missing title.`);
    assert(/^4\.[1-8](\.|$)/.test(lesson.ref), `${topicId}: lesson '${lesson.title}' has invalid AQA reference '${lesson.ref}'.`);
    assert(typeof lesson.section==='string' && lesson.section.length>2, `${topicId}: lesson '${lesson.title}' missing AQA subsection title.`);
    assert(['combined','triple'].includes(lesson.scope), `${topicId}: lesson '${lesson.title}' has invalid Combined/Physics-only scope.`);
    assert(['all','higher'].includes(lesson.tier), `${topicId}: lesson '${lesson.title}' has invalid tier metadata.`);
    assert(Array.isArray(lesson.focus) && lesson.focus.length>=2, `${topicId}: lesson '${lesson.title}' needs detailed specification focus points.`);
    if(lesson.scope==='triple') physicsOnlyCount++;
    if(lesson.tier==='higher') higherCount++;
    if(lesson.practical) practicalLinkedCount++;
  }
}
assert(physicsLessonCount>=100, `Expected at least 100 detailed Physics lesson entries, found ${physicsLessonCount}.`);
assert(physicsOnlyCount>=20, `Expected substantial Physics-only coverage, found ${physicsOnlyCount} lessons.`);
assert(higherCount>=15, `Expected substantial Higher Tier labelling, found ${higherCount} lessons.`);
assert(practicalLinkedCount>=10, `Expected all Physics required practical links, found ${practicalLinkedCount}.`);
assert(physicsLessonContent.rules.length>=50, `Expected a substantial lesson-specific Physics teaching rule bank, found ${physicsLessonContent.rules.length}.`);

const forceTopic=data.topics.find(t=>t.id==='p5');
const forceTitle="Newton's Second Law and inertial mass";
const forceIndex=forceTopic.lessons.findIndex(([name])=>name===forceTitle);
const forceLesson=rich.getLesson(forceTopic,forceTitle,forceIndex);
assert(forceLesson?.physicsMeta?.ref==='4.5.6.2.2', 'Newton Second Law lesson is not linked to AQA 4.5.6.2.2.');
assert(forceLesson?.depth?.explanation?.includes('resultant force'), 'Newton Second Law lesson does not receive lesson-specific teaching detail.');
assert(forceLesson?.depth?.misconception, 'Physics lesson is missing a lesson-specific misconception.');
assert(forceLesson?.depth?.application, 'Physics lesson is missing a lesson-specific application task.');
assert(forceLesson?.examTip?.includes('AQA 4.5.6.2.2'), 'Physics lesson exam guidance does not include its AQA reference.');

const index = read('index.html');
for(const asset of ['styles.css','rich-learning.css','course-enhancements.css','lesson-sequences.css','revision-mode.css','physics-spec-detail.css','course-data.js','physics-spec-detail.js','rich-content.js','question-bank.js','app.js','course-enhancements.js','physics-lesson-content.js','lesson-sequences.js','revision-mode.js','physics-spec-ui.js']){
  assert(index.includes(asset), `index.html does not reference ${asset}.`);
}
assert(index.indexOf('physics-spec-detail.js') < index.indexOf('rich-content.js'), 'Physics specification data must load before rich-content.js.');
assert(index.indexOf('course-enhancements.js') < index.indexOf('physics-lesson-content.js'), 'Physics lesson detail should load after general course enhancements.');
assert(index.indexOf('physics-lesson-content.js') < index.indexOf('lesson-sequences.js'), 'Physics lesson detail must load before guided lesson sequences are generated.');
assert(index.indexOf('physics-spec-ui.js') > index.indexOf('revision-mode.js'), 'Physics specification UI should load after the core enhancement layers.');
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

const physicsUiSource=read('physics-spec-ui.js');
for(const required of ['AQA Physics specification','Specification mastery','Required practical link','Higher Tier','Physics only']){
  assert(physicsUiSource.includes(required), `physics-spec-ui.js missing required Physics lesson UI: ${required}.`);
}

if(failures.length){
  console.error(`Integrity checks failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`GCSE course integrity checks passed: ${data.topics.length} topics, ${data.topics.reduce((n,t)=>n+t.lessons.length,0)} lesson entries, ${physicsLessonCount} detailed AQA Physics lessons, ${physicsLessonContent.rules.length} Physics teaching rules, ${Object.keys(rich.guides).length} rich guides, ${examQuestionCount} exam-practice questions.`);

import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','question-bank.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const physicsSpec=context.window.GCSE_PHYSICS_SPEC_DETAIL;
const biologySpec=context.window.GCSE_BIOLOGY_SPEC_DETAIL;
const physicsContent=context.window.GCSE_PHYSICS_LESSON_CONTENT;
const biologyContent=context.window.GCSE_BIOLOGY_LESSON_CONTENT;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(data?.topics?.length===25,`Expected 25 course topics, found ${data?.topics?.length??0}.`);
assert(rich?.guides,'Rich content did not load.');
assert(context.window.GCSE_EXTRA_QUESTION_BANK,'Expanded question bank did not load.');
assert(physicsSpec?.topics,'Detailed Physics specification map missing.');
assert(biologySpec?.topics,'Detailed Biology specification map missing.');
assert(physicsContent?.rules,'Physics teaching-depth layer missing.');
assert(biologyContent?.rules,'Biology teaching-depth layer missing.');

let examQuestionCount=0;
const ids=new Set();
for(const topic of data.topics){
  assert(!ids.has(topic.id),`Duplicate topic id ${topic.id}.`);ids.add(topic.id);
  assert(['biology','chemistry','physics'].includes(topic.subject),`${topic.id}: invalid subject.`);
  assert([1,2].includes(topic.paper),`${topic.id}: invalid paper.`);
  assert(['combined','triple'].includes(topic.scope),`${topic.id}: invalid scope.`);
  assert(Array.isArray(topic.lessons)&&topic.lessons.length,`${topic.id}: no lessons.`);
  for(const [name,scope] of topic.lessons||[]){assert(Boolean(name),`${topic.id}: unnamed lesson.`);assert(['combined','triple'].includes(scope),`${topic.id}: invalid lesson scope for ${name}.`);}
  assert((topic.quiz?.length||0)>=3,`${topic.id}: needs at least 3 retrieval questions.`);
  const guide=rich.guides[topic.id];
  assert(Boolean(guide),`${topic.id}: rich guide missing.`);
  if(guide){
    assert((guide.textbook?.length||0)>=3,`${topic.id}: insufficient textbook sections.`);
    assert((guide.terms?.length||0)>=4,`${topic.id}: insufficient key terms.`);
    assert(guide.worked?.title&&Array.isArray(guide.worked?.steps),`${topic.id}: worked example incomplete.`);
    assert(guide.activity?.title&&guide.activity?.task,`${topic.id}: activity incomplete.`);
    assert(Boolean(guide.sim),`${topic.id}: simulation type missing.`);
    assert((guide.exam?.length||0)>=5,`${topic.id}: needs at least 5 exam questions.`);
    examQuestionCount+=guide.exam?.length||0;
  }
}
assert(data.topics.filter(t=>t.subject==='biology').length===7,'Expected 7 Biology exam topics.');
assert(data.topics.filter(t=>t.subject==='chemistry').length===10,'Expected 10 Chemistry topics.');
assert(data.topics.filter(t=>t.subject==='physics').length===8,'Expected 8 Physics topics.');
assert(data.topics.find(t=>t.id==='p8')?.scope==='triple','P8 Space Physics must remain Separate Physics only.');
assert(examQuestionCount>=125,`Expected at least 125 exam-practice questions, found ${examQuestionCount}.`);

const expectedPhysics=[['p1','4.1','Energy',1],['p2','4.2','Electricity',1],['p3','4.3','Particle model of matter',1],['p4','4.4','Atomic structure',1],['p5','4.5','Forces',2],['p6','4.6','Waves',2],['p7','4.7','Magnetism and electromagnetism',2],['p8','4.8','Space physics (Physics only)',2]];
for(const [id,ref,title,paper] of expectedPhysics){const m=physicsSpec.topics[id],t=data.topics.find(x=>x.id===id);assert(m?.spec===ref,`${id}: wrong Physics ref.`);assert(m?.title===title,`${id}: wrong Physics title.`);assert(m?.paper===paper,`${id}: wrong Physics paper.`);assert(t?.specRef===ref,`${id}: Physics ref not copied to course topic.`);}
assert(JSON.stringify(physicsSpec.paper1)===JSON.stringify(['p1','p2','p3','p4']),'Physics Paper 1 map incorrect.');
assert(JSON.stringify(physicsSpec.paper2)===JSON.stringify(['p5','p6','p7','p8']),'Physics Paper 2 map incorrect.');
let physicsLessons=0,physicsOnly=0,physicsHigher=0,physicsPracticals=0;
for(const [id,m] of Object.entries(physicsSpec.topics)) for(const lesson of m.sections.flatMap(s=>s.lessons)){physicsLessons++;assert(/^4\.[1-8](\.|$)/.test(lesson.ref),`${id}: invalid Physics ref ${lesson.ref}.`);assert((lesson.focus?.length||0)>=2,`${id}: weak Physics focus for ${lesson.title}.`);if(lesson.scope==='triple')physicsOnly++;if(lesson.tier==='higher')physicsHigher++;if(lesson.practical)physicsPracticals++;}
assert(physicsLessons>=100,`Expected 100+ detailed Physics lessons, found ${physicsLessons}.`);assert(physicsOnly>=20,'Physics-only coverage too small.');assert(physicsHigher>=15,'Physics Higher Tier labelling too small.');assert(physicsPracticals>=10,'Physics practical links incomplete.');assert(physicsContent.rules.length>=50,'Physics teaching rule bank too small.');

const expectedBiology=[['b1','4.1','Cell biology',1],['b2','4.2','Organisation',1],['b3','4.3','Infection and response',1],['b4','4.4','Bioenergetics',1],['b5','4.5','Homeostasis and response',2],['b6','4.6','Inheritance, variation and evolution',2],['b7','4.7','Ecology',2]];
for(const [id,ref,title,paper] of expectedBiology){const m=biologySpec.topics[id],t=data.topics.find(x=>x.id===id);assert(Boolean(m),`${id}: Biology map missing.`);assert(m?.spec===ref,`${id}: expected Biology ref ${ref}.`);assert(m?.title===title,`${id}: wrong Biology title.`);assert(m?.paper===paper,`${id}: wrong Biology paper.`);assert(t?.specRef===ref,`${id}: Biology ref not copied to course topic.`);assert((m?.sections?.length||0)>0,`${id}: no Biology subsection groups.`);}
assert(JSON.stringify(biologySpec.paper1)===JSON.stringify(['b1','b2','b3','b4']),'Biology Paper 1 map incorrect.');
assert(JSON.stringify(biologySpec.paper2)===JSON.stringify(['b5','b6','b7']),'Biology Paper 2 map incorrect.');
assert(biologySpec.keyIdeas==='4.8','Biology Key Ideas reference must remain AQA 4.8.');
const minBiologyLessons={b1:20,b2:20,b3:15,b4:10,b5:25,b6:25,b7:30};
let biologyLessons=0,biologyOnly=0,biologyHigher=0,biologyPracticals=0;
for(const [id,m] of Object.entries(biologySpec.topics)){
  const lessons=m.sections.flatMap(s=>s.lessons);biologyLessons+=lessons.length;
  assert(lessons.length>=minBiologyLessons[id],`${id}: expected at least ${minBiologyLessons[id]} detailed Biology lessons, found ${lessons.length}.`);
  for(const lesson of lessons){
    assert(/^4\.[1-7](\.|$)/.test(lesson.ref),`${id}: invalid Biology AQA ref '${lesson.ref}' for ${lesson.title}.`);
    assert(typeof lesson.section==='string'&&lesson.section.length>2,`${id}: missing Biology subsection title for ${lesson.title}.`);
    assert(['combined','triple'].includes(lesson.scope),`${id}: invalid Biology scope for ${lesson.title}.`);
    assert(['all','higher'].includes(lesson.tier),`${id}: invalid Biology tier for ${lesson.title}.`);
    assert((lesson.focus?.length||0)>=2,`${id}: Biology lesson ${lesson.title} lacks specification focus.`);
    if(lesson.scope==='triple')biologyOnly++;if(lesson.tier==='higher')biologyHigher++;if(lesson.practical)biologyPracticals++;
  }
}
assert(biologyLessons>=150,`Expected at least 150 detailed Biology lessons, found ${biologyLessons}.`);
assert(biologyOnly>=30,`Expected substantial Biology-only coverage, found ${biologyOnly}.`);
assert(biologyHigher>=15,`Expected substantial Biology Higher Tier labelling, found ${biologyHigher}.`);
assert(biologyPracticals===10,`Expected 10 Biology required-practical links, found ${biologyPracticals}.`);
assert(biologyContent.rules.length>=50,`Expected substantial Biology teaching rule bank, found ${biologyContent.rules.length}.`);

const osmosisTopic=data.topics.find(t=>t.id==='b1');
const osmosisTitle='Osmosis';
const osmosisIndex=osmosisTopic.lessons.findIndex(([name])=>name===osmosisTitle);
const osmosisLesson=rich.getLesson(osmosisTopic,osmosisTitle,osmosisIndex);
assert(osmosisLesson?.biologyMeta?.ref==='4.1.3.2','Osmosis lesson is not linked to AQA 4.1.3.2.');
assert(osmosisLesson?.depth?.explanation?.toLowerCase().includes('partially permeable'),'Osmosis lesson does not receive lesson-specific Biology teaching detail.');
assert(osmosisLesson?.depth?.misconception,'Biology lesson missing misconception guidance.');
assert(osmosisLesson?.depth?.application,'Biology lesson missing application task.');
assert(osmosisLesson?.examTip?.includes('AQA 4.1.3.2'),'Biology exam guidance does not include AQA reference.');

const index=read('index.html');
for(const asset of ['styles.css','rich-learning.css','course-enhancements.css','lesson-sequences.css','revision-mode.css','physics-spec-detail.css','biology-spec-detail.css','course-data.js','physics-spec-detail.js','biology-spec-detail.js','rich-content.js','question-bank.js','app.js','course-enhancements.js','physics-lesson-content.js','biology-lesson-content.js','lesson-sequences.js','revision-mode.js','physics-spec-ui.js','biology-spec-ui.js']) assert(index.includes(asset),`index.html missing ${asset}.`);
assert(index.indexOf('physics-spec-detail.js')<index.indexOf('rich-content.js'),'Physics spec must load before rich content.');
assert(index.indexOf('biology-spec-detail.js')<index.indexOf('rich-content.js'),'Biology spec must load before rich content.');
assert(index.indexOf('biology-lesson-content.js')<index.indexOf('lesson-sequences.js'),'Biology teaching depth must load before guided sequences.');
for(const tab of ['overview','lessons','textbook','practicals','activities','simulation','equations','exam','quiz','coach']) assert(index.includes(`data-tab="${tab}"`),`Missing topic tab ${tab}.`);

const sequenceSource=read('lesson-sequences.js');for(const required of ['Retrieval starter','Teaching chunks','Guided practice','Independent practice','Exam challenge','Plenary / exit ticket','Required practical mastery']) assert(sequenceSource.includes(required),`Guided lesson phase missing: ${required}.`);
const revisionSource=read('revision-mode.js');for(const required of ['Practice tier','Mixed revision','Foundation practice','Higher practice','Mastery:']) assert(revisionSource.includes(required),`Revision feature missing: ${required}.`);
const biologyUi=read('biology-spec-ui.js');for(const required of ['AQA Biology specification','Specification mastery','Required practical link','Higher Tier','Biology only']) assert(biologyUi.includes(required),`Biology UI missing ${required}.`);

if(failures.length){console.error(`Integrity checks failed (${failures.length}):`);failures.forEach(f=>console.error(`- ${f}`));process.exit(1);}
console.log(`GCSE course integrity checks passed: ${data.topics.length} topics, ${biologyLessons} detailed AQA Biology lessons, ${physicsLessons} detailed AQA Physics lessons, ${biologyPracticals} Biology practical links, ${examQuestionCount} exam-practice questions.`);

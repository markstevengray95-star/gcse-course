import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of [
  'course-data.js',
  'physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js',
  'rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','question-bank.js'
]) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const specs={
  biology:context.window.GCSE_BIOLOGY_SPEC_DETAIL,
  chemistry:context.window.GCSE_CHEMISTRY_SPEC_DETAIL,
  physics:context.window.GCSE_PHYSICS_SPEC_DETAIL
};
const contents={
  biology:context.window.GCSE_BIOLOGY_LESSON_CONTENT,
  chemistry:context.window.GCSE_CHEMISTRY_LESSON_CONTENT,
  physics:context.window.GCSE_PHYSICS_LESSON_CONTENT
};
const sync=context.window.GCSE_SPEC_PRACTICAL_SYNC;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(data?.topics?.length===25,`Expected 25 exam topics, found ${data?.topics?.length??0}.`);
assert(data?.subjects?.map(s=>s.id).join(',')==='biology,chemistry,physics','Subject order should remain Biology, Chemistry, Physics.');
for(const subject of ['biology','chemistry','physics']){
  assert(specs[subject]?.topics,`${subject}: specification map missing.`);
  assert(contents[subject]?.rules,`${subject}: lesson teaching layer missing.`);
}
assert(rich?.guides,'Rich content guide map missing.');
assert(context.window.GCSE_EXTRA_QUESTION_BANK,'Expanded question bank missing.');
assert(sync?.counts,'Practical synchronisation did not run.');

const expectedTopics={
  biology:[['b1','4.1','Cell biology',1],['b2','4.2','Organisation',1],['b3','4.3','Infection and response',1],['b4','4.4','Bioenergetics',1],['b5','4.5','Homeostasis and response',2],['b6','4.6','Inheritance, variation and evolution',2],['b7','4.7','Ecology',2]],
  chemistry:[['c1','4.1','Atomic structure and the periodic table',1],['c2','4.2','Bonding, structure, and the properties of matter',1],['c3','4.3','Quantitative chemistry',1],['c4','4.4','Chemical changes',1],['c5','4.5','Energy changes',1],['c6','4.6','The rate and extent of chemical change',2],['c7','4.7','Organic chemistry',2],['c8','4.8','Chemical analysis',2],['c9','4.9','Chemistry of the atmosphere',2],['c10','4.10','Using resources',2]],
  physics:[['p1','4.1','Energy',1],['p2','4.2','Electricity',1],['p3','4.3','Particle model of matter',1],['p4','4.4','Atomic structure',1],['p5','4.5','Forces',2],['p6','4.6','Waves',2],['p7','4.7','Magnetism and electromagnetism',2],['p8','4.8','Space physics (Physics only)',2]]
};
const expectedPaperMaps={
  biology:{paper1:['b1','b2','b3','b4'],paper2:['b5','b6','b7']},
  chemistry:{paper1:['c1','c2','c3','c4','c5'],paper2:['c6','c7','c8','c9','c10']},
  physics:{paper1:['p1','p2','p3','p4'],paper2:['p5','p6','p7','p8']}
};
const expectedKeyIdeas={biology:'4.8',chemistry:'4.11'};
const minLessons={biology:150,chemistry:150,physics:100};
const expectedPracticals={biology:10,chemistry:8,physics:10};
const minOnly={biology:25,chemistry:20,physics:20};
const minHigher={biology:10,chemistry:15,physics:15};
const lessonCounts={};

for(const subject of ['biology','chemistry','physics']){
  const spec=specs[subject];
  const courseTopics=data.topics.filter(t=>t.subject===subject);
  assert(courseTopics.length===expectedTopics[subject].length,`${subject}: wrong number of exam topics.`);
  assert(JSON.stringify(spec.paper1)===JSON.stringify(expectedPaperMaps[subject].paper1),`${subject}: Paper 1 mapping incorrect.`);
  assert(JSON.stringify(spec.paper2)===JSON.stringify(expectedPaperMaps[subject].paper2),`${subject}: Paper 2 mapping incorrect.`);
  if(expectedKeyIdeas[subject]) assert(spec.keyIdeas===expectedKeyIdeas[subject],`${subject}: key-ideas reference should be ${expectedKeyIdeas[subject]}.`);

  let lessonTotal=0,onlyTotal=0,higherTotal=0,practicalTotal=0;
  for(const [id,ref,title,paper] of expectedTopics[subject]){
    const mapped=spec.topics[id];
    const topic=data.topics.find(t=>t.id===id);
    assert(Boolean(mapped),`${id}: missing ${subject} specification topic.`);
    assert(mapped?.spec===ref,`${id}: expected specification ref ${ref}, found ${mapped?.spec??'none'}.`);
    assert(mapped?.title===title,`${id}: expected title '${title}', found '${mapped?.title??'none'}'.`);
    assert(mapped?.paper===paper,`${id}: expected Paper ${paper}.`);
    assert(topic?.paper===paper,`${id}: course-data paper does not match spec map.`);
    assert(topic?.specRef===ref,`${id}: course topic does not carry specification ref ${ref}.`);
    assert((mapped?.sections?.length||0)>0,`${id}: no specification subsection groups.`);

    const mappedLessons=mapped.sections.flatMap(s=>s.lessons);
    lessonTotal+=mappedLessons.length;
    assert(topic.lessons.length===mappedLessons.length,`${id}: visible course lesson list is not synchronised with spec map (${topic.lessons.length} vs ${mappedLessons.length}).`);
    const names=new Set();
    for(const lesson of mappedLessons){
      assert(!names.has(lesson.title),`${id}: duplicate lesson title '${lesson.title}' breaks stable progress IDs.`);names.add(lesson.title);
      assert(spec.getLesson(id,lesson.title)===lesson,`${id}: lesson lookup failed for '${lesson.title}'.`);
      assert(topic.lessons.some(([name,scope])=>name===lesson.title&&scope===lesson.scope),`${id}: course lessons missing '${lesson.title}'.`);
      assert(typeof lesson.ref==='string'&&lesson.ref.startsWith(ref),`${id}: '${lesson.title}' has out-of-topic ref '${lesson.ref}'.`);
      assert(typeof lesson.section==='string'&&lesson.section.length>2,`${id}: '${lesson.title}' missing subsection title.`);
      assert(['combined','triple'].includes(lesson.scope),`${id}: '${lesson.title}' invalid scope.`);
      assert(['all','higher'].includes(lesson.tier),`${id}: '${lesson.title}' invalid tier.`);
      assert((lesson.focus?.length||0)>=2,`${id}: '${lesson.title}' needs at least two specification focus points.`);
      if(lesson.scope==='triple') onlyTotal++;
      if(lesson.tier==='higher') higherTotal++;
      if(lesson.practical) practicalTotal++;
    }
  }
  lessonCounts[subject]=lessonTotal;
  assert(lessonTotal>=minLessons[subject],`${subject}: expected at least ${minLessons[subject]} detailed lessons, found ${lessonTotal}.`);
  assert(onlyTotal>=minOnly[subject],`${subject}: insufficient Separate-only coverage (${onlyTotal}).`);
  assert(higherTotal>=minHigher[subject],`${subject}: insufficient Higher Tier labelling (${higherTotal}).`);
  assert(practicalTotal===expectedPracticals[subject],`${subject}: expected exactly ${expectedPracticals[subject]} required-practical links, found ${practicalTotal}.`);
  assert(sync.counts[subject]===expectedPracticals[subject],`${subject}: visible practical tab count ${sync.counts[subject]} does not match AQA count ${expectedPracticals[subject]}.`);
  assert(contents[subject].rules.length>=40,`${subject}: lesson-specific teaching rule bank is too small (${contents[subject].rules.length}).`);
}

assert(data.topics.find(t=>t.id==='p8')?.scope==='triple','Space Physics must remain a Separate Physics-only topic.');
assert(data.topics.filter(t=>t.scope!=='triple').length===24,'Combined Science should expose 24 top-level topics (Space Physics excluded).');

// Verify one exact lesson from each subject makes it through the stacked content engine.
const samples=[
  ['biology','b1','Osmosis','4.1.3.2','partially permeable'],
  ['chemistry','c2','Formation of ions and ionic bonding','4.2.1.2','electron transfer'],
  ['physics','p5',"Newton's Second Law and inertial mass",'4.5.6.2.2','resultant force']
];
for(const [subject,topicId,title,ref,needle] of samples){
  const topic=data.topics.find(t=>t.id===topicId);const index=topic.lessons.findIndex(([name])=>name===title);const lesson=rich.getLesson(topic,title,index);
  assert(index>=0,`${subject}: audit sample '${title}' not found.`);
  assert(lesson?.[`${subject}Meta`]?.ref===ref,`${subject}: '${title}' not linked to ${ref}.`);
  assert(lesson?.depth?.explanation?.toLowerCase().includes(needle.toLowerCase()),`${subject}: '${title}' missing lesson-specific teaching detail.`);
  assert(Boolean(lesson?.depth?.misconception),`${subject}: '${title}' missing misconception guidance.`);
  assert(Boolean(lesson?.depth?.application),`${subject}: '${title}' missing application task.`);
  assert(lesson?.examTip?.includes(`AQA ${ref}`),`${subject}: '${title}' exam tip missing AQA reference.`);
}

let examQuestionCount=0;
for(const topic of data.topics){
  const guide=rich.guides[topic.id];
  assert(Boolean(guide),`${topic.id}: missing rich guide.`);
  assert((guide?.textbook?.length||0)>=3,`${topic.id}: fewer than three textbook sections.`);
  assert((guide?.terms?.length||0)>=4,`${topic.id}: fewer than four key terms.`);
  assert(guide?.worked?.title&&Array.isArray(guide?.worked?.steps),`${topic.id}: worked example incomplete.`);
  assert(guide?.activity?.title&&guide?.activity?.task,`${topic.id}: activity incomplete.`);
  assert(Boolean(guide?.sim),`${topic.id}: simulation type missing.`);
  assert((guide?.exam?.length||0)>=5,`${topic.id}: fewer than five exam-practice questions.`);
  examQuestionCount+=guide?.exam?.length||0;
}
assert(examQuestionCount>=125,`Expected at least 125 exam-practice questions, found ${examQuestionCount}.`);

const index=read('index.html');
const scripts=[...index.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
assert(new Set(scripts).size===scripts.length,'index.html contains duplicate script imports.');
for(const asset of [
  'physics-spec-detail.css','biology-spec-detail.css','chemistry-spec-detail.css',
  'course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','question-bank.js','app.js','course-audit-fixes.js','course-enhancements.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','revision-mode.js','physics-spec-ui.js','biology-spec-ui.js','chemistry-spec-ui.js'
]) assert(index.includes(asset),`index.html missing ${asset}.`);
for(const detail of ['physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js']) assert(index.indexOf(detail)<index.indexOf('rich-content.js'),`${detail} must load before rich-content.js.`);
assert(index.indexOf('spec-practical-sync.js')<index.indexOf('rich-content.js'),'Practical sync must run before the main app renders practical counts.');
for(const content of ['physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js']) assert(index.indexOf(content)<index.indexOf('lesson-sequences.js'),`${content} must load before guided lesson sequences.`);
for(const ui of ['physics-spec-ui.js','biology-spec-ui.js','chemistry-spec-ui.js']) assert(index.indexOf(ui)>index.indexOf('revision-mode.js'),`${ui} should load after core revision rendering.`);
assert(index.indexOf('course-audit-fixes.js')>index.indexOf('app.js'),'Progress migration fix must load after app.js.');

const progressFix=read('course-audit-fixes.js');
assert(progressFix.includes('stableKey'),'Stable lesson progress key implementation missing.');
assert(progressFix.includes('encodeURIComponent(title'),'Stable lesson progress key must be based on lesson title.');
assert(progressFix.includes('migratedLegacyProgress'),'Legacy lesson progress migration missing.');

for(const subject of ['physics','biology','chemistry']){
  const ui=read(`${subject}-spec-ui.js`);
  assert(ui.includes('Specification mastery'),`${subject}: specification mastery UI missing.`);
  assert(ui.includes('Required practical link'),`${subject}: practical-link UI missing.`);
  assert(ui.includes('Higher Tier'),`${subject}: Higher Tier UI label missing.`);
}

if(failures.length){
  console.error(`FULL COURSE AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`FULL COURSE AUDIT PASSED: Biology ${lessonCounts.biology} lessons / 10 practicals; Chemistry ${lessonCounts.chemistry} lessons / 8 practicals; Physics ${lessonCounts.physics} lessons / 10 practicals; ${examQuestionCount} exam-practice questions; stable cross-mode lesson progress enabled.`);

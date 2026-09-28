import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of [
  'course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js',
  'rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-presentation-catalog.js'
]) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;
const specs={biology:context.window.GCSE_BIOLOGY_SPEC_DETAIL,chemistry:context.window.GCSE_CHEMISTRY_SPEC_DETAIL,physics:context.window.GCSE_PHYSICS_SPEC_DETAIL};
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};
const ids=new Set();
const counts={biology:0,chemistry:0,physics:0};
let total=0;

assert(catalog?.build&&catalog?.validate,'Per-lesson presentation catalogue is missing.');

for(const topic of data.topics){
  const mapped=specs[topic.subject]?.topics?.[topic.id];
  assert(mapped,`${topic.id}: specification topic missing.`);
  const mappedLessons=mapped?.sections?.flatMap(s=>s.lessons)||[];
  assert(topic.lessons.length===mappedLessons.length,`${topic.id}: lesson count differs from specification map.`);
  for(let index=0;index<mappedLessons.length;index++){
    const specLesson=mappedLessons[index];
    const courseTitle=topic.lessons[index]?.[0];
    assert(courseTitle===specLesson.title,`${topic.id} lesson ${index+1}: course/spec title mismatch.`);
    const lesson=rich.getLesson(topic,specLesson.title,index);
    const model=catalog.build(topic,specLesson.title,index,lesson);
    total++;counts[topic.subject]++;
    assert(model,`${topic.id} · ${specLesson.title}: no presentation model.`);
    if(!model)continue;
    assert(!ids.has(model.id),`${topic.id} · ${specLesson.title}: presentation ID is not unique.`);ids.add(model.id);
    const missing=catalog.validate(model);
    assert(missing.length===0,`${topic.id} · ${specLesson.title}: incomplete presentation (${missing.join(', ')}).`);
    assert(model.ref===specLesson.ref,`${topic.id} · ${specLesson.title}: AQA ref ${model.ref} does not match ${specLesson.ref}.`);
    assert(model.section===specLesson.section,`${topic.id} · ${specLesson.title}: subsection title mismatch.`);
    assert(model.scope===specLesson.scope,`${topic.id} · ${specLesson.title}: scope mismatch.`);
    assert(model.tier===specLesson.tier,`${topic.id} · ${specLesson.title}: tier mismatch.`);
    assert(model.objectives.length===specLesson.focus.length,`${topic.id} · ${specLesson.title}: not all AQA focus points are in objectives.`);
    specLesson.focus.forEach(point=>{
      assert(model.objectives.includes(point),`${topic.id} · ${specLesson.title}: objective missing '${point}'.`);
      assert(model.specificationPoints.some(p=>p.text===point),`${topic.id} · ${specLesson.title}: no dedicated teaching slide source for '${point}'.`);
    });
    assert(model.specificationPoints.length===specLesson.focus.length,`${topic.id} · ${specLesson.title}: specification teaching-point count mismatch.`);
    assert(model.keyTerms.length>=4,`${topic.id} · ${specLesson.title}: presentation has fewer than four key terms.`);
    assert(Boolean(model.workedExample?.title)&&Array.isArray(model.workedExample?.steps),`${topic.id} · ${specLesson.title}: worked example missing.`);
    assert(model.coreExplanation.length>40,`${topic.id} · ${specLesson.title}: core explanation is too thin.`);
    assert(model.application.length>20,`${topic.id} · ${specLesson.title}: application task is too thin.`);
    assert(model.misconception.length>20,`${topic.id} · ${specLesson.title}: misconception guidance is too thin.`);
    assert(model.examTip.length>20,`${topic.id} · ${specLesson.title}: exam guidance is too thin.`);
    const expectedEquations=specLesson.equations||[];
    assert(JSON.stringify(model.equations)===JSON.stringify(expectedEquations),`${topic.id} · ${specLesson.title}: equation coverage mismatch.`);
    assert(model.practical===(specLesson.practical||''),`${topic.id} · ${specLesson.title}: required-practical link mismatch.`);
  }
}

assert(total===439,`Expected 439 individual lesson presentations, found ${total}.`);
assert(counts.biology===163,`Expected 163 Biology presentations, found ${counts.biology}.`);
assert(counts.chemistry===166,`Expected 166 Chemistry presentations, found ${counts.chemistry}.`);
assert(counts.physics===110,`Expected 110 Physics presentations, found ${counts.physics}.`);
assert(ids.size===total,`Expected ${total} unique presentation IDs, found ${ids.size}.`);

const presentation=read('presentation-lessons.js');
for(const token of ['GCSE_LESSON_PRESENTATION_CATALOG','m.specificationPoints.forEach','m.keyTerms','m.workedExample','m.equations','m.practical','m.keyIdeas','m.skills','Individual lesson presentation',"type:'retrieval'","type:'specpoint'"]){
  assert(presentation.includes(token),`presentation-lessons.js missing ${token}`);
}
const index=read('index.html');
assert(index.includes('lesson-presentation-catalog.js'),'index.html does not load lesson-presentation-catalog.js.');
assert(index.indexOf('lesson-presentation-catalog.js')<index.indexOf('presentation-lessons.js'),'Presentation catalogue must load before presentation-lessons.js.');

if(failures.length){
  console.error(`ALL LESSON PRESENTATIONS AUDIT FAILED (${failures.length})`);
  failures.slice(0,80).forEach(f=>console.error(`- ${f}`));
  if(failures.length>80)console.error(`...and ${failures.length-80} more failures.`);
  process.exit(1);
}
console.log(`ALL LESSON PRESENTATIONS AUDIT PASSED: ${counts.biology} Biology + ${counts.chemistry} Chemistry + ${counts.physics} Physics = ${total} unique lesson presentations, each retaining its complete mapped AQA points, equations, practical links and lesson teaching content.`);

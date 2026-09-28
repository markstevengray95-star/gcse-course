import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of [
  'course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js',
  'rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js',
  'lesson-quality-schema.js','lesson-presentation-catalog.js'
]) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const schema=context.window.GCSE_LESSON_QUALITY_SCHEMA;
const catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

assert(schema?.REQUIRED_STAGES?.length===20,`Phase 1 should enforce 20 lesson-standard components; found ${schema?.REQUIRED_STAGES?.length??0}.`);
assert(schema?.MAX_CHUNK_CHARS===320,'Phase 2 teaching chunk maximum should remain 320 characters.');

let total=0,totalChunks=0,totalChecks=0,maxChunk=0;
const counts={biology:0,chemistry:0,physics:0};
for(const topic of data.topics){
  for(let index=0;index<topic.lessons.length;index++){
    const title=topic.lessons[index][0];
    const lesson=rich.getLesson(topic,title,index);
    const model=catalog.build(topic,title,index,lesson);
    total++;counts[topic.subject]++;
    assert(model?.qualitySchemaVersion==='2.0',`${topic.id} · ${title}: lesson quality schema v2 missing.`);
    const missing=schema.validate(model);
    assert(missing.length===0,`${topic.id} · ${title}: Phase 1 standard incomplete (${missing.join(', ')}).`);
    assert(catalog.validate(model).length===0,`${topic.id} · ${title}: presentation catalogue validation failed.`);
    assert(model.lessonStandard?.aqaReference===model.ref,`${topic.id} · ${title}: AQA reference not carried into lesson standard.`);
    assert(model.lessonStandard?.objectives?.length===model.objectives.length,`${topic.id} · ${title}: objectives not synchronised.`);
    assert(model.lessonStandard?.specificationCheck?.length===model.specificationPoints.length,`${topic.id} · ${title}: specification check is incomplete.`);
    assert(model.lessonStandard?.examQuestion?.length>20,`${topic.id} · ${title}: exam question/challenge missing.`);
    assert(model.lessonStandard?.modelAnswer?.length>20,`${topic.id} · ${title}: model/marking guidance missing.`);
    assert(Array.isArray(model.lessonStandard?.confidence)&&model.lessonStandard.confidence.join('|')==='Review|Developing|Secure',`${topic.id} · ${title}: confidence states incorrect.`);
    const expectedNext=topic.lessons[index+1]?.[0]||'Topic complete — move to exam practice and review.';
    assert(model.lessonStandard?.nextLesson===expectedNext,`${topic.id} · ${title}: next-lesson link incorrect.`);
    assert((model.teachingChunks?.length||0)>=2,`${topic.id} · ${title}: needs at least two one-idea teaching chunks.`);
    assert(model.chunkChecks?.length===model.teachingChunks?.length,`${topic.id} · ${title}: each teaching chunk must have one immediate check.`);
    totalChunks+=model.teachingChunks?.length||0;totalChecks+=model.chunkChecks?.length||0;
    for(const chunk of model.teachingChunks||[]){
      maxChunk=Math.max(maxChunk,chunk.body.length);
      assert(Boolean(chunk.heading&&chunk.body),`${topic.id} · ${title}: teaching chunk lacks heading/body.`);
      assert(chunk.body.length<=schema.MAX_CHUNK_CHARS,`${topic.id} · ${title}: teaching chunk exceeds ${schema.MAX_CHUNK_CHARS} characters.`);
      assert(Boolean(chunk.checkQuestion&&chunk.checkAnswer),`${topic.id} · ${title}: teaching chunk has no immediate check.`);
    }
  }
}

assert(total===439,`Expected 439 overhauled lessons, found ${total}.`);
assert(counts.biology===163&&counts.chemistry===166&&counts.physics===110,`Wrong subject totals: ${JSON.stringify(counts)}.`);
assert(totalChecks===totalChunks,`Expected one check per teaching chunk (${totalChunks}), found ${totalChecks}.`);
assert(totalChunks>=878,`Expected at least two teaching chunks per lesson, found ${totalChunks} across ${total} lessons.`);

const presentation=read('presentation-lessons.js');
for(const token of ["type:'teachchunk'","type:'chunkcheck'",'m.teachingChunks','m.chunkChecks','lesson-standard-strip','Standard v2','Check understanding','one key idea','examQuestion','modelAnswer','nextLesson']){
  assert(presentation.includes(token),`presentation-lessons.js missing Phase 1/2 token: ${token}`);
}
const css=read('lesson-overhaul.css');
for(const token of ['.lesson-standard-strip','.teaching-chunk-card','.chunk-check-card','.slide-chunkcheck','data-quality-schema']) assert(css.includes(token),`lesson-overhaul.css missing ${token}`);
const index=read('index.html');
assert(index.includes('lesson-quality-schema.js'),'index.html missing lesson-quality-schema.js.');
assert(index.includes('lesson-overhaul.css'),'index.html missing lesson-overhaul.css.');
assert(index.indexOf('lesson-quality-schema.js')<index.indexOf('lesson-presentation-catalog.js'),'Lesson quality schema must load before presentation catalogue.');
assert(index.indexOf('lesson-presentation-catalog.js')<index.indexOf('presentation-lessons.js'),'Presentation catalogue must load before presentation renderer.');

if(failures.length){
  console.error(`LESSON OVERHAUL PHASE 1/2 AUDIT FAILED (${failures.length})`);
  failures.slice(0,100).forEach(f=>console.error(`- ${f}`));
  if(failures.length>100)console.error(`...and ${failures.length-100} more failures.`);
  process.exit(1);
}
console.log(`LESSON OVERHAUL PHASE 1/2 AUDIT PASSED: ${total} lessons meet the 20-part standard; ${totalChunks} one-idea teaching chunks each have an immediate check; longest chunk ${maxChunk} characters.`);

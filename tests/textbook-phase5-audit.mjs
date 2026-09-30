import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','lesson-quality-schema.js','lesson-teaching-depth.js','equation-coach.js','practical-lesson-engine.js','lesson-question-ladder.js','lesson-presentation-catalog.js'])vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;const rich=context.window.GCSE_RICH_CONTENT;const catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;const engine=context.window.GCSE_PRACTICAL_LESSON_ENGINE;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
let practicals=0,chapters=0,methodSteps=0,evaluationPoints=0,markPoints=0;const bySubject={biology:0,chemistry:0,physics:0};const kinds=new Set();
for(const topic of data.topics){let topicPractical=0;
  for(let index=0;index<topic.lessons.length;index++){
    const title=topic.lessons[index][0];const lesson=rich.getLesson(topic,title,index);const model=catalog.build(topic,title,index,lesson);model.subject=topic.subject;
    if(!model.practical)continue;
    const p=engine.build(topic,title,model);practicals++;topicPractical++;bySubject[topic.subject]++;kinds.add(p.kind);
    const missing=engine.validate(p);assert(missing.length===0,`${topic.id} · ${title}: incomplete practical textbook model (${missing.join(', ')}).`);
    assert((p.apparatus||[]).length>=4,`${topic.id} · ${title}: apparatus list too short.`);
    assert((p.variables?.controls||[]).length>=2,`${topic.id} · ${title}: insufficient control variables.`);
    assert((p.during?.method||[]).length>=5,`${topic.id} · ${title}: method too short.`);
    assert((p.during?.safety||[]).length>=2,`${topic.id} · ${title}: safety guidance too short.`);
    assert((p.during?.table||[]).length>=5,`${topic.id} · ${title}: results table too small.`);
    assert((p.after?.evaluation||[]).length>=3,`${topic.id} · ${title}: evaluation guidance too short.`);
    assert((p.exam?.marking||[]).length>=4,`${topic.id} · ${title}: exam mark guidance too short.`);
    methodSteps+=(p.during?.method||[]).length;evaluationPoints+=(p.after?.evaluation||[]).length;markPoints+=(p.exam?.marking||[]).length;
  }
  if(topicPractical)chapters++;
}
assert(practicals===28,`Expected 28 practical-linked lessons, found ${practicals}.`);
assert(bySubject.biology===10&&bySubject.chemistry===8&&bySubject.physics===10,`Wrong practical split: ${JSON.stringify(bySubject)}.`);
assert(chapters>=10,`Expected practical coverage across at least 10 textbook chapters, found ${chapters}.`);
assert(kinds.size>=10,`Expected at least 10 practical profiles, found ${kinds.size}.`);

const source=read('textbook-phase5.js');
for(const token of ['Practical textbook','Theory & prediction','Apparatus','Variables','Method','Expected results & table','Analysis','Uncertainty & improvements','Exam question','data-practical-result','data-practical-conclusion','data-practical-evaluation','data-practical-exam-answer','Reveal indicative mark points','GCSE_TEXTBOOK_PHASE5'])assert(source.includes(token),`textbook-phase5.js missing '${token}'.`);
const css=read('textbook-phase5.css');
for(const token of ['.textbook-practical-page','.textbook-practical-tabs','.textbook-practical-apparatus','.textbook-practical-variable-grid','.textbook-practical-method','.textbook-practical-table-wrap','.textbook-practical-evaluation-grid'])assert(css.includes(token),`textbook-phase5.css missing '${token}'.`);
const index=read('index.html');
for(const file of ['textbook-phase5.css','textbook-phase5.js'])assert(index.includes(file),`index.html missing ${file}.`);
assert(index.indexOf('textbook-phase5.css')>index.indexOf('textbook-phase4.css'),'Phase 5 CSS must load after Phase 4 CSS.');
assert(index.indexOf('practical-lesson-engine.js')<index.indexOf('textbook-phase5.js'),'Practical engine must load before Textbook Phase 5.');
assert(index.indexOf('lesson-presentation-catalog.js')<index.indexOf('textbook-phase5.js'),'Presentation catalog must load before Textbook Phase 5.');

if(failures.length){console.error(`TEXTBOOK PHASE 5 AUDIT FAILED (${failures.length})`);failures.slice(0,100).forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log(`TEXTBOOK PHASE 5 AUDIT PASSED: ${practicals} required-practical textbook modules across ${chapters} chapters (${bySubject.biology} Biology, ${bySubject.chemistry} Chemistry, ${bySubject.physics} Physics), using ${kinds.size} practical profiles with ${methodSteps} method steps, ${evaluationPoints} evaluation points and ${markPoints} exam mark points.`);
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);const read=name=>fs.readFileSync(new URL(name,root),'utf8');
class MutationObserver{constructor(cb){this.cb=cb}observe(){}}
const element=()=>({dataset:{},classList:{contains:()=>false,toggle(){},add(){}},appendChild(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},set innerHTML(v){this._html=v},get innerHTML(){return this._html||''}});
const document={documentElement:{},head:{appendChild(){}},querySelector(){return null},querySelectorAll(){return[]},createElement:element};
const localStorage={getItem(){return null},setItem(){}};
const context={window:{},console,document,MutationObserver,localStorage};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','specification-completeness.js','lesson-quality-schema.js','lesson-teaching-depth.js','equation-coach.js','practical-lesson-engine.js','lesson-presentation-catalog.js','lesson-exam-studio.js','textbook-phase6.js','textbook-phase7.js'])vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;const phase7=context.window.GCSE_TEXTBOOK_PHASE7;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
let chapters=0,retrieval=0,examQuestions=0,ideas=0,terms=0,equations=0,practicals=0,misconceptions=0,mapNodes=0;const bySubject={biology:0,chemistry:0,physics:0};

assert(Boolean(phase7?.buildRevisionPack),'Phase 7 revision pack builder is unavailable.');
for(const topic of data.topics||[]){
  const pack=phase7.buildRevisionPack(topic);chapters++;bySubject[topic.subject]++;
  assert(pack.topicId===topic.id,`${topic.id}: revision pack topic mismatch.`);
  assert((pack.ideas||[]).length>=5,`${topic.id}: needs at least five summary ideas, found ${pack.ideas?.length||0}.`);
  assert((pack.terms||[]).length>=6,`${topic.id}: needs at least six key terms, found ${pack.terms?.length||0}.`);
  assert((pack.retrieval||[]).length===10,`${topic.id}: expected 10 retrieval questions, found ${pack.retrieval?.length||0}.`);
  assert((pack.exam||[]).length===3,`${topic.id}: expected 3 exam questions, found ${pack.exam?.length||0}.`);
  assert((pack.misconceptions||[]).length>=3,`${topic.id}: needs at least three misconception checks.`);
  assert(pack.map?.some(n=>n.label==='Exam Skills'),`${topic.id}: topic map missing Exam Skills.`);
  assert(pack.map?.some(n=>n.label==='Revision'),`${topic.id}: topic map missing Revision.`);
  for(const q of pack.retrieval||[]){assert(String(q.question||'').length>8,`${topic.id}: thin retrieval question.`);assert(String(q.answer||'').length>5,`${topic.id}: retrieval question lacks answer.`);}
  for(const q of pack.exam||[]){assert(String(q.question||'').length>20,`${topic.id}: thin exam question.`);assert(q.marks>=2,`${topic.id}: exam question lacks marks.`);assert(String(q.answer||'').length>20,`${topic.id}: exam question lacks model guidance.`);}
  retrieval+=pack.retrieval.length;examQuestions+=pack.exam.length;ideas+=pack.ideas.length;terms+=pack.terms.length;equations+=pack.equations.length;practicals+=pack.practicals.length;misconceptions+=pack.misconceptions.length;mapNodes+=pack.map.length;
}
assert(chapters===25,`Expected 25 revision pages, found ${chapters}.`);assert(retrieval===250,`Expected 250 retrieval questions, found ${retrieval}.`);assert(examQuestions===75,`Expected 75 exam questions, found ${examQuestions}.`);assert(bySubject.biology===7&&bySubject.chemistry===10&&bySubject.physics===8,`Unexpected topic split ${JSON.stringify(bySubject)}.`);

const source=read('textbook-phase7.js');for(const token of ['End-of-topic revision','Topic map','One-page summary','Key vocabulary','Common misconceptions','10-question retrieval','3 exam questions','data-textbook-bookmark-current','data-textbook-bookmark-list','gcse-science-textbook-phase7-v1','GCSE_TEXTBOOK_PHASE7'])assert(source.includes(token),`textbook-phase7.js missing '${token}'.`);
const css=read('textbook-phase7.css');for(const token of ['.textbook-revision-page','.textbook-topic-map','.textbook-summary-grid','.textbook-revision-terms','.textbook-retrieval-set','.textbook-revision-exam','.textbook-bookmarks','.textbook-bookmark-current'])assert(css.includes(token),`textbook-phase7.css missing '${token}'.`);
const phase6=read('textbook-phase6.js');assert(phase6.includes("link.href='textbook-phase7.css'"),'Phase 6 loader missing Phase 7 CSS.');assert(phase6.includes("script.src='textbook-phase7.js'"),'Phase 6 loader missing Phase 7 script.');

if(failures.length){console.error(`TEXTBOOK PHASE 7 AUDIT FAILED (${failures.length})`);failures.slice(0,120).forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log(`TEXTBOOK PHASE 7 AUDIT PASSED: ${chapters} end-of-topic revision pages provide ${ideas} summary ideas, ${terms} key-term cards, ${retrieval} grounded retrieval questions and ${examQuestions} exam questions; ${equations} equation links, ${practicals} practical links, ${misconceptions} misconception checks and ${mapNodes} topic-map nodes validated; persistent page bookmarks and saved answers are wired.`);
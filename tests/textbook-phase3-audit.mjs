import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const document={querySelectorAll(){return[]},getElementById(){return null},body:{}};
class MutationObserver{constructor(cb){this.cb=cb}observe(){}}
const context={window:{},console,document,MutationObserver,queueMicrotask:fn=>fn(),localStorage:{getItem(){return null},setItem(){}},renderTextbook(){},escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}};
vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','rich-content.js','textbook-enhancements.js','textbook-phase3.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const tx=context.window.GCSE_TEXTBOOK_ENHANCEMENTS;
const phase=context.window.GCSE_TEXTBOOK_PHASE3;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
let total=0,totalLabels=0,totalSteps=0;
const bySubject={biology:0,chemistry:0,physics:0};

assert(data?.topics?.length===25,`Expected 25 topics, found ${data?.topics?.length??0}.`);
assert(phase,'Textbook Phase 3 module did not load.');
assert(phase?.storageKey==='gcse-science-textbook-phase3-v1','Phase 3 storage key missing or changed.');
assert(typeof phase?.buildDiagramModel==='function','Phase 3 buildDiagramModel is unavailable.');
assert(typeof phase?.profileFor==='function','Phase 3 profileFor is unavailable.');

for(const topic of data?.topics||[]){
  const plan=tx?.diagramPlan?.[topic.id];
  assert(Array.isArray(plan)&&plan.length===3,`${topic.id}: expected 3 diagram plans, found ${plan?.length??0}.`);
  for(const [index,item] of (plan||[]).entries()){
    const [type,label]=item;
    const model=phase.buildDiagramModel(topic,type,label,index);
    total++;bySubject[topic.subject]++;
    assert(model.id&&model.topicId===topic.id,`${topic.id}/${type}: model identity missing.`);
    assert(model.label===label,`${topic.id}/${type}: label changed unexpectedly.`);
    assert(Array.isArray(model.labels)&&model.labels.length>=4,`${topic.id}/${type}: expected at least 4 learn/test labels.`);
    assert(new Set(model.labels).size===model.labels.length,`${topic.id}/${type}: duplicate labels found.`);
    assert(Array.isArray(model.steps)&&model.steps.length===model.labels.length,`${topic.id}/${type}: process steps do not match labels.`);
    assert(model.steps.every(s=>s.label&&s.explanation&&s.explanation.length>45),`${topic.id}/${type}: process explanation is too weak.`);
    assert(model.testPrompt&&model.testPrompt.length>45,`${topic.id}/${type}: test-mode prompt missing.`);
    assert(model.processPrompt&&model.processPrompt.length>45,`${topic.id}/${type}: process-mode prompt missing.`);
    assert(typeof model.svg==='string'&&model.svg.includes('<svg'),`${topic.id}/${type}: source SVG missing.`);
    assert(model.svg.includes('role="img"'),`${topic.id}/${type}: source SVG lacks accessible image role.`);
    totalLabels+=model.labels.length;totalSteps+=model.steps.length;
  }
}

assert(total===75,`Expected 75 interactive textbook diagrams, found ${total}.`);
assert(bySubject.biology===21&&bySubject.chemistry===30&&bySubject.physics===24,`Unexpected subject diagram totals ${JSON.stringify(bySubject)}.`);
assert(totalLabels>=300,`Expected at least 300 interactive labels, found ${totalLabels}.`);
assert(totalSteps===totalLabels,`Expected one process step per label (${totalLabels}), found ${totalSteps}.`);

const source=read('textbook-phase3.js');
for(const token of ['Learn','Test','Process','data-t3-zoom-out','data-t3-zoom-in','data-t3-focus','data-t3-reveal','data-t3-step-next','fullscreenchange','GCSE_TEXTBOOK_PHASE3']) assert(source.includes(token),`Phase 3 source missing '${token}'.`);
const css=read('textbook-phase3.css');
for(const selector of ['.textbook-diagram-studio','.textbook-diagram-tabs','.textbook-diagram-stage','.mode-test svg text','.t3-label-list','.t3-test-list','.t3-process-card']) assert(css.includes(selector),`Phase 3 CSS missing ${selector}.`);
const index=read('index.html');
assert(index.includes('textbook-phase3.css'),'index.html is missing textbook-phase3.css.');
assert(index.includes('textbook-phase3.js'),'index.html is missing textbook-phase3.js.');
assert(index.indexOf('textbook-phase3.css')>index.indexOf('textbook-phase2.css'),'Phase 3 CSS must load after Phase 2 CSS.');
assert(index.indexOf('textbook-phase3.js')>index.indexOf('textbook-phase2.js'),'Phase 3 JS must load after Phase 2 JS.');

if(failures.length){
  console.error(`TEXTBOOK PHASE 3 AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`TEXTBOOK PHASE 3 AUDIT PASSED: ${total} textbook diagrams upgraded across 25 topics (Biology ${bySubject.biology}, Chemistry ${bySubject.chemistry}, Physics ${bySubject.physics}); ${totalLabels} interactive labels and ${totalSteps} process steps validated with Learn/Test/Process modes, zoom and focus controls.`);
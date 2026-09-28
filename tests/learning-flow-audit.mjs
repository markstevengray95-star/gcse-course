import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const flow=read('learning-flow.js');
const flowCss=read('learning-flow.css');
const tools=read('integrated-tools.js');
const index=read('index.html');

for(const phrase of ['Topic learning path','Continue learning','Mark complete & next','Your next lessons','Exam-skill drill','Recommended equation practice']){
  assert(flow.includes(phrase),`learning-flow.js missing '${phrase}'.`);
}
for(const key of ["p1:'Ek=0.5mv²'","p2:'V=IR'","p5:'F=ma'","p6:'v=fλ'"]){
  assert(flow.includes(key),`Learning flow missing Physics context mapping ${key}.`);
  assert(tools.includes(key),`Integrated tools missing Physics context mapping ${key}.`);
}
for(const mode of ['commands','describeVsExplain','variables','vocab']){
  assert(tools.includes(mode),`Integrated tools missing Arcade mode '${mode}'.`);
}
assert(flow.includes("data-lesson-nav=\"complete\""),'Lesson sequence is missing mark-complete-and-next control.');
assert(flow.includes("e.altKey&&e.key==='ArrowRight'"),'Lesson keyboard next shortcut missing.');
assert(flow.includes("e.altKey&&e.key==='ArrowLeft'"),'Lesson keyboard previous shortcut missing.');
assert(flow.includes('lessonProgress[lessonKey('),'Learning flow is not using the stable lesson completion system.');
assert(tools.includes('function applyContext'),'Integrated tool contextual launcher is missing.');
assert(tools.includes("getElementById('eqSelect')"),'Physics contextual launcher does not target the equation selector.');
assert(tools.includes("startModule('${context.mode}')"),'Arcade contextual launcher does not target a requested module.');
assert(tools.includes("data-mode=\"${mode}\""),'Arcade cards are not carrying mode context.');
assert(tools.includes('data-eq=\"${esc(eq)}\"'),'Physics cards are not carrying equation context.');
assert(index.includes('learning-flow.css'),'index.html does not load learning-flow.css.');
assert(index.includes('learning-flow.js'),'index.html does not load learning-flow.js.');
assert(index.indexOf('integrated-tools.js')<index.indexOf('learning-flow.js'),'learning-flow.js must load after integrated-tools.js.');
for(const selector of ['.topic-learning-flow','.flow-actions','.next-lesson-grid','.lesson-sequence-nav','.context-tool-hint']){
  assert(flowCss.includes(selector),`learning-flow.css missing ${selector}.`);
}
assert(flowCss.includes('@media(max-width:650px)'),'Learning-flow mobile layout is missing.');

if(failures.length){
  console.error(`Learning-flow audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('Learning-flow audit passed: guided topic progress, sequential lesson controls, contextual Arcade modes and Physics equation routing are present.');
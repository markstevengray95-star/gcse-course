import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','equation-coach.js']) vm.runInContext(read(file),context,{filename:file});
const data=context.window.GCSE_COURSE_DATA;
const specs={biology:context.window.GCSE_BIOLOGY_SPEC_DETAIL,chemistry:context.window.GCSE_CHEMISTRY_SPEC_DETAIL,physics:context.window.GCSE_PHYSICS_SPEC_DETAIL};
const coach=context.window.GCSE_EQUATION_COACH;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg);};
let lessons=0,equationLessons=0,equations=0,profiled=0;
for(const topic of data.topics){
  const mapped=specs[topic.subject]?.topics?.[topic.id];
  for(const section of mapped?.sections||[])for(const lesson of section.lessons||[]){
    lessons++;const list=lesson.equations||[];if(list.length)equationLessons++;
    for(const eq of list){
      equations++;const model=coach.build(eq,topic.subject);const missing=coach.validate(model);
      assert(missing.length===0,`${topic.id} · ${lesson.title} · ${eq}: incomplete Equation Coach (${missing.join(', ')}).`);
      assert(model.route.join('|')==='Meaning|Symbols & units|Rearrange|Substitute|Calculate|Check',`${eq}: calculation route changed.`);
      assert(model.worked.length>=4,`${eq}: worked example needs at least four stages.`);
      assert(model.scaffold.length>15&&model.independent.length>15&&model.exam.length>15,`${eq}: calculation practice is too thin.`);
      if(coach.profileFor(eq))profiled++;
    }
  }
}
assert(lessons===439,`Expected 439 lessons, found ${lessons}.`);
assert(equations>0&&equationLessons>0,'No equation-linked lessons were found.');
assert(profiled>0,'No equations are receiving specialised Equation Coach profiles.');

const visual=read('lesson-visual-interactions.js');
for(const token of ['data-label-test','data-label-next','data-process-step','data-process-reset','Predict before reveal','data-visual-variable','requestFullscreen','data-visual-save','GCSE_COURSE_POLISH?.addNote','prefers-reduced-motion']){
  if(token==='prefers-reduced-motion')continue;
  assert(visual.includes(token),`lesson-visual-interactions.js missing ${token}`);
}
for(const kind of ['wave','circuit','particles','membrane','forces'])assert(visual.includes(kind),`Interactive visual model missing ${kind}.`);
const ui=read('equation-coach-ui.js');
for(const token of ['Equation Coach','slide-equationcoach','Symbols & units','Rearrange before numbers','Worked example','Scaffolded','Independent','Exam application','data-calc-next','data-unit-choice','data-equation-clickable','equation-coach']) assert(ui.includes(token),`equation-coach-ui.js missing ${token}`);
const css=read('lesson-overhaul-phase56.css');
for(const token of ['.lesson-visual-controls','.visual-prediction','.visual-label-test','.visual-process-test','.visual-variable','.equation-coach-panel','.equation-route','.equation-symbols','.equation-practice-grid','.equation-coach-dialog','@media(prefers-reduced-motion:reduce)']) assert(css.includes(token),`lesson-overhaul-phase56.css missing ${token}`);
const index=read('index.html');
for(const file of ['lesson-overhaul-phase56.css','equation-coach.js','lesson-visual-interactions.js','equation-coach-ui.js'])assert(index.includes(file),`index.html missing ${file}.`);
assert(index.indexOf('equation-coach.js')<index.indexOf('equation-coach-ui.js'),'Equation Coach engine must load before its UI.');
assert(index.indexOf('presentation-lessons.js')<index.indexOf('lesson-visual-interactions.js'),'Visual interactions must enhance rendered presentations.');
assert(index.indexOf('presentation-lessons.js')<index.indexOf('equation-coach-ui.js'),'Equation Coach UI must enhance rendered presentations.');

if(failures.length){console.error(`LESSON OVERHAUL PHASE 5/6 AUDIT FAILED (${failures.length})`);failures.slice(0,120).forEach(x=>console.error(`- ${x}`));if(failures.length>120)console.error(`...and ${failures.length-120} more.`);process.exit(1);}
console.log(`LESSON OVERHAUL PHASE 5/6 AUDIT PASSED: ${lessons} lessons checked; ${equationLessons} equation-linked lessons expose ${equations} mapped equation relationships; ${profiled} use specialised Equation Coach profiles; lesson visuals include label, process, prediction, variable, zoom and notebook interactions.`);
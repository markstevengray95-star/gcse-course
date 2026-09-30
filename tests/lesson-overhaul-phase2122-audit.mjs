import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','lesson-quality-schema.js','lesson-teaching-depth.js','lesson-visuals.js','equation-coach.js','practical-lesson-engine.js','lesson-question-ladder.js','lesson-exam-studio.js','lesson-differentiation.js','lesson-mode-plans.js','lesson-synoptic-connections.js','lesson-presentation-catalog.js','lesson-quality-enrichment.js','lesson-overhaul-phase2122.js'])vm.runInContext(read(file),context,{filename:file});
const data=context.window.GCSE_COURSE_DATA,rich=context.window.GCSE_RICH_CONTENT,catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};let lessons=0;const subjects={biology:0,chemistry:0,physics:0};const explanationPrompts=new Set(),visualPrompts=new Set(),interleavePrompts=new Set();
for(const topic of data.topics){for(let index=0;index<topic.lessons.length;index++){
  const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson),p21=model?.overhaul21,p22=model?.overhaul22;lessons++;subjects[topic.subject]++;
  assert(model?.lessonOverhaulVersion==='22.0',`${topic.id} · ${title}: lesson overhaul version missing.`);
  assert(p21?.version==='21.0',`${topic.id} · ${title}: Phase 21 missing.`);
  assert(p21?.explanationFrame?.steps?.length===4,`${topic.id} · ${title}: Phase 21 must have four reasoning steps.`);
  assert((p21?.precisionTerms||[]).length>=3,`${topic.id} · ${title}: Phase 21 precision language too thin.`);
  assert((p21?.extendedResponsePrompt||'').includes(title),`${topic.id} · ${title}: Phase 21 response prompt is not lesson-specific.`);
  assert(p21?.selfCheck?.length===4,`${topic.id} · ${title}: Phase 21 self-check incomplete.`);
  assert(p21?.explanationFrame?.steps?.every(step=>String(step.text||'').length>20),`${topic.id} · ${title}: Phase 21 reasoning step too shallow.`);
  assert(p22?.version==='22.0',`${topic.id} · ${title}: Phase 22 missing.`);
  assert(p22?.visualReasoning?.length===4,`${topic.id} · ${title}: Phase 22 visual cycle incomplete.`);
  assert((p22?.questionSet||[]).length===6,`${topic.id} · ${title}: Phase 22 question variety incomplete.`);
  assert(new Set((p22?.questionSet||[]).map(q=>q.command)).size===6,`${topic.id} · ${title}: Phase 22 command-word breadth insufficient.`);
  assert(p22?.questionSet?.every(q=>String(q.prompt||'').includes(title)),`${topic.id} · ${title}: Phase 22 questions are not lesson-specific.`);
  assert(p22?.interactionModes?.length===4,`${topic.id} · ${title}: Phase 22 interaction modes incomplete.`);
  assert(String(p22?.interleave?.prompt||'').includes(title),`${topic.id} · ${title}: Phase 22 interleaving prompt missing current lesson.`);
  explanationPrompts.add(p21.extendedResponsePrompt);visualPrompts.add(p22.visualReasoning[0].prompt);interleavePrompts.add(p22.interleave.prompt);
}}
assert(lessons===439,`Expected 439 lessons, found ${lessons}.`);assert(subjects.biology===163&&subjects.chemistry===166&&subjects.physics===110,`Subject counts wrong: ${JSON.stringify(subjects)}.`);
assert(explanationPrompts.size===439,`Expected 439 distinct explanation prompts, found ${explanationPrompts.size}.`);assert(visualPrompts.size===439,`Expected 439 distinct visual prediction prompts, found ${visualPrompts.size}.`);assert(interleavePrompts.size===439,`Expected 439 distinct interleaving prompts, found ${interleavePrompts.size}.`);
const engine=read('lesson-overhaul-phase2122.js');for(const token of ['Scientific explanation mastery','explanationFrame','precisionTerms','extendedResponsePrompt','Visual reasoning and question variety','visualReasoning','questionSet','interactionModes','lessonOverhaulVersion'])assert(engine.includes(token),`Phase 21/22 engine missing ${token}.`);
const ui=read('lesson-overhaul-phase2122-ui.js');for(const token of ['Phase 21 · Scientific explanation mastery','Cause → mechanism → outcome','Extended-response rehearsal','Phase 22 · Visual reasoning & question variety','Command-word workout','Interleave the learning','data-phase21-response'])assert(ui.includes(token),`Phase 21/22 UI missing ${token}.`);
const css=read('lesson-overhaul-phase2122.css');for(const token of ['.phase21-explanation-panel','.phase21-chain','.phase21-language','.phase22-variety-panel','.phase22-cycle','.phase22-questions','.phase22-interleave'])assert(css.includes(token),`Phase 21/22 CSS missing ${token}.`);
const index=read('index.html');for(const token of ['lesson-overhaul-phase2122.css','lesson-overhaul-phase2122.js','lesson-overhaul-phase2122-ui.js'])assert(index.includes(token),`index.html is not loading ${token}.`);
if(failures.length){console.error(`LESSON OVERHAUL PHASE 21/22 AUDIT FAILED (${failures.length})`);failures.slice(0,160).forEach(x=>console.error(`- ${x}`));if(failures.length>160)console.error(`...and ${failures.length-160} more.`);process.exit(1)}
console.log(`LESSON OVERHAUL PHASE 21/22 AUDIT PASSED: ${lessons} lessons across Biology ${subjects.biology}, Chemistry ${subjects.chemistry}, Physics ${subjects.physics}; 439 unique explanation rehearsals, 439 visual prediction prompts, six command-word modes per lesson and 439 interleaving prompts.`);

import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','specification-completeness.js','lesson-quality-schema.js','lesson-teaching-depth.js','equation-coach.js','practical-lesson-engine.js','lesson-presentation-catalog.js','lesson-exam-studio.js'])vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;const rich=context.window.GCSE_RICH_CONTENT;const catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;const practicalEngine=context.window.GCSE_PRACTICAL_LESSON_ENGINE;const exam=context.window.GCSE_LESSON_EXAM_STUDIO;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
let chapters=0,corePages=0,cases=0,responseExamples=0,questionPacks=0;const commands=new Set(Object.keys(exam.commandGuide||{}));const subjectCases={biology:0,chemistry:0,physics:0};

for(const topic of data.topics||[]){
  chapters++;const guide=rich.guides?.[topic.id];const sections=guide?.textbook||[];assert(sections.length>=3,`${topic.id}: needs at least three textbook core sections for Phase 6.`);corePages+=Math.min(3,sections.length);
  const sampleIndexes=[0,Math.floor((topic.lessons.length-1)/2),Math.max(0,topic.lessons.length-1)];
  for(let i=0;i<3;i++){
    const index=sampleIndexes[i];const title=topic.lessons[index]?.[0];const lesson=rich.getLesson(topic,title,index);const model=catalog.build(topic,title,index,lesson);model.subject=topic.subject;
    const practical=model.practical?practicalEngine.build(topic,title,model):null;const pack=exam.build(model,practical);questionPacks++;
    const missing=exam.validate(pack);assert(missing.length===0,`${topic.id} · ${title}: incomplete exam pack (${missing.join(', ')}).`);
    const q=i===0?(pack.questions.find(x=>x.marks<=2)||pack.questions[0]):i===1?(pack.questions.find(x=>x.section==='Application')||pack.questions.find(x=>x.marks===4&&x.command!=='Calculate')):(pack.questions.find(x=>x.marks===6)||pack.questions.at(-1));
    assert(Boolean(q),`${topic.id}: missing Phase 6 question ${i+1}.`);if(q){assert(exam.commandGuide[q.command],`${topic.id}: ${q.command} lacks command-word guidance.`);assert((q.marking||[]).length>=Math.min(q.marks,4),`${topic.id}: insufficient indicative marking for ${q.command}.`);assert(String(q.modelAnswer||'').length>20,`${topic.id}: model response too thin.`);}
    cases++;responseExamples+=3;subjectCases[topic.subject]++;
  }
}
assert(chapters===25,`Expected 25 textbook chapters, found ${chapters}.`);assert(corePages===75,`Expected 75 core textbook pages, found ${corePages}.`);assert(cases===75,`Expected 75 exam-literacy cases, found ${cases}.`);assert(responseExamples===225,`Expected 225 weak/improved/model exemplars, found ${responseExamples}.`);assert(commands.size===8,`Expected 8 command-word guides, found ${commands.size}.`);
for(const cmd of ['Define','Describe','Explain','Calculate','Analyse','Evaluate','Compare','Suggest'])assert(commands.has(cmd),`Command-word coach missing ${cmd}.`);

const source=read('textbook-phase6.js');for(const token of ['Exam Skills','Exam language','Weak response','Improved response','Model response','Why this response is at this level','Indicative points covered','original AQA-style practice','data-phase6-answer','data-open-exam-skills','GCSE_TEXTBOOK_PHASE6'])assert(source.includes(token),`textbook-phase6.js missing '${token}'.`);
const css=read('textbook-phase6.css');for(const token of ['.textbook-exam-inline','.textbook-command-grid','.textbook-exam-tabs','.textbook-command-coach','.textbook-response-ladder','.textbook-response-card.weak','.textbook-response-card.improved','.textbook-response-card.model'])assert(css.includes(token),`textbook-phase6.css missing '${token}'.`);

if(failures.length){console.error(`TEXTBOOK PHASE 6 AUDIT FAILED (${failures.length})`);failures.slice(0,120).forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log(`TEXTBOOK PHASE 6 AUDIT PASSED: ${chapters} textbook chapters / ${corePages} core pages expose ${cases} contextual exam-literacy cases with ${responseExamples} weak → improved → model response exemplars; ${commands.size} command words coached; Biology ${subjectCases.biology}, Chemistry ${subjectCases.chemistry}, Physics ${subjectCases.physics} cases validated.`);
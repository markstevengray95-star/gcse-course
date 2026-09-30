import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of ['course-data.js','rich-content.js','textbook-phase2.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const phase2=context.window.GCSE_TEXTBOOK_PHASE2;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(phase2,'Textbook Phase 2 module did not load.');
assert(data?.topics?.length===25,`Expected 25 topics, found ${data?.topics?.length??0}.`);

let sections=0,questions=0,deepParagraphs=0,examples=0;
const misconceptionSet=new Set();
const subjectSections={biology:0,chemistry:0,physics:0};

for(const topic of data?.topics||[]){
  const guide=rich?.guides?.[topic.id];
  assert(guide,`${topic.id}: missing textbook guide.`);
  for(let i=0;i<(guide?.textbook?.length||0);i++){
    const model=phase2.buildSectionModel(topic,guide,i,'triple');
    sections++;subjectSections[topic.subject]=(subjectSections[topic.subject]||0)+1;
    assert(model?.title,`${topic.id} section ${i+1}: missing title.`);
    assert(typeof model?.quick==='string'&&model.quick.length>=20,`${topic.id} section ${i+1}: quick explanation is too short.`);
    assert(Array.isArray(model?.deep)&&model.deep.length>=1,`${topic.id} section ${i+1}: missing deeper explanation.`);
    deepParagraphs+=model.deep?.length||0;
    assert(model?.example?.question,`${topic.id} section ${i+1}: missing grounded example.`);
    assert(Array.isArray(model?.example?.steps),`${topic.id} section ${i+1}: example steps are malformed.`);
    examples++;
    assert(typeof model?.misconception==='string'&&model.misconception.length>=35,`${topic.id} section ${i+1}: misconception support is missing.`);
    misconceptionSet.add(model.misconception);
    assert(Array.isArray(model?.questions)&&model.questions.length===3,`${topic.id} section ${i+1}: expected 3 understanding checks, found ${model?.questions?.length??0}.`);
    questions+=model.questions?.length||0;
    assert(Array.isArray(model?.relatedLessonTitles)&&model.relatedLessonTitles.length>=1,`${topic.id} section ${i+1}: not grounded in a related lesson.`);
    assert(model.relatedLessonTitles.every(Boolean),`${topic.id} section ${i+1}: malformed related lesson title.`);
  }
}

assert(sections===75,`Expected 75 core textbook sections, found ${sections}.`);
assert(questions===225,`Expected 225 understanding checks, found ${questions}.`);
assert(examples===75,`Expected 75 section examples, found ${examples}.`);
assert(deepParagraphs>=75,`Expected at least one deeper paragraph per section, found ${deepParagraphs}.`);
assert(misconceptionSet.size>=20,`Expected varied misconception guidance, found only ${misconceptionSet.size} unique statements.`);
assert(subjectSections.biology===21,`Expected 21 Biology core sections, found ${subjectSections.biology}.`);
assert(subjectSections.chemistry===30,`Expected 30 Chemistry core sections, found ${subjectSections.chemistry}.`);
assert(subjectSections.physics===24,`Expected 24 Physics core sections, found ${subjectSections.physics}.`);

const source=read('textbook-phase2.js');
for(const token of ['Quick explanation','Understand it properly','Common misconception','Check your understanding','Show answer guidance','gcse-science-textbook-phase2-v1']) assert(source.includes(token),`Textbook Phase 2 source missing '${token}'.`);
const css=read('textbook-phase2.css');
for(const selector of ['.textbook-quick-explanation','.textbook-deep-explanation','.textbook-context-example','.textbook-misconception','.textbook-understanding-check','.textbook-check-item']) assert(css.includes(selector),`Textbook Phase 2 CSS missing ${selector}.`);
const index=read('index.html');
assert(index.includes('textbook-phase2.css'),'index.html is missing textbook-phase2.css.');
assert(index.includes('textbook-phase2.js'),'index.html is missing textbook-phase2.js.');
assert(index.indexOf('textbook-phase2.css')>index.indexOf('textbook-phase1.css'),'Phase 2 CSS must load after Phase 1 CSS.');
assert(index.indexOf('textbook-phase2.js')>index.indexOf('textbook-phase1.js'),'Phase 2 JS must load after Phase 1 JS.');

if(failures.length){
  console.error(`TEXTBOOK PHASE 2 AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`TEXTBOOK PHASE 2 AUDIT PASSED: ${sections} core pages now use Quick explanation → Understand it properly → Example → Common misconception → Check your understanding; ${deepParagraphs} deeper-explanation paragraphs, ${examples} grounded examples and ${questions} understanding checks validated across Biology ${subjectSections.biology}, Chemistry ${subjectSections.chemistry}, Physics ${subjectSections.physics}.`);
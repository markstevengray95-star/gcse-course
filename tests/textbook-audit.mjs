import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console,renderTextbook(){},escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}};
vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','rich-content.js','textbook-enhancements.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const textbook=context.window.GCSE_TEXTBOOK_ENHANCEMENTS;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(textbook,'Textbook enhancement module did not load.');
assert(data?.topics?.length===25,`Expected 25 topics, found ${data?.topics?.length??0}.`);
const plan=textbook?.diagramPlan||{};
assert(Object.keys(plan).length===25,`Expected diagram plans for 25 topics, found ${Object.keys(plan).length}.`);

let diagramCount=0;
for(const topic of data.topics||[]){
  const diagrams=plan[topic.id];
  assert(Array.isArray(diagrams),`${topic.id}: missing diagram plan.`);
  assert(diagrams?.length===3,`${topic.id}: expected exactly 3 textbook diagrams, found ${diagrams?.length??0}.`);
  const names=new Set();
  for(const item of diagrams||[]){
    assert(Array.isArray(item)&&item.length===2,`${topic.id}: malformed diagram plan item.`);
    assert(item[0]&&item[1],`${topic.id}: diagram type/label missing.`);
    assert(!names.has(item[1]),`${topic.id}: duplicate diagram label '${item[1]}'.`);names.add(item[1]);
    const svg=textbook.visual(item[0],item[1]);
    assert(typeof svg==='string'&&svg.includes('<svg'),`${topic.id}: '${item[1]}' did not render SVG output.`);
    assert(svg.includes('role="img"'),`${topic.id}: '${item[1]}' diagram lacks accessible image role.`);
    diagramCount++;
  }

  const guide=rich.guides[topic.id];
  const terms=textbook.buildTerms(topic,guide);
  assert(Array.isArray(terms)&&terms.length>=4,`${topic.id}: expected at least 4 interactive key terms, found ${terms?.length??0}.`);
  for(const term of terms){
    assert(term.term&&term.definition,`${topic.id}: terminology record missing term or definition.`);
    assert(term.why&&term.example&&term.mistake,`${topic.id}: '${term.term}' missing extended terminology information.`);
    assert(Array.isArray(term.related),`${topic.id}: '${term.term}' related terms should be an array.`);
  }
  const sample=terms[0];
  const linked=textbook.linkTerms(`This sentence uses ${sample.term} in context.`,terms);
  assert(linked.includes('class="term-link"'),`${topic.id}: key terminology is not clickable inside textbook text.`);
  assert(linked.includes('data-term='),`${topic.id}: clickable term lacks data-term binding.`);
}

assert(diagramCount===75,`Expected 75 textbook diagrams (3 × 25 topics), found ${diagramCount}.`);
const index=read('index.html');
assert(index.includes('textbook-enhancements.css'),'index.html is missing textbook-enhancements.css.');
assert(index.includes('textbook-enhancements.js'),'index.html is missing textbook-enhancements.js.');
assert(index.indexOf('textbook-enhancements.js')>index.indexOf('app.js'),'Textbook enhancements must load after app.js so renderTextbook exists.');
const css=read('textbook-enhancements.css');
for(const selector of ['.term-link','.term-chip-grid','.term-modal','.diagram-gallery-grid','.textbook-diagram']) assert(css.includes(selector),`Textbook CSS missing required selector ${selector}.`);
const source=read('textbook-enhancements.js');
for(const text of ['Key terminology','Terminology explorer','Common misconception','Related terms','Visual learning','Highlighted terminology is clickable']) assert(source.includes(text),`Textbook enhancement source missing '${text}'.`);

if(failures.length){
  console.error(`TEXTBOOK AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`TEXTBOOK AUDIT PASSED: ${data.topics.length} topics, ${diagramCount} relevant diagrams, interactive terminology available in every topic.`);

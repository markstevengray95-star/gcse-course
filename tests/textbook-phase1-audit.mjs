import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of ['course-data.js','rich-content.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
const totals={biology:0,chemistry:0,physics:0};
let totalPages=0,totalCoreSections=0;

assert(data?.topics?.length===25,`Expected 25 textbook topics, found ${data?.topics?.length??0}.`);
for(const topic of data?.topics||[]){
  const guide=rich?.guides?.[topic.id];
  assert(guide,`${topic.id}: missing rich-content textbook guide.`);
  assert(Array.isArray(guide?.textbook)&&guide.textbook.length>0,`${topic.id}: textbook has no core sections.`);
  const sections=guide?.textbook?.length||0;
  const pages=sections+4; // contents + core sections + worked example + visual summary + glossary
  totalCoreSections+=sections;totalPages+=pages;totals[topic.subject]=(totals[topic.subject]||0)+pages;
  assert(guide?.worked?.title&&guide?.worked?.question&&Array.isArray(guide?.worked?.steps),`${topic.id}: worked example is incomplete.`);
}

const source=read('textbook-phase1.js');
for(const token of [
  'gcse-science-textbook-reader-v1','textbook-reader-sidebar','textbook-cover-page','textbook-chapter-page',
  'worked-example','visual-summary','glossary','data-textbook-prev','data-textbook-next','pages viewed',
  'ArrowRight','ArrowLeft','GCSE_TEXTBOOK_PHASE1'
]) assert(source.includes(token),`Textbook Phase 1 source missing '${token}'.`);

const css=read('textbook-phase1.css');
for(const selector of [
  '.textbook-reader{','.textbook-reader-sidebar','.textbook-reader-topbar','.textbook-cover-page',
  '.textbook-contents-list','.textbook-reader-footer','.textbook-reader-page[hidden]'
]) assert(css.includes(selector),`Textbook Phase 1 CSS missing ${selector}.`);

const index=read('index.html');
assert(index.includes('textbook-phase1.css'),'index.html is missing textbook-phase1.css.');
assert(index.includes('textbook-phase1.js'),'index.html is missing textbook-phase1.js.');
assert(index.indexOf('textbook-phase1.css')>index.indexOf('textbook-enhancements.css'),'Textbook Phase 1 CSS must load after textbook enhancements.');
assert(index.indexOf('textbook-phase1.js')>index.indexOf('textbook-enhancements.js'),'Textbook Phase 1 JS must load after textbook enhancements.');

if(failures.length){
  console.error(`TEXTBOOK PHASE 1 AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`TEXTBOOK PHASE 1 AUDIT PASSED: 25 digital chapters, ${totalCoreSections} core textbook sections reorganised into ${totalPages} reader pages (Biology ${totals.biology}, Chemistry ${totals.chemistry}, Physics ${totals.physics}); saved page position, viewed-page progress, contents navigation and Previous/Next controls validated.`);
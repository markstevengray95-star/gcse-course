import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const index=read('index.html');
const js=read('course-polish.js');
const css=read('course-polish.css');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

assert(index.includes('course-polish.css'),'index.html does not load course-polish.css.');
assert(index.includes('course-polish.js'),'index.html does not load course-polish.js.');
assert(index.indexOf('course-polish.js')>index.indexOf('project-hub.js'),'course-polish.js must load after project-hub.js so it can simplify the final UI.');
assert(index.indexOf('course-polish.css')>index.indexOf('project-hub.css'),'course-polish.css should load after project-hub.css.');

for(const group of [
  "learn:['overview','lessons','textbook','activities']",
  "practical:['practicals','simulation']",
  "practice:['exam','quiz']",
  "revise:['equations','coach']"
]) assert(js.includes(group),`Missing contextual navigation group: ${group}`);

for(const feature of [
  'simplifyTopicTabs','Detailed lesson notes','Understand it in depth','Core explanation','How to build a strong explanation',
  'Terminology to use accurately','Save to notebook','Save selection','selection-save-button','notebookSearch','notebookTopicOnly',
  'Highlighted text','Saved section','addNote','injectSaveButtons','positionSelectionButton'
]) assert(js.includes(feature),`course-polish.js missing feature: ${feature}`);

assert(js.includes("biologyMeta||lesson?.chemistryMeta||lesson?.physicsMeta"),'Detailed lessons are not reading subject specification metadata.');
assert(js.includes('meta?.focus||lesson.objectives'),'Detailed lessons are not using specification focus points/objectives.');
assert(js.includes("notes.push({id:Date.now()+Math.random()"),'Notebook capture is not storing saved selections/blocks.');
assert(js.includes("root.contains(range.commonAncestorContainer)"),'Selection saver is not restricted to course content.');
assert(js.includes("text.length<3||text.length>1500"),'Selection saver needs sensible text-length limits.');

for(const selector of [
  '.content-tabs button[hidden]','.lesson-detail-plus','.detail-focus-grid','.save-note-chip','.selection-save-button',
  '.notebook-tools','.enhanced-note','.course-extra-map','.topic-toolbar','.course-quick-launch'
]) assert(css.includes(selector),`course-polish.css missing layout style: ${selector}`);
assert(css.includes('@media(max-width:680px)'),'Mobile layout rules missing.');
assert(css.includes('grid-template-columns:1fr!important'),'Mobile single-column simplification missing.');
assert(css.includes('position:sticky'),'Mobile topic navigation should remain accessible while scrolling.');

if(failures.length){
  console.error(`POLISH AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('POLISH AUDIT PASSED: contextual navigation, detailed lessons, notebook capture and responsive layout are present.');

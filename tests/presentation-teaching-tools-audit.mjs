import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const js=read('presentation-teaching-tools.js');
const css=read('presentation-teaching-tools.css');
const index=read('index.html');

for(const token of [
  'gcse-science-presentation-visited-v1',
  'gcse-science-presentation-mastery-v1',
  'Lesson overview',
  'Presenter notes',
  'Lesson mastery',
  'Review',
  'Developing',
  'Secure',
  'Save review plan to notebook',
  'MutationObserver',
  'data-slide-map',
  'data-presenter-notes',
  'data-mastery-state',
  'GCSE_LESSON_PRESENTATION_CATALOG',
  'GCSE_COURSE_POLISH?.addNote',
  'presentation-response',
  'presentation-mastery'
]) assert(js.includes(token),`presentation-teaching-tools.js missing ${token}`);

for(const phase of ['Ready','Learn','Practise','Check','Review']) assert(js.includes(phase),`Presentation phase ${phase} missing.`);
for(const type of ['retrieval','objectives','teach','specpoint','terms','worked','practice','spec','exam','plenary']) assert(js.includes(type),`Presenter guidance missing slide type ${type}.`);

for(const selector of [
  '.presentation-phase','.presentation-slide-map','.slide-map-grid','.presenter-notes','.presenter-note-grid',
  '.lesson-presentation-mastery','.presentation-mastery-points','.mastery-state-buttons','.presentation-mastery-actions'
]) assert(css.includes(selector),`presentation-teaching-tools.css missing ${selector}`);
assert(css.includes('@media(max-width:900px)'),'Teaching controls lack tablet responsive styling.');
assert(css.includes('@media(max-width:620px)'),'Teaching controls lack phone responsive styling.');

assert(index.includes('presentation-teaching-tools.css'),'index.html does not load presentation-teaching-tools.css.');
assert(index.includes('presentation-teaching-tools.js'),'index.html does not load presentation-teaching-tools.js.');
assert(index.indexOf('presentation-teaching-tools.js')>index.indexOf('interactive-presentations.js'),'Teaching controls must load after interactive presentation enhancements.');
assert(index.indexOf('presentation-teaching-tools.css')>index.indexOf('interactive-presentations.css'),'Teaching-control CSS should load after interactive presentation CSS.');

if(failures.length){
  console.error(`PRESENTATION TEACHING TOOLS AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('Presentation teaching tools audit passed: slide overview, visited-slide memory, presenter notes, lesson pacing and persistent per-AQA-point mastery are wired into the lesson decks.');

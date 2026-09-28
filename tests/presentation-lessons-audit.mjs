import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const src=read('presentation-lessons.js');
const css=read('presentation-lessons.css');
const index=read('index.html');

for(const token of [
  'gcse-science-presentation-position-v1',
  'Presentation lesson',
  'Learning objectives',
  'The big idea',
  'Key terminology',
  'Worked example',
  'Now you try',
  'Specification coverage',
  'Turn knowledge into marks',
  'Plenary & self-check',
  'Full notes',
  'Present ⛶',
  'requestFullscreen',
  'data-slide-jump',
  'presentation-full-notes',
  'GCSE_TEXTBOOK_ENHANCEMENTS',
  'GCSE_COURSE_POLISH?.addNote',
  "e.key==='ArrowRight'",
  "e.key==='ArrowLeft'"
]) assert(src.includes(token),`presentation-lessons.js missing ${token}`);

const typeMatches=[...src.matchAll(/type:'(title|objectives|teach|terms|worked|practice|spec|exam|plenary)'/g)].map(m=>m[1]);
assert(new Set(typeMatches).size>=9,`Expected at least 9 distinct presentation slide stages, found ${new Set(typeMatches).size}.`);
assert(src.includes('meta?.focus||lesson.objectives'),'Presentation objectives should use exact mapped specification focus points where available.');
assert(src.includes('meta?.equations||[]'),'Presentation should retain lesson equations.');
assert(src.includes('meta?.practical'),'Presentation should retain required-practical links.');
assert(src.includes('lesson.examTip'),'Presentation should retain exam guidance.');
assert(src.includes('lesson.depth?.misconception'),'Presentation should retain lesson misconceptions.');
assert(src.includes('seq.independent'),'Presentation should include independent practice.');
assert(src.includes('seq.plenary'),'Presentation should include lesson plenary prompts.');

for(const cls of ['.lesson-presentation','.presentation-toolbar','.presentation-stage','.presentation-slide','.presentation-diagram','.presentation-term-grid','.presentation-worked','.presentation-bottom','.presentation-dots','.presentation-full-notes']){
  assert(css.includes(cls),`presentation-lessons.css missing ${cls}`);
}
assert(css.includes(':fullscreen'),'Presentation CSS should include fullscreen styling.');
assert(css.includes('@media(max-width:900px)'),'Presentation deck lacks tablet responsive styling.');
assert(css.includes('@media(max-width:650px)'),'Presentation deck lacks mobile responsive styling.');

assert(index.includes('presentation-lessons.css'),'index.html does not load presentation-lessons.css.');
assert(index.includes('presentation-lessons.js'),'index.html does not load presentation-lessons.js.');
assert(index.indexOf('presentation-lessons.js')>index.indexOf('study-checkpoints.js'),'Presentation layer should load after study checkpoints so it enhances the fully assembled lesson.');

if(failures.length){
  console.error(`Presentation lesson audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('Presentation lesson audit passed: staged slide deck, AQA content retention, diagrams, fullscreen, notebook saving, keyboard navigation and full-notes fallback are present.');

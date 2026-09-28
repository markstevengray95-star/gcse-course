import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const src=read('presentation-lessons.js');
const catalog=read('lesson-presentation-catalog.js');
const css=read('presentation-lessons.css');
const index=read('index.html');

for(const token of [
  'gcse-science-presentation-position-v1',
  'Individual lesson presentation',
  'Retrieval starter',
  'Everything this lesson must cover',
  'The big idea',
  'Key terminology',
  'Worked example',
  'Now you try',
  'Complete lesson checklist',
  'Turn knowledge into marks',
  'Plenary & self-check',
  'Full notes',
  'Present ⛶',
  'requestFullscreen',
  'data-slide-jump',
  'presentation-full-notes',
  'GCSE_LESSON_PRESENTATION_CATALOG',
  'GCSE_SCIENCE_DIAGRAMS',
  'GCSE_LESSON_VISUALS',
  'GCSE_COURSE_POLISH?.addNote',
  "e.key==='ArrowRight'",
  "e.key==='ArrowLeft'",
  'm.teachingUnits||m.specificationPoints',
  "type:'specpoint'",
  "type:'specapply'",
  'm.keyTerms',
  'm.workedExample',
  'm.equations',
  'm.practical',
  'm.keyIdeas',
  'm.skills'
]) assert(src.includes(token),`presentation-lessons.js missing ${token}`);

for(const token of ['objectives:focus','specificationPoints:rawSpecPoints','model.specificationPoints=model.teachingUnits','teachingUnits','equations:[...(coverage?.equations','practical:coverage?.practical','examTip','misconception','independentPractice','plenary']){
  assert(catalog.includes(token),`lesson-presentation-catalog.js missing ${token}`);
}

for(const cls of ['.lesson-presentation','.presentation-toolbar','.presentation-stage','.presentation-slide','.presentation-diagram','.presentation-term-grid','.presentation-worked','.presentation-bottom','.presentation-dots','.presentation-full-notes']){
  assert(css.includes(cls),`presentation-lessons.css missing ${cls}`);
}
assert(css.includes(':fullscreen'),'Presentation CSS should include fullscreen styling.');
assert(css.includes('@media(max-width:900px)'),'Presentation deck lacks tablet responsive styling.');
assert(css.includes('@media(max-width:650px)'),'Presentation deck lacks mobile responsive styling.');

assert(index.includes('lesson-presentation-catalog.js'),'index.html does not load lesson-presentation-catalog.js.');
assert(index.includes('presentation-lessons.css'),'index.html does not load presentation-lessons.css.');
assert(index.includes('presentation-lessons.js'),'index.html does not load presentation-lessons.js.');
assert(index.indexOf('lesson-presentation-catalog.js')<index.indexOf('presentation-lessons.js'),'Per-lesson presentation catalogue must load before the deck renderer.');
assert(index.indexOf('presentation-lessons.js')>index.indexOf('study-checkpoints.js'),'Presentation layer should load after study checkpoints so it enhances the fully assembled lesson.');

if(failures.length){
  console.error(`Presentation lesson audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('Presentation lesson audit passed: variable lesson-specific decks retain AQA content, Phase 3 teaching depth, Phase 4 lesson visuals, fullscreen, notebook saving, keyboard navigation and full-notes fallback.');
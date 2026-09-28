import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const context={window:{}};vm.createContext(context);vm.runInContext(read('science-diagrams.js'),context,{filename:'science-diagrams.js'});
const lib=context.window.GCSE_SCIENCE_DIAGRAMS;
const expected=['b1','b2','b3','b4','b5','b6','b7','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','p1','p2','p3','p4','p5','p6','p7','p8'];
assert(lib&&typeof lib.get==='function','Science diagram library did not load.');
assert(JSON.stringify(lib?.topicIds)===JSON.stringify(expected),'Science diagram library must cover all 25 GCSE topics in course order.');
for(const id of expected){
  const d=lib?.get(id);
  assert(Boolean(d),`${id}: missing scientific diagram.`);
  assert(typeof d?.title==='string'&&d.title.length>3,`${id}: diagram title missing.`);
  assert(typeof d?.svg==='string'&&d.svg.includes('<svg'),`${id}: diagram SVG missing.`);
  assert(d?.svg?.includes('science-hotspot'),`${id}: diagram lacks clickable hotspots.`);
  assert(Array.isArray(d?.labels)&&d.labels.length>=4,`${id}: expected at least four labelled scientific features.`);
  for(const label of d?.labels||[]){
    assert(label.id&&label.name&&label.detail,`${id}: incomplete diagram label metadata.`);
  }
}

const interactive=read('interactive-presentations.js');
for(const token of [
  'gcse-science-presentation-mode-v1',
  'Student',
  'Teacher',
  'Interactive diagram',
  'Test me',
  'Show all labels',
  'Quick check',
  'Reveal next step',
  'Sequence challenge',
  'draggable="true"',
  'Mini whiteboard',
  'Save answer to notebook',
  'Complete AQA coverage',
  'Every mapped specification point',
  'Skills to practise',
  'Exit confidence',
  'GCSE_SPECIFICATION_COMPLETENESS',
  'GCSE_SCIENCE_DIAGRAMS'
]) assert(interactive.includes(token),`interactive-presentations.js missing ${token}`);
assert(interactive.includes("presentationMode==='teacher'"),'Teacher mode is not implemented.');
assert(interactive.includes('data-diagram-hotspot'),'Diagram hotspot interaction is missing.');
assert(interactive.includes('data-knowledge-option'),'Knowledge-check interaction is missing.');
assert(interactive.includes('data-whiteboard-save'),'Mini-whiteboard notebook integration is missing.');

const css=read('interactive-presentations.css');
for(const cls of ['.interactive-diagram-card','.science-real-diagram','.science-hotspot','.presentation-knowledge-check','.worked-interactive-controls','.sequence-challenge','.mini-whiteboard','.complete-coverage-layout','.plenary-confidence','.presentation-mode-toggle']) assert(css.includes(cls),`interactive-presentations.css missing ${cls}`);
assert(css.includes('@media(max-width:900px)')&&css.includes('@media(max-width:650px)'),'Interactive presentations need tablet and mobile layouts.');

const index=read('index.html');
for(const asset of ['science-diagrams.js','interactive-presentations.js','interactive-presentations.css']) assert(index.includes(asset),`index.html does not load ${asset}.`);
assert(index.indexOf('science-diagrams.js')<index.indexOf('presentation-lessons.js'),'Science diagrams must load before presentation-lessons.js.');
assert(index.indexOf('interactive-presentations.js')>index.indexOf('presentation-lessons.js'),'Interactive presentation layer must load after presentation-lessons.js.');

if(failures.length){console.error(`Interactive presentation audit failed (${failures.length}):`);failures.forEach(x=>console.error(`- ${x}`));process.exit(1);}
console.log('Interactive presentation audit passed: 25 scientific diagrams, clickable hotspots, teacher/student modes, knowledge checks, worked-step reveals, sequencing, mini-whiteboard and full AQA coverage are present.');
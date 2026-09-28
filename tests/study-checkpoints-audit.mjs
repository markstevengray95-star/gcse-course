import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

const src=read('study-checkpoints.js');
const css=read('study-checkpoints.css');
const index=read('index.html');

for(const token of [
  'gcse-science-study-checkpoints-v1',
  'gcse-science-resume-v2',
  'Needs review',
  'Developing',
  'Secure',
  'Resume where you left off',
  'Personal review queue',
  'End-of-lesson checkpoint',
  'topicConfidence',
  'reviewItems',
  'openResume',
  'stableKey',
  'ageDays>=14'
]) assert(src.includes(token),`study-checkpoints.js missing ${token}`);

assert(src.includes("confidence===3&&!lessonProgress"),'Secure checkpoint should be able to complete the lesson.');
assert(src.includes("state.activeTab==='lessons'"),'Resume logic should preserve lesson context.');
assert(src.includes('resume.lessonTitle'),'Resume should preserve lesson identity by title, not only index.');
assert(src.includes('focus[0]')&&src.includes('focus[1]'),'Checkpoint prompts should use lesson-specific specification focus points.');
assert(src.includes('This is your own study confidence, not an exam grade.'),'Checkpoint must distinguish confidence from assessment grades.');
assert(src.includes('injectCoachReviewSummary')&&src.includes('checkpoint-coach-panel')&&src.includes("state.activeTab!=='coach'"),'Progress Coach should include checkpoint evidence.');

for(const cls of ['.resume-learning-card','.study-review-queue','.lesson-checkpoint','.checkpoint-confidence','.topic-confidence-summary','.lesson-confidence-pill','.coach-confidence-list']){
  assert(css.includes(cls),`study-checkpoints.css missing ${cls}`);
}
assert(css.includes('@media(max-width:820px)'),'Checkpoint UI lacks tablet/mobile responsive rules.');
assert(css.includes('@media(max-width:560px)'),'Checkpoint UI lacks small-screen responsive rules.');

assert(index.includes('study-checkpoints.css'),'index.html does not load study-checkpoints.css.');
assert(index.includes('study-checkpoints.js'),'index.html does not load study-checkpoints.js.');
assert(index.indexOf('study-checkpoints.js')>index.indexOf('learning-flow.js'),'Study checkpoint layer must load after learning-flow.js.');

if(failures.length){
  console.error(`Study checkpoint audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('Study checkpoint audit passed: resume state, lesson confidence, review queue, Progress Coach integration and responsive UI are present.');

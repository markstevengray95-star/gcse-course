import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const context={window:{},console};
vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','question-bank.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const hub=read('project-hub.js');
const css=read('project-hub.css');
const index=read('index.html');

assert(index.includes('project-hub.css'),'index.html does not load project-hub.css.');
assert(index.includes('project-hub.js'),'index.html does not load project-hub.js.');
assert(index.indexOf('project-hub.js')>index.indexOf('revision-mode.js'),'Project hub must load after revision mode so the Revision destination can use the mixed-revision button.');
assert(index.indexOf('project-hub.js')>index.indexOf('chemistry-spec-ui.js'),'Project hub should wrap the final topic rendering layer.');

for(const label of ['Learn','Exam Questions','Practical Lab','Revision']) assert(hub.includes(label),`Main navigation is missing '${label}'.`);
for(const id of ['coursePrimaryNav','courseQuickLaunch','examHubView','practicalHubView','topicBreadcrumb','topicQuickNav']) assert(hub.includes(id),`Project hub is missing ${id}.`);
for(const feature of ['Targeted practice','Mock builder','Mark & improve','Examiner skills']) assert(hub.includes(feature),`Exam Questions hub is missing '${feature}'.`);
for(const feature of ['Apparatus checks','Graphs & uncertainty','Repeat measurements','Method evaluation']) assert(hub.includes(feature),`Practical Lab hub is missing '${feature}'.`);
for(const step of ['Set up','Run','Repeat','Analyse']) assert(hub.includes(step),`Practical workflow is missing '${step}'.`);

assert(hub.includes('https://gcse-exam-questions.vercel.app'),'Exam marker project URL is not integrated.');
assert(hub.includes("openTopicTab(btn.dataset.openExamTopic,'exam')"),'Exam topic launchers do not open the in-course exam-practice tab.');
assert(hub.includes("openTopicTab(btn.dataset.openPracticalTopic,'practicals')"),'Practical guide launchers are not wired.');
assert(hub.includes("openTopicTab(btn.dataset.openPracticalSim,'simulation')"),'Practical simulation launchers are not wired.');
assert(hub.includes("document.getElementById('mixedRevisionButton')"),'Revision navigation is not linked to mixed revision.');

for(const selector of ['.course-primary-nav','.course-quick-launch','.project-launch-grid','.topic-breadcrumb','.topic-quick-nav','.secondary-topic-tabs']) assert(css.includes(selector),`project-hub.css missing ${selector}.`);
assert(css.includes('@media(max-width:760px)'),'Project navigation has no mobile breakpoint.');
assert(css.includes('@media(max-width:520px)'),'Project navigation has no narrow-phone breakpoint.');

const subjects=['biology','chemistry','physics'];
const practicalCounts={};
for(const subject of subjects) practicalCounts[subject]=data.topics.filter(t=>t.subject===subject).reduce((n,t)=>n+(t.practicals?.length||0),0);
assert(practicalCounts.biology===10,`Expected 10 Biology practical launch entries, found ${practicalCounts.biology}.`);
assert(practicalCounts.chemistry===8,`Expected 8 Chemistry practical launch entries, found ${practicalCounts.chemistry}.`);
assert(practicalCounts.physics===10,`Expected 10 Physics practical launch entries, found ${practicalCounts.physics}.`);

const questionCounts={};
for(const subject of subjects) questionCounts[subject]=data.topics.filter(t=>t.subject===subject).reduce((n,t)=>n+(rich.guides[t.id]?.exam?.length||0),0);
for(const subject of subjects) assert(questionCounts[subject]>=30,`${subject}: insufficient in-course exam questions for project hub launchers (${questionCounts[subject]}).`);

assert(hub.includes("['overview','lessons','textbook']"),'Topic quick navigation does not group learning tabs.');
assert(hub.includes("['practicals','simulation']"),'Topic quick navigation does not group practical tabs.');
assert(hub.includes("['activities','exam','quiz']"),'Topic quick navigation does not group practice tabs.');

if(failures.length){
  console.error(`PROJECT HUB AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`PROJECT HUB AUDIT PASSED: 4 main destinations; Exam Questions project integrated; Practical Lab exposes ${practicalCounts.biology+practicalCounts.chemistry+practicalCounts.physics} AQA practical launchers; responsive simplified topic navigation enabled.`);

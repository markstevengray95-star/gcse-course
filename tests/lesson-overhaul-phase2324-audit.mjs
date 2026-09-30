import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js','lesson-quality-schema.js','lesson-teaching-depth.js','lesson-visuals.js','equation-coach.js','practical-lesson-engine.js','lesson-question-ladder.js','lesson-exam-studio.js','lesson-differentiation.js','lesson-mode-plans.js','lesson-synoptic-connections.js','lesson-presentation-catalog.js','lesson-quality-enrichment.js','lesson-overhaul-phase2122.js','lesson-overhaul-phase2324.js'])vm.runInContext(read(file),context,{filename:file});
const data=context.window.GCSE_COURSE_DATA,rich=context.window.GCSE_RICH_CONTENT,catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};let lessons=0,teamRounds=0,expertChallenges=0;const subjects={biology:0,chemistry:0,physics:0};const keys=new Set();
for(const topic of data.topics){for(let index=0;index<topic.lessons.length;index++){
  const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson),p23=model?.overhaul23,p24=model?.overhaul24;lessons++;subjects[topic.subject]++;keys.add(p23?.lessonKey);
  assert(model?.lessonOverhaulVersion==='24.0',`${topic.id} · ${title}: lesson overhaul version missing.`);
  assert(p23?.version==='23.0',`${topic.id} · ${title}: Phase 23 missing.`);
  assert(p23?.rules?.teams===4,`${topic.id} · ${title}: Phase 23 must default to four teams.`);
  assert(p23?.rules?.individualLeaderboard===false,`${topic.id} · ${title}: individual leaderboard must stay disabled.`);
  assert(p23?.rules?.facilitatorControlled===true,`${topic.id} · ${title}: facilitator control missing.`);
  assert(p23?.rounds?.length===4,`${topic.id} · ${title}: expected four team quiz rounds.`);
  assert(p23?.rounds?.every(r=>String(r.prompt||'').includes(title)),`${topic.id} · ${title}: team quiz round is not lesson-specific.`);
  const vote=p23?.rounds?.find(r=>r.type==='vote');assert(vote?.choices?.length===3,`${topic.id} · ${title}: scenario vote requires three choices.`);assert(vote?.choices?.filter(c=>c.correct).length===1,`${topic.id} · ${title}: scenario vote requires one correct claim.`);
  assert(p23?.rounds?.every(r=>String(r.reveal||'').length>15&&String(r.discussion||'').length>20),`${topic.id} · ${title}: team quiz reveal/discussion too weak.`);
  teamRounds+=p23?.rounds?.length||0;
  assert(p24?.version==='24.0',`${topic.id} · ${title}: Phase 24 missing.`);
  assert(p24?.unlock?.requiresAllSpecificationPointsSecure===true,`${topic.id} · ${title}: expert challenge mastery gate missing.`);
  assert(p24?.unlock?.optional===true&&p24?.unlock?.penaltyForSkipping===false,`${topic.id} · ${title}: expert challenges must remain optional with no skipping penalty.`);
  assert(p24?.challenges?.length===3,`${topic.id} · ${title}: expected three expert challenges.`);
  assert(p24?.challenges?.every(c=>String(c.prompt||'').includes(title)),`${topic.id} · ${title}: expert challenge is not lesson-specific.`);
  assert(p24?.challenges?.every(c=>(c.success||[]).length>=3),`${topic.id} · ${title}: expert success criteria incomplete.`);
  expertChallenges+=p24?.challenges?.length||0;
}}
assert(lessons===439,`Expected 439 lessons, found ${lessons}.`);assert(subjects.biology===163&&subjects.chemistry===166&&subjects.physics===110,`Subject counts wrong: ${JSON.stringify(subjects)}.`);assert(keys.size===439,`Expected 439 unique phase lesson keys, found ${keys.size}.`);assert(teamRounds===1756,`Expected 1756 team quiz rounds, found ${teamRounds}.`);assert(expertChallenges===1317,`Expected 1317 expert challenges, found ${expertChallenges}.`);
const engine=read('lesson-overhaul-phase2324.js');for(const token of ['Live Team Quiz Mode','individualLeaderboard:false','facilitatorControlled:true','Scenario vote','Unlockable Expert Challenges','requiresAllSpecificationPointsSecure:true','penaltyForSkipping:false','lessonOverhaulVersion'])assert(engine.includes(token),`Phase 23/24 engine missing ${token}.`);
const ui=read('lesson-overhaul-phase2324-ui.js');for(const token of ['Presenter-led team rounds','data-team-vote','data-quiz-reveal','gcse-science-presentation-mastery-v1','Expert mode unlocked','Expert challenges locked','data-expert-response'])assert(ui.includes(token),`Phase 23/24 UI missing ${token}.`);
const css=read('lesson-overhaul-phase2324.css');for(const token of ['.phase23-team-quiz','.team-quiz-teams','.team-vote-buttons','.phase24-expert-challenges','.expert-progress','.expert-challenge-grid'])assert(css.includes(token),`Phase 23/24 CSS missing ${token}.`);
const index=read('index.html');for(const token of ['lesson-overhaul-phase2324.css','lesson-overhaul-phase2324.js','lesson-overhaul-phase2324-ui.js'])assert(index.includes(token),`index.html is not loading ${token}.`);
if(failures.length){console.error(`LESSON OVERHAUL PHASE 23/24 AUDIT FAILED (${failures.length})`);failures.slice(0,180).forEach(x=>console.error(`- ${x}`));if(failures.length>180)console.error(`...and ${failures.length-180} more.`);process.exit(1)}
console.log(`LESSON OVERHAUL PHASE 23/24 AUDIT PASSED: ${lessons} lessons expose ${teamRounds} facilitator-led team quiz rounds with no individual leaderboard and ${expertChallenges} optional mastery-gated expert challenges across Biology ${subjects.biology}, Chemistry ${subjects.chemistry}, Physics ${subjects.physics}.`);

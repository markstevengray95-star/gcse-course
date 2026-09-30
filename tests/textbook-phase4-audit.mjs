import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','equation-coach.js']) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const specs={biology:context.window.GCSE_BIOLOGY_SPEC_DETAIL,chemistry:context.window.GCSE_CHEMISTRY_SPEC_DETAIL,physics:context.window.GCSE_PHYSICS_SPEC_DETAIL};
const coach=context.window.GCSE_EQUATION_COACH;
const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg);};
let mappedRelationships=0,equationLessons=0,equationTopics=0,uniqueModules=0,profiled=0;
const bySubject={biology:0,chemistry:0,physics:0};

for(const topic of data.topics||[]){
  const mapped=specs[topic.subject]?.topics?.[topic.id];
  const unique=new Map();let topicHas=false;
  for(const section of mapped?.sections||[])for(const lesson of section.lessons||[]){
    const list=lesson.equations||[];if(list.length){equationLessons++;topicHas=true;}
    for(const eq of list){
      mappedRelationships++;const key=coach.norm(eq);if(!unique.has(key))unique.set(key,eq);
      const model=coach.build(eq,topic.subject);const missing=coach.validate(model);
      assert(missing.length===0,`${topic.id} · ${lesson.title} · ${eq}: incomplete calculation model (${missing.join(', ')}).`);
      assert(model.route?.join('|')==='Meaning|Symbols & units|Rearrange|Substitute|Calculate|Check',`${eq}: textbook calculation route changed.`);
      assert((model.worked||[]).length>=4,`${eq}: worked calculation needs at least four stages.`);
      assert(String(model.scaffold||'').length>15,`${eq}: scaffolded question is too thin.`);
      assert(String(model.independent||'').length>15,`${eq}: independent question is too thin.`);
      assert(String(model.exam||'').length>15,`${eq}: exam application is too thin.`);
      if(coach.profileFor(eq))profiled++;
    }
  }
  if(topicHas)equationTopics++;
  uniqueModules+=unique.size;bySubject[topic.subject]+=unique.size;
}

assert(mappedRelationships===50,`Expected 50 mapped equation relationships, found ${mappedRelationships}.`);
assert(equationLessons===45,`Expected 45 equation-linked lessons, found ${equationLessons}.`);
assert(equationTopics>0,'No equation-linked textbook topics found.');
assert(uniqueModules>0,'No unique calculation modules found.');
assert(profiled>0,'No specialised Equation Coach profiles were reused by the textbook.');

const source=read('textbook-phase4.js');
for(const token of ['gcse-science-textbook-phase4-v1','Calculation workshop','Equation meaning','Symbols & units','Rearrangement','Worked example','Scaffolded calculation','Independent calculation','Check & apply','data-calc-reveal-next','data-calc-answer','GCSE_TEXTBOOK_PHASE4']) assert(source.includes(token),`textbook-phase4.js missing '${token}'.`);
const css=read('textbook-phase4.css');
for(const token of ['.textbook-calculation-page','.textbook-calc-tabs','.textbook-calc-symbols','.textbook-calc-route','.textbook-calc-worked','.textbook-calc-practice-grid','.textbook-calc-checklist']) assert(css.includes(token),`textbook-phase4.css missing '${token}'.`);
const index=read('index.html');
assert(index.includes('textbook-phase4.css'),'index.html missing textbook-phase4.css.');
assert(index.includes('textbook-phase4.js'),'index.html missing textbook-phase4.js.');
assert(index.indexOf('textbook-phase4.css')>index.indexOf('textbook-phase3.css'),'Phase 4 CSS must load after Phase 3 CSS.');
assert(index.indexOf('textbook-phase4.js')>index.indexOf('equation-coach.js'),'Textbook Phase 4 must load after Equation Coach.');

if(failures.length){console.error(`TEXTBOOK PHASE 4 AUDIT FAILED (${failures.length})`);failures.slice(0,100).forEach(x=>console.error(`- ${x}`));process.exit(1);}
console.log(`TEXTBOOK PHASE 4 AUDIT PASSED: ${mappedRelationships} mapped equation relationships from ${equationLessons} equation-linked lessons reorganised into ${uniqueModules} topic calculation modules across ${equationTopics} textbook chapters (Biology ${bySubject.biology}, Chemistry ${bySubject.chemistry}, Physics ${bySubject.physics}); Meaning → Symbols & units → Rearrange → Substitute → Calculate → Check, progressive worked examples and saved scaffolded/independent practice validated.`);
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const storage = new Map();
let clock=1000;
const sandbox = {
  console,
  Math,
  Date,
  JSON,
  performance:{now:()=>clock},
  setTimeout:()=>0,
  clearTimeout:()=>{},
  CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
  localStorage:{
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  },
  document:{createElement:()=>({click(){}})},
  Blob:class Blob{},
  URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
  dispatchEvent:()=>true,
  addEventListener:()=>{}
};
sandbox.window=sandbox;
vm.createContext(sandbox);

for(const file of [
  'course-data.js',
  'physics-spec-detail.js',
  'biology-spec-detail.js',
  'chemistry-spec-detail.js',
  'spec-practical-sync.js',
  'practical-source-port.js',
  'practical-source-fidelity.js'
]){
  vm.runInContext(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),sandbox,{filename:file});
}

const DATA=sandbox.GCSE_COURSE_DATA;
const PORT=sandbox.GCSE_PRACTICAL_SOURCE_PORT;
const SYNC=sandbox.GCSE_SPEC_PRACTICAL_SYNC;
const FIDELITY=sandbox.GCSE_PRACTICAL_SOURCE_FIDELITY;
assert.ok(DATA,'course data should load');
assert.ok(PORT,'migrated practical source port should load');
assert.ok(FIDELITY,'practical fidelity layer should load');
assert.ok(SYNC,'spec practical sync should load');
assert.equal(SYNC.total,28,'spec practical sync should expose 28 AQA practical launchers');
assert.deepEqual(JSON.parse(JSON.stringify(SYNC.counts)),{biology:10,chemistry:8,physics:10},'synced AQA practical subject totals changed');

const catalog=PORT.catalog;
const sourceIds=Array.from(PORT.sourceIds);
assert.equal(sourceIds.length,26,'original practical-sim source set must remain 26 practical topics');
const sourceModeCount=sourceIds.reduce((n,id)=>n+catalog[id].setups.length,0);
assert.equal(sourceModeCount,36,'original practical-sim source set must retain all 36 investigation modes');
assert.deepEqual(Array.from(PORT.courseSupplementIds).sort(),['ion-tests','milk-decay'],'only the two missing course practicals should be supplements');
assert.equal(Object.keys(catalog).length,28,'integrated course should expose 28 practical simulations');
assert.equal(Object.values(catalog).reduce((n,c)=>n+c.setups.length,0),38,'integrated course should expose 38 investigation modes including two course supplements');

const subjectCounts=sourceIds.reduce((acc,id)=>{acc[catalog[id].subject]=(acc[catalog[id].subject]||0)+1;return acc;},{});
assert.deepEqual(subjectCounts,{biology:9,chemistry:7,physics:10},'original source practical subject split changed unexpectedly');

const expectedMultiMode={
  'plant-responses':2,
  'field-investigations':2,
  'rates-of-reaction':2,
  resistance:2,
  density:3,
  acceleration:2,
  waves:2,
  radiation:2,
  light:2
};
for(const [id,count] of Object.entries(expectedMultiMode)) assert.equal(catalog[id].setups.length,count,`${id} lost an investigation mode`);

let validatedSourceModes=0;
for(const id of sourceIds){
  const c=catalog[id];
  assert.ok(['biology','chemistry','physics'].includes(c.subject),`${id} has an invalid subject`);
  assert.ok(c.question&&c.method?.length>=3&&c.safety&&c.note,`${id} lost method/safety/model notes`);
  for(let mode=0;mode<c.setups.length;mode++){
    PORT.initialise(id,mode);
    const setup=PORT.currentSetup();
    assert.equal(PORT.state.mode,mode,`${id} mode ${mode} did not initialise`);
    assert.ok(setup.name&&setup.iv&&setup.dv,`${id} mode ${mode} lost variable definitions`);
    assert.ok(Array.isArray(setup.controls)&&setup.controls.length>=2,`${id} mode ${mode} lost control variables`);
    const result=c.model(PORT.state.values,PORT.state);
    assert.ok(result&&Array.isArray(result.readings)&&typeof result.observation==='string',`${id} mode ${mode} model did not return a usable result`);
    assert.ok(PORT.apparatusGuide[id]?.[mode]||PORT.apparatusGuide[id]?.[0],`${id} mode ${mode} lost its source apparatus guide`);
    validatedSourceModes++;
  }
}
assert.equal(validatedSourceModes,36,'not every original source investigation mode was validated');

for(const id of PORT.courseSupplementIds){
  PORT.initialise(id,0);
  const result=catalog[id].model(PORT.state.values,PORT.state);
  assert.ok(result&&Array.isArray(result.readings)&&result.observation,`${id} supplement does not return a usable result`);
  assert.ok(catalog[id].courseSupplement&&catalog[id].separate,`${id} should be clearly marked as a Separate Science course supplement`);
}

const coursePracticals=DATA.topics.flatMap(topic=>(topic.practicals||[]).map(title=>({topicId:topic.id,subject:topic.subject,title})));
assert.equal(coursePracticals.length,28,'course should expose the 28 synced required-practical launchers');
const mapped=[];
for(const item of coursePracticals){
  const id=PORT.matchCoursePractical(item.title,item.subject);
  assert.ok(catalog[id],`${item.topicId}: ${item.title} mapped to a missing practical`);
  assert.equal(catalog[id].subject,item.subject,`${item.topicId}: ${item.title} mapped across subjects to ${id}`);
  mapped.push({course:item.title,id});
}
assert.equal(new Set(mapped.map(x=>x.id)).size,28,'every synced AQA practical should map to its own meaningful simulator');
assert.equal(PORT.matchCoursePractical('Required practical 10 (Biology only): investigate temperature and decay using milk pH.','biology'),'milk-decay','Biology RP10 must not fall back to osmosis');
assert.equal(PORT.matchCoursePractical('Required practical 7 (Chemistry only): use chemical tests to identify ions in unknown single ionic compounds.','chemistry'),'ion-tests','Chemistry RP7 must not fall back to chromatography');

// Original guided-workflow fidelity: setup first, then trial, record, repeat.
PORT.initialise('osmosis');
assert.equal(PORT.run(),null,'a trial must not run before the guided setup is complete');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
assert.equal(PORT.state.guideReady,true,'three original setup checks should unlock the investigation');
assert.ok(PORT.run(),'guided setup should unlock a trial');
assert.equal(PORT.repeat(),false,'repeat should be blocked until the current trial is recorded');
assert.ok(PORT.record(),'completed trial should record');
assert.ok(PORT.repeat(),'a recorded quantitative trial should be repeatable');
assert.ok(PORT.statsForRows().some(x=>x.n>=2),'repeat readings should produce repeat statistics');

PORT.initialise('titration');
const initialTitre=PORT.state.values.x;
assert.equal(PORT.titrationDrop(),false,'titration drops should be blocked before guided setup');
assert.equal(PORT.state.values.x,initialTitre,'blocked titration drop should not alter the burette setting');

PORT.initialise('making-salts');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
const stage1=PORT.run();
assert.equal(PORT.state.stage,0,'salt preparation should begin at source stage 1, not skip it');
assert.match(stage1.readings[0][1],/1 \/ 5/,'first salt-preparation run should display stage 1 of 5');
PORT.run();
assert.equal(PORT.state.stage,1,'second salt-preparation run should advance to source stage 2');

PORT.initialise('reaction-time');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
PORT.run();
assert.equal(PORT.state.reactionPhase,'waiting','reaction-time trial should wait for the release signal');
const falseStart=PORT.catchReaction();
assert.equal(falseStart?.falseStart,true,'early reaction-time catches should be treated as false starts');
assert.equal(PORT.state.result,null,'false start should not create a recorded result');

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const asset of ['practical-source-ui.css','practical-source-port.js','practical-source-fidelity.js','practical-source-ui.js']) assert.ok(html.includes(asset),`${asset} is not loaded by index.html`);
assert.ok(html.indexOf('practical-source-port.js')<html.indexOf('practical-source-fidelity.js'),'source engine must load before fidelity layer');
assert.ok(html.indexOf('practical-source-fidelity.js')<html.indexOf('practical-source-ui.js'),'fidelity layer must load before practical UI');

const ui=fs.readFileSync(new URL('../practical-source-ui.js',import.meta.url),'utf8');
for(const token of ['injectTopicPracticalLaunchers','enhanceProjectHub','data-topic-source-lab','data-open-practical-topic','data-open-practical-sim','Export CSV','Repeat this setting','Guided apparatus setup']) assert.ok(ui.includes(token),`practical source UI lost ${token}`);

const port=fs.readFileSync(new URL('../practical-source-port.js',import.meta.url),'utf8');
for(const token of ['reaction-time','making-salts','titrationDrop','randomQuadrat','statsForRows','halfRange','showUncertainty','exportCSV']) assert.ok(port.includes(token),`practical source engine lost ${token}`);

const fidelity=fs.readFileSync(new URL('../practical-source-fidelity.js',import.meta.url),'utf8');
for(const token of ['milk-decay','ion-tests','apparatusGuide','_currentRecorded','courseSupplementIds']) assert.ok(fidelity.includes(token),`practical fidelity layer lost ${token}`);

console.log(`PRACTICAL MIGRATION AUDIT PASSED: ${sourceIds.length} original source topics / ${sourceModeCount} source modes preserved; ${Object.keys(catalog).length} course simulations / 38 modes available; all ${coursePracticals.length} synced AQA practical launchers map uniquely.`);
console.log('Mapped practical IDs:',mapped.map(x=>x.id).join(', '));

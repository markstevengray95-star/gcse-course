import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const storage = new Map();
const sandbox = {
  console,
  Math,
  Date,
  JSON,
  performance:{now:()=>1000},
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

for(const file of ['course-data.js','practical-source-port.js']){
  vm.runInContext(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),sandbox,{filename:file});
}

const DATA=sandbox.GCSE_COURSE_DATA;
const PORT=sandbox.GCSE_PRACTICAL_SOURCE_PORT;
assert.ok(DATA,'course data should load');
assert.ok(PORT,'migrated practical source port should load');

const catalog=PORT.catalog;
const ids=Object.keys(catalog);
assert.equal(ids.length,26,'original practical-sim catalog must keep all 26 practical topics');
const modeCount=ids.reduce((n,id)=>n+catalog[id].setups.length,0);
assert.equal(modeCount,36,'original practical-sim catalog must keep all 36 investigation modes');

const subjectCounts=ids.reduce((acc,id)=>{acc[catalog[id].subject]=(acc[catalog[id].subject]||0)+1;return acc;},{});
assert.deepEqual(subjectCounts,{biology:9,chemistry:7,physics:10},'source practical subject split changed unexpectedly');

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

let validatedModes=0;
for(const id of ids){
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
    validatedModes++;
  }
}
assert.equal(validatedModes,36,'not every source investigation mode was validated');

const coursePracticals=DATA.topics.flatMap(topic=>(topic.practicals||[]).map(title=>({topicId:topic.id,subject:topic.subject,title})));
assert.equal(coursePracticals.length,28,'course should expose the 28 mapped required-practical launchers');
const mapped=[];
for(const item of coursePracticals){
  const id=PORT.matchCoursePractical(item.title,item.subject);
  assert.ok(catalog[id],`${item.topicId}: ${item.title} mapped to a missing source practical`);
  assert.equal(catalog[id].subject,item.subject,`${item.topicId}: ${item.title} mapped across subjects to ${id}`);
  mapped.push({course:item.title,id});
}
assert.ok(new Set(mapped.map(x=>x.id)).size>=20,'course practical launchers are collapsing onto too few source practicals');

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const asset of ['practical-source-ui.css','practical-source-port.js','practical-source-ui.js']) assert.ok(html.includes(asset),`${asset} is not loaded by index.html`);
assert.ok(html.indexOf('practical-source-port.js')<html.indexOf('practical-source-ui.js'),'source practical engine must load before its UI');

const ui=fs.readFileSync(new URL('../practical-source-ui.js',import.meta.url),'utf8');
for(const token of ['injectTopicPracticalLaunchers','enhanceProjectHub','data-topic-source-lab','data-open-practical-topic','data-open-practical-sim','Export CSV','Repeat this setting','Guided apparatus setup']) assert.ok(ui.includes(token),`practical source UI lost ${token}`);

const port=fs.readFileSync(new URL('../practical-source-port.js',import.meta.url),'utf8');
for(const token of ['reaction-time','making-salts','titrationDrop','randomQuadrat','statsForRows','halfRange','showUncertainty','exportCSV']) assert.ok(port.includes(token),`practical source engine lost ${token}`);

console.log(`PRACTICAL SOURCE PORT AUDIT PASSED: ${ids.length} source practical topics, ${modeCount} investigation modes, ${coursePracticals.length} course launchers; all ${validatedModes} source modes initialise and return usable results.`);
console.log('Mapped source practical IDs:',[...new Set(mapped.map(x=>x.id))].join(', '));

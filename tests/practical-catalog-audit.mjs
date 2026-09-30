import assert from 'node:assert/strict';
import {loadPracticalRuntime} from './practical-source-runtime.mjs';
const {PORT,SYNC,FIDELITY}=loadPracticalRuntime();
assert.ok(PORT&&SYNC&&FIDELITY);
assert.equal(SYNC.total,28);
assert.deepEqual(JSON.parse(JSON.stringify(SYNC.counts)),{biology:10,chemistry:8,physics:10});
const catalog=PORT.catalog,sourceIds=Array.from(PORT.sourceIds);
assert.equal(sourceIds.length,26);
assert.equal(sourceIds.reduce((n,id)=>n+catalog[id].setups.length,0),36);
assert.equal(Object.keys(catalog).length,28);
assert.equal(Object.values(catalog).reduce((n,c)=>n+c.setups.length,0),38);
assert.deepEqual(Array.from(PORT.courseSupplementIds).sort(),['ion-tests','milk-decay']);
const expectedMultiMode={'plant-responses':2,'field-investigations':2,'rates-of-reaction':2,resistance:2,density:3,acceleration:2,waves:2,radiation:2,light:2};
for(const [id,count] of Object.entries(expectedMultiMode))assert.equal(catalog[id].setups.length,count,`${id} mode count`);
let modes=0;
for(const id of sourceIds){
  const c=catalog[id];
  for(let mode=0;mode<c.setups.length;mode++){
    PORT.initialise(id,mode);
    const result=c.model(PORT.state.values,PORT.state);
    assert.ok(result&&Array.isArray(result.readings)&&typeof result.observation==='string',`${id} mode ${mode} result`);
    assert.ok(PORT.apparatusGuide[id]?.[mode]||PORT.apparatusGuide[id]?.[0],`${id} mode ${mode} apparatus`);
    modes++;
  }
}
for(const id of PORT.courseSupplementIds){PORT.initialise(id,0);assert.ok(catalog[id].model(PORT.state.values,PORT.state)?.readings?.length,`${id} supplement result`);}
assert.equal(modes,36);
console.log('PRACTICAL CATALOG AUDIT PASSED: 26 original topics / 36 source modes preserved; 28 course simulations / 38 modes available.');

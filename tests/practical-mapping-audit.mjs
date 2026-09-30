import assert from 'node:assert/strict';
import {loadPracticalRuntime} from './practical-source-runtime.mjs';
const {DATA,PORT}=loadPracticalRuntime();
const practicals=DATA.topics.flatMap(topic=>(topic.practicals||[]).map(title=>({topicId:topic.id,subject:topic.subject,title})));
assert.equal(practicals.length,28,'synced course launcher count');
const mapped=practicals.map(item=>({...item,id:PORT.matchCoursePractical(item.title,item.subject)}));
for(const item of mapped){
  assert.ok(PORT.catalog[item.id],`${item.topicId}: missing mapping for ${item.title}`);
  assert.equal(PORT.catalog[item.id].subject,item.subject,`${item.topicId}: cross-subject mapping for ${item.title}`);
}
const unique=[...new Set(mapped.map(x=>x.id))];
assert.equal(unique.length,28,`expected 28 unique practical destinations, got ${unique.length}: ${mapped.map(x=>`${x.topicId}=${x.id}`).join(', ')}`);
assert.equal(PORT.matchCoursePractical('Required practical 4: use qualitative reagents to test for carbohydrates, lipids and proteins.','biology'),'food-tests');
assert.equal(PORT.matchCoursePractical('Required practical 3: investigate factors affecting resistance.','physics'),'resistance');
assert.equal(PORT.matchCoursePractical('Required practical 10 (Biology only): investigate temperature and decay using milk pH.','biology'),'milk-decay');
assert.equal(PORT.matchCoursePractical('Required practical 7 (Chemistry only): use chemical tests to identify ions in unknown single ionic compounds.','chemistry'),'ion-tests');
console.log('PRACTICAL MAPPING AUDIT PASSED: all 28 synced AQA practical launchers map to unique subject-correct simulations.');
console.log(mapped.map(x=>`${x.topicId}: ${x.id}`).join('\n'));

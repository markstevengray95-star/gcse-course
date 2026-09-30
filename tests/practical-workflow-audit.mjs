import assert from 'node:assert/strict';
import {loadPracticalRuntime} from './practical-source-runtime.mjs';
const {PORT}=loadPracticalRuntime();

PORT.initialise('osmosis');
assert.equal(PORT.run(),null,'trial must stay locked before guided setup');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
assert.equal(PORT.state.guideReady,true,'three setup checks should unlock lab');
assert.ok(PORT.run(),'trial should run after setup');
assert.equal(PORT.repeat(),false,'repeat should wait for recording');
assert.ok(PORT.record(),'trial should record');
assert.ok(PORT.repeat(),'recorded trial should repeat');
assert.ok(PORT.statsForRows().some(x=>x.n>=2),'repeat statistics should include n >= 2');

PORT.initialise('titration');
const titre=PORT.state.values.x;
assert.equal(PORT.titrationDrop(),false,'dropwise titration stays locked before setup');
assert.equal(PORT.state.values.x,titre,'blocked drop must not change volume');

PORT.initialise('making-salts');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
const first=PORT.run();
assert.equal(PORT.state.stage,0,'first preparation run must remain source stage 1');
assert.match(first.readings[0][1],/1 \/ 5/);
PORT.run();
assert.equal(PORT.state.stage,1,'second preparation run should advance to stage 2');

PORT.initialise('reaction-time');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
PORT.run();
assert.equal(PORT.state.reactionPhase,'waiting');
const falseStart=PORT.catchReaction();
assert.equal(falseStart?.falseStart,true,'early catch should be a false start');
assert.equal(PORT.state.result,null,'false start must not create a result');

PORT.initialise('field-investigations',1);
assert.equal(PORT.randomQuadrat(),false,'random quadrat must stay locked before setup');
PORT.advanceGuide();PORT.advanceGuide();PORT.advanceGuide();
assert.notEqual(PORT.randomQuadrat(),false,'random quadrat should unlock with setup');

console.log('PRACTICAL WORKFLOW AUDIT PASSED: setup gates, recording/repeats, titration, salt stages, reaction false-starts and quadrat workflow validated.');

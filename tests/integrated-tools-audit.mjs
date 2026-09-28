import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const index=read('index.html');
const integration=read('integrated-tools.js');
const styles=read('integrated-tools.css');
const arcade=read('tools/science-word-arcade.html');
const physics=read('tools/aqa-physics-interactive.html');
const physicsFixed=read('tools/aqa-physics-interactive-fixed.html');

for(const asset of ['integrated-tools.css','integrated-tools.js']){
  assert(index.includes(asset),`index.html does not load ${asset}.`);
}
assert(index.indexOf('specification-completeness.js')<index.indexOf('integrated-tools.js'),'Integrated tools must load after the core course/specification layers.');

for(const phrase of ['Science Word Arcade','AQA Physics Interactive','tools/science-word-arcade.html','tools/aqa-physics-interactive-fixed.html','gcse-science-integrated-tool-history-v1','gcse-course-tool-result']){
  assert(integration.includes(phrase),`integrated-tools.js missing '${phrase}'.`);
}
for(const phrase of ["state.activeTab==='exam'","state.activeTab==='quiz'","state.activeTab==='simulation'","state.activeTab==='equations'","topic.subject==='physics'",'notes.push']){
  assert(integration.includes(phrase),`Integrated course routing/history missing '${phrase}'.`);
}
assert(styles.includes('.integrated-tool-modal'),'Integrated tool modal styles are missing.');
assert(styles.includes('@media(max-width:720px)'),'Integrated tool mobile layout is missing.');

const arcadeModes=['Command Cracker','Describe vs Explain','Variable Vault','Vocab Target'];
for(const mode of arcadeModes)assert(arcade.includes(mode),`Science Word Arcade missing '${mode}'.`);
for(const feature of ['Score','Lives','Streak','Review errors','gcse-science-word-arcade-last','gcse-course-tool-result']){
  assert(arcade.toLowerCase().includes(feature.toLowerCase()),`Science Word Arcade missing '${feature}'.`);
}
for(const bank of ['commands','describeVsExplain','variables','vocab'])assert(arcade.includes(`${bank}:`),`Science Word Arcade question bank missing '${bank}'.`);

const equations=['F=ma','W=mg','W=Fs','Ek=0.5mv²','Ep=mgh','P=E/t','M=Fd','F=ke','V=IR','Q=It','P=VI','E=QV','v=fλ','s=vt','p=mv'];
for(const equation of equations)assert(physics.includes(`"${equation}"`),`Physics simulator missing equation ${equation}.`);
for(const phase of ['Phase 1 · Dynamic relationship','Phase 2 · Scaffolding & rearrangement','Phase 3 · Unit trap check','Phase 4 · Final calculation','Foundation','Higher','gcse-course-tool-result']){
  assert(physics.includes(phase),`Physics simulator missing '${phase}'.`);
}
assert(physics.includes('renderVisual()'),'Physics simulator dynamic visual engine is missing.');
assert(physics.includes('checkConv'),'Physics simulator SI-unit conversion step is missing.');
assert(physics.includes('checkFinal'),'Physics simulator final calculation check is missing.');

assert(physicsFixed.includes("fetch('aqa-physics-interactive.html'"),'Checked Physics loader does not load the integrated simulator.');
assert(physicsFixed.includes("let m=r(200,1000),v=rand(5,25);"),'Checked Physics loader does not contain the kinetic-energy parse correction.');
assert(physicsFixed.includes('document.write(html)'),'Checked Physics loader does not render the corrected simulator.');

if(failures.length){
  console.error(`Integrated tools audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`Integrated tools audit passed: ${arcadeModes.length} Science Word Arcade modes and ${equations.length} Physics equation modules are connected to the GCSE course.`);

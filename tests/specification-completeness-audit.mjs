import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','specification-completeness.js']){
  vm.runInContext(read(file),context,{filename:file});
}

const data=context.window.GCSE_COURSE_DATA;
const complete=context.window.GCSE_SPECIFICATION_COMPLETENESS;
const maps={biology:context.window.GCSE_BIOLOGY_SPEC_DETAIL,chemistry:context.window.GCSE_CHEMISTRY_SPEC_DETAIL,physics:context.window.GCSE_PHYSICS_SPEC_DETAIL};
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
let mappedTotal=0;
const counts={biology:0,chemistry:0,physics:0};
let focusTotal=0;
let practicalCount=0;
let higherCount=0;
let separateCount=0;

assert(data?.topics?.length===25,'Expected 25 course topics.');
assert(complete?.buildCoverage,'Specification completeness engine did not load.');

for(const subject of ['biology','chemistry','physics']){
  const map=maps[subject];
  assert(Boolean(map?.topics),`${subject}: specification map missing.`);
  for(const [topicId,topicSpec] of Object.entries(map?.topics||{})){
    const topic=data.topics.find(t=>t.id===topicId);
    assert(Boolean(topic),`${topicId}: mapped specification topic missing from course data.`);
    const courseTitles=new Set((topic?.lessons||[]).map(([name])=>name));
    for(const section of topicSpec.sections||[]){
      assert(section.ref&&section.title,`${topicId}: subsection is missing an AQA reference or title.`);
      for(const meta of section.lessons||[]){
        mappedTotal++;counts[subject]++;
        if(meta.scope==='triple')separateCount++;
        if(meta.tier==='higher')higherCount++;
        if(meta.practical)practicalCount++;
        focusTotal+=(meta.focus||[]).length;
        assert(courseTitles.has(meta.title),`${topicId}: '${meta.title}' is mapped in the specification but missing from the course lesson list.`);
        assert(/^4\./.test(meta.ref),`${topicId}: '${meta.title}' has invalid AQA subsection reference '${meta.ref}'.`);
        assert(Array.isArray(meta.focus)&&meta.focus.length>=3,`${topicId}: '${meta.title}' has fewer than 3 mapped specification teaching points.`);
        assert(['combined','triple'].includes(meta.scope),`${topicId}: '${meta.title}' has invalid course scope.`);
        assert(['all','higher'].includes(meta.tier),`${topicId}: '${meta.title}' has invalid tier metadata.`);

        const lesson={title:meta.title,section:[meta.section,(meta.focus||[]).join(' ')],depth:{explanation:(meta.focus||[]).join(' '),application:'Apply the idea to an unfamiliar examination context.',misconception:'Use precise scientific terminology.'}};
        const coverage=complete.buildCoverage(topic,meta.title,lesson);
        assert(Boolean(coverage),`${topicId}: '${meta.title}' did not produce specification coverage.`);
        if(!coverage)continue;
        assert(coverage.ref===meta.ref,`${topicId}: '${meta.title}' lost its AQA reference in coverage output.`);
        assert(coverage.section===meta.section,`${topicId}: '${meta.title}' lost its subsection title.`);
        assert(coverage.scope===meta.scope,`${topicId}: '${meta.title}' lost its Combined/Separate status.`);
        assert(coverage.tier===meta.tier,`${topicId}: '${meta.title}' lost its tier status.`);
        assert(coverage.points.length===meta.focus.length,`${topicId}: '${meta.title}' drops one or more specification points.`);
        meta.focus.forEach((point,index)=>assert(coverage.points[index]?.text===point,`${topicId}: '${meta.title}' specification point ${index+1} was altered or omitted.`));
        assert(Array.isArray(coverage.keyIdeas)&&coverage.keyIdeas.length>=1,`${topicId}: '${meta.title}' has no cross-course AQA key-idea link.`);
        assert(Array.isArray(coverage.skills)&&coverage.skills.length>=1,`${topicId}: '${meta.title}' has no Working Scientifically/skills coverage.`);
        if(meta.equations?.length){
          assert(coverage.equations.length===meta.equations.length,`${topicId}: '${meta.title}' drops an equation/relationship.`);
          meta.equations.forEach(eq=>assert(coverage.equations.includes(eq),`${topicId}: '${meta.title}' missing equation '${eq}'.`));
        }
        if(meta.practical)assert(coverage.practical===meta.practical,`${topicId}: '${meta.title}' drops its required-practical connection.`);
        const html=complete.coverageHtml(topic,lesson);
        assert(html.includes('Full specification coverage'),`${topicId}: '${meta.title}' does not render the coverage panel.`);
        assert(html.includes(meta.ref),`${topicId}: '${meta.title}' rendered panel does not show its AQA reference.`);
        assert((html.match(/data-spec-point=/g)||[]).length===meta.focus.length,`${topicId}: '${meta.title}' rendered panel does not expose every mapped specification point.`);
      }
    }
  }
}

assert(counts.biology>=160,`Expected at least 160 detailed Biology lessons, found ${counts.biology}.`);
assert(counts.chemistry>=160,`Expected at least 160 detailed Chemistry lessons, found ${counts.chemistry}.`);
assert(counts.physics>=100,`Expected at least 100 detailed Physics lessons, found ${counts.physics}.`);
assert(mappedTotal>=430,`Expected at least 430 mapped lessons across the three sciences, found ${mappedTotal}.`);
assert(focusTotal>=mappedTotal*3,`Expected at least three explicit specification points per lesson.`);
assert(practicalCount>=28,`Expected all required-practical links to remain mapped, found ${practicalCount}.`);
assert(higherCount>0,'No Higher Tier lesson metadata found.');
assert(separateCount>0,'No Separate Science-only lesson metadata found.');

const index=read('index.html');
for(const asset of ['specification-completeness.css','specification-completeness.js'])assert(index.includes(asset),`index.html does not load ${asset}.`);
assert(index.indexOf('course-polish.js')<index.indexOf('specification-completeness.js'),'Specification completeness should load after the lesson/UI polish layer.');
const source=read('specification-completeness.js');
for(const phrase of ['Full specification coverage','Working scientifically','AQA key ideas linked here','Required practical connection','Specification point'])assert(source.includes(phrase),`Specification completeness layer missing '${phrase}'.`);

if(failures.length){
  console.error(`Specification completeness audit failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`Specification completeness audit passed: ${mappedTotal} lessons (${counts.biology} Biology, ${counts.chemistry} Chemistry, ${counts.physics} Physics), ${focusTotal} explicit specification points, ${practicalCount} practical-linked lessons.`);

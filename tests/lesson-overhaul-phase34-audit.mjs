import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const context={window:{},console};
vm.createContext(context);
for(const file of [
  'course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js',
  'rich-content.js','physics-lesson-content.js','biology-lesson-content.js','chemistry-lesson-content.js','lesson-sequences.js',
  'lesson-quality-schema.js','lesson-teaching-depth.js','lesson-visuals.js','lesson-presentation-catalog.js'
]) vm.runInContext(read(file),context,{filename:file});

const data=context.window.GCSE_COURSE_DATA;
const rich=context.window.GCSE_RICH_CONTENT;
const depth=context.window.GCSE_LESSON_TEACHING_DEPTH;
const visuals=context.window.GCSE_LESSON_VISUALS;
const catalog=context.window.GCSE_LESSON_PRESENTATION_CATALOG;
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg);};

assert(depth?.enrich&&depth?.validate,'Phase 3 teaching-depth engine missing.');
assert(visuals?.get,'Phase 4 lesson-visual engine missing.');

let lessons=0,points=0,pointVisuals=0;
const lessonVisualIds=new Set();
const pointVisualIds=new Set();
const visualKinds=new Set();
const subjectPoints={biology:0,chemistry:0,physics:0};
const requiredSequence=['definition','explanation','example','visual','application','misconception','question'];

for(const topic of data.topics){
  for(let index=0;index<topic.lessons.length;index++){
    const title=topic.lessons[index][0];
    const lesson=rich.getLesson(topic,title,index);
    const model=catalog.build(topic,title,index,lesson);
    lessons++;
    assert(model?.teachingUnits?.length===model?.objectives?.length,`${topic.id} · ${title}: teaching-unit/specification-point mismatch.`);
    const lessonVisual=visuals.get(topic,title,model,null,index);
    assert(lessonVisual?.lessonSpecific===true,`${topic.id} · ${title}: lesson-specific visual missing.`);
    assert(typeof lessonVisual?.svg==='string'&&lessonVisual.svg.includes('<svg'),`${topic.id} · ${title}: visual is not an SVG scientific diagram.`);
    assert(!lessonVisualIds.has(lessonVisual.id),`${topic.id} · ${title}: lesson visual ID is not unique.`);
    lessonVisualIds.add(lessonVisual.id);visualKinds.add(lessonVisual.kind);

    (model.teachingUnits||[]).forEach((unit,i)=>{
      points++;subjectPoints[topic.subject]++;
      const missing=depth.validate(unit);
      assert(missing.length===0,`${topic.id} · ${title} · point ${i+1}: Phase 3 sequence incomplete (${missing.join(', ')}).`);
      assert(JSON.stringify(unit.sequence)===JSON.stringify(requiredSequence),`${topic.id} · ${title} · point ${i+1}: teaching sequence order incorrect.`);
      assert(unit.definition.length>5,`${topic.id} · ${title} · point ${i+1}: definition too thin.`);
      assert(unit.explanation.length>20,`${topic.id} · ${title} · point ${i+1}: explanation too thin.`);
      assert(unit.example.length>20,`${topic.id} · ${title} · point ${i+1}: example too thin.`);
      assert(unit.application.length>20,`${topic.id} · ${title} · point ${i+1}: application too thin.`);
      assert(unit.misconception.length>20,`${topic.id} · ${title} · point ${i+1}: misconception too thin.`);
      assert(unit.question.length>20,`${topic.id} · ${title} · point ${i+1}: check question too thin.`);
      const visual=visuals.get(topic,title,model,unit,index+i);
      pointVisuals++;
      assert(visual?.lessonSpecific===true&&visual?.pointSpecific===true,`${topic.id} · ${title} · point ${i+1}: point-specific visual missing.`);
      assert(typeof visual?.svg==='string'&&visual.svg.includes('<svg'),`${topic.id} · ${title} · point ${i+1}: point visual is not SVG.`);
      assert(!pointVisualIds.has(visual.id),`${topic.id} · ${title} · point ${i+1}: point visual ID is not unique.`);
      pointVisualIds.add(visual.id);visualKinds.add(visual.kind);
    });
  }
}

assert(lessons===439,`Expected 439 Phase 4 lesson visuals, found ${lessons}.`);
assert(lessonVisualIds.size===439,`Expected 439 unique lesson visual IDs, found ${lessonVisualIds.size}.`);
assert(points===1318,`Expected 1318 Phase 3 specification teaching units, found ${points}.`);
assert(pointVisuals===1318,`Expected 1318 point-specific visuals, found ${pointVisuals}.`);
assert(pointVisualIds.size===1318,`Expected 1318 unique point visual IDs, found ${pointVisualIds.size}.`);
assert(subjectPoints.biology>0&&subjectPoints.chemistry>0&&subjectPoints.physics>0,`Teaching units missing for a subject: ${JSON.stringify(subjectPoints)}.`);
assert(visualKinds.size>=10,`Expected broad scientific visual variety; found only ${visualKinds.size} visual kinds.`);

const presentation=read('presentation-lessons.js');
for(const token of ['GCSE_LESSON_VISUALS','lesson-specific-presentation-visual','pointTeachingSlides',"type:'specpoint'","type:'specapply'",'Definition','Explanation','Example','Application','Common misconception','Check understanding']) assert(presentation.includes(token),`presentation-lessons.js missing Phase 3/4 token: ${token}`);
const visualSource=read('lesson-visuals.js');
for(const token of ['cell','membrane','enzyme','circulation','dna','feedback','ecology','atom','bonding','calculation','electrolysis','energyProfile','chromatography','atmosphere','energyStores','circuit','particles','radiation','forces','waves','magnetism','space','concept']) assert(visualSource.includes(`function ${token}`),`lesson-visuals.js missing scientific visual type: ${token}`);
const css=read('lesson-overhaul-phase34.css');
for(const token of ['.lesson-specific-diagram','.spec-teaching-layout','.spec-depth-card','.spec-apply-grid','.spec-point-question']) assert(css.includes(token),`lesson-overhaul-phase34.css missing ${token}`);
const index=read('index.html');
assert(index.includes('lesson-overhaul-phase34.css'),'index.html missing Phase 3/4 CSS.');
assert(index.includes('lesson-visuals.js'),'index.html missing lesson-visuals.js.');
assert(index.includes('lesson-teaching-depth.js'),'index.html missing lesson-teaching-depth.js.');
assert(index.indexOf('lesson-teaching-depth.js')<index.indexOf('lesson-presentation-catalog.js'),'Teaching depth must load before presentation catalogue.');
assert(index.indexOf('lesson-visuals.js')<index.indexOf('presentation-lessons.js'),'Lesson visuals must load before presentation renderer.');

if(failures.length){
  console.error(`LESSON OVERHAUL PHASE 3/4 AUDIT FAILED (${failures.length})`);
  failures.slice(0,100).forEach(f=>console.error(`- ${f}`));
  if(failures.length>100)console.error(`...and ${failures.length-100} more failures.`);
  process.exit(1);
}
console.log(`LESSON OVERHAUL PHASE 3/4 AUDIT PASSED: ${lessons} lesson-specific visuals; ${points} AQA specification teaching units each contain definition → explanation → example → visual → application → misconception → question; ${visualKinds.size} scientific visual types used.`);
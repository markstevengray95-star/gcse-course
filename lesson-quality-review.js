(() => {
  const clean=v=>String(v??'').trim();
  const cap=(n,max)=>Math.max(0,Math.min(max,n));
  const SUBJECT_ORDER=['biology','chemistry','physics'];
  const READY_SCORE=90;
  function add(cat,key,points,earned,detail){cat.items.push({key,points,earned:cap(earned,points),detail:clean(detail)});cat.score+=cap(earned,points);cat.max+=points;}
  function review(model,topic,lesson,allTopics=[]){
    if(!model||!topic)return null;
    const cats={specification:{label:'Specification coverage',score:0,max:0,items:[]},teaching:{label:'Teaching explanation',score:0,max:0,items:[]},visuals:{label:'Visual quality',score:0,max:0,items:[]},interactivity:{label:'Interactivity',score:0,max:0,items:[]},questions:{label:'Questions',score:0,max:0,items:[]},exam:{label:'Exam preparation',score:0,max:0,items:[]},practicalMaths:{label:'Practical / calculation',score:0,max:0,items:[]},accessibility:{label:'Accessibility',score:0,max:0,items:[]}};
    const depth=window.GCSE_LESSON_TEACHING_DEPTH;
    const visuals=window.GCSE_LESSON_VISUALS;
    const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,model.title,model)||null;
    const questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[];
    const exam=window.GCSE_LESSON_EXAM_STUDIO?.build?.(model,practical)||null;
    const diff=window.GCSE_LESSON_DIFFERENTIATION?.build?.(model,topic,allTopics)||null;
    const modes=window.GCSE_LESSON_MODE_PLANS?.build?.(model)||null;
    const synoptic=window.GCSE_LESSON_SYNOPTIC?.build?.(model,topic,allTopics)||null;
    const lessonVisual=visuals?.get?.(topic,model.title,model,null,model.lessonIndex)||null;

    add(cats.specification,'reference',5,model.ref?5:0,model.ref||'AQA reference missing.');
    add(cats.specification,'mapped-points',5,model.specificationPoints?.length?5:0,`${model.specificationPoints?.length||0} mapped points.`);
    add(cats.specification,'point-retention',5,model.specificationPoints?.length===model.objectives?.length?5:0,'Mapped points retained in the presentation model.');
    add(cats.specification,'lesson-standard',5,window.GCSE_LESSON_PRESENTATION_CATALOG?.validate?.(model)?.length===0?5:0,'Presentation catalogue validation.');

    add(cats.teaching,'core',5,clean(model.coreExplanation).length>20?5:0,'Core explanation depth.');
    add(cats.teaching,'chunks',5,(model.teachingChunks||[]).length>=2?5:0,`${model.teachingChunks?.length||0} teaching chunks.`);
    add(cats.teaching,'checks',5,model.chunkChecks?.length===model.teachingChunks?.length?5:0,'One immediate check per teaching chunk.');
    const depthOk=(model.teachingUnits||[]).every(u=>!depth?.validate?.(u)?.length);
    add(cats.teaching,'point-depth',5,depthOk&&model.teachingUnits?.length?5:0,'Definition → explanation → example → application → misconception → question sequence.');

    const lessonVisualOk=lessonVisual?.lessonSpecific===true&&String(lessonVisual.svg||'').includes('<svg');
    add(cats.visuals,'lesson-visual',7,lessonVisualOk?7:0,'Lesson-specific scientific visual.');
    const pointVisualsOk=(model.teachingUnits||[]).every((u,i)=>{const v=visuals?.get?.(topic,model.title,model,u,model.lessonIndex+i);return v?.pointSpecific===true&&String(v.svg||'').includes('<svg');});
    add(cats.visuals,'point-visuals',8,pointVisualsOk&&model.teachingUnits?.length?8:0,'Point-specific diagrams for mapped teaching units.');

    add(cats.interactivity,'question-ladder',5,window.GCSE_LESSON_QUESTION_LADDER?.validate?.(questions)?.length===0?5:0,'Distributed interactive checks.');
    add(cats.interactivity,'differentiation',5,window.GCSE_LESSON_DIFFERENTIATION?.validate?.(diff)?.length===0?5:0,'Support / Core / Stretch plan.');
    const modeOk=window.GCSE_LESSON_MODE_PLANS?.validate?.(modes)?.length===0;
    add(cats.interactivity,'teacher-student',3,modeOk?3:0,'Teacher and Student mode plans.');
    add(cats.interactivity,'synoptic',2,window.GCSE_LESSON_SYNOPTIC?.validate?.(synoptic)?.length===0?2:0,'Synoptic transfer activity.');

    const commands=new Set(questions.map(q=>q.command));
    add(cats.questions,'variety',5,questions.length>=9&&commands.size>=8?5:0,`${questions.length} distributed questions using ${commands.size} command words.`);
    add(cats.questions,'marking',5,questions.length&&questions.every(q=>q.marks>0&&(q.marking||[]).length)?5:0,'Mark values and marking guidance.');

    const examValid=window.GCSE_LESSON_EXAM_STUDIO?.validate?.(exam)?.length===0;
    add(cats.exam,'exam-pack',5,examValid?5:0,'Lesson Exam Studio validation.');
    add(cats.exam,'extended',5,exam?.questions?.some(q=>q.marks===6)&&exam.totalMarks>=12?5:0,`${exam?.totalMarks||0} practice marks with six-mark extended response.`);

    let specialistOk=true,detail='No specialist practical/calculation requirement for this lesson.';
    if(model.practical){specialistOk=Boolean(practical)&&window.GCSE_PRACTICAL_LESSON_ENGINE?.validate?.(practical)?.length===0;detail='Required-practical coach validation.';}
    if(model.equations?.length){const eqOk=model.equations.every(eq=>Boolean(window.GCSE_EQUATION_COACH?.build?.(eq,topic.subject)));specialistOk=specialistOk&&eqOk;detail=model.practical?'Practical and equation coaching validation.':'Equation Coach validation.';}
    add(cats.practicalMaths,'specialist',5,specialistOk?5:0,detail);

    const aria=String(lessonVisual?.svg||'').includes('role="img"')&&String(lessonVisual?.svg||'').includes('aria-label=');
    add(cats.accessibility,'visual-semantics',2,aria?2:0,'Diagram has image semantics and an accessible name.');
    add(cats.accessibility,'clear-structure',2,model.title&&model.ref&&model.plenary?.length?2:0,'Clear title, reference and review structure.');
    add(cats.accessibility,'mode-support',1,modeOk?1:0,'Independent and teacher-led access routes.');

    const categories=Object.values(cats);const score=categories.reduce((n,c)=>n+c.score,0);const max=categories.reduce((n,c)=>n+c.max,0);
    const gaps=categories.flatMap(c=>c.items.filter(i=>i.earned<i.points).map(i=>({category:c.label,...i})));
    return{lessonId:model.id,title:model.title,topicId:topic.id,topicCode:topic.code,subject:topic.subject,score,max,percent:max?Math.round(score/max*100):0,ready:max?Math.round(score/max*100)>=READY_SCORE:false,categories,gaps};
  }
  function courseReview(data,rich,catalog){
    const lessons=[];for(const subject of SUBJECT_ORDER){for(const topic of data.topics.filter(t=>t.subject===subject).sort((a,b)=>a.order-b.order)){for(let index=0;index<topic.lessons.length;index++){const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson);lessons.push(review(model,topic,lesson,data.topics));}}}
    const subjects=SUBJECT_ORDER.map(subject=>{const rows=lessons.filter(x=>x.subject===subject),topics=data.topics.filter(t=>t.subject===subject).sort((a,b)=>a.order-b.order).map(topic=>{const r=rows.filter(x=>x.topicId===topic.id);return{id:topic.id,code:topic.code,title:topic.title,total:r.length,ready:r.filter(x=>x.ready).length,average:r.length?Math.round(r.reduce((n,x)=>n+x.percent,0)/r.length):0,min:r.length?Math.min(...r.map(x=>x.percent)):0,queue:r.filter(x=>!x.ready).sort((a,b)=>a.percent-b.percent)};});return{subject,total:rows.length,ready:rows.filter(x=>x.ready).length,average:rows.length?Math.round(rows.reduce((n,x)=>n+x.percent,0)/rows.length):0,min:rows.length?Math.min(...rows.map(x=>x.percent)):0,topics};});
    return{readyScore:READY_SCORE,total:lessons.length,ready:lessons.filter(x=>x.ready).length,average:lessons.length?Math.round(lessons.reduce((n,x)=>n+x.percent,0)/lessons.length):0,lessons,subjects,rebuildOrder:subjects.flatMap(s=>s.topics.map(t=>t.id))};
  }
  window.GCSE_LESSON_QUALITY_REVIEW={review,courseReview,READY_SCORE,SUBJECT_ORDER};
})();
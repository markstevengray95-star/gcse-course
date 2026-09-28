(() => {
  const clean=v=>String(v??'').trim();

  function result(id,label,pass,detail,severity='blocker'){
    return {id,label,pass:Boolean(pass),detail:clean(detail),severity};
  }

  function evaluate(model,topic,allTopics=[]){
    if(!model||!topic)return null;
    const depth=window.GCSE_LESSON_TEACHING_DEPTH;
    const visuals=window.GCSE_LESSON_VISUALS;
    const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,model.title,model)||null;
    const questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[];
    const exam=window.GCSE_LESSON_EXAM_STUDIO?.build?.(model,practical)||null;
    const diff=window.GCSE_LESSON_DIFFERENTIATION?.build?.(model,topic,allTopics)||null;
    const modes=window.GCSE_LESSON_MODE_PLANS?.build?.(model)||null;
    const synoptic=window.GCSE_LESSON_SYNOPTIC?.build?.(model,topic,allTopics)||null;
    const synopticLinks=synoptic?.links||synoptic?.connections||[];
    const lessonVisual=visuals?.get?.(topic,model.title,model,null,model.lessonIndex)||null;
    const commands=new Set(questions.map(q=>q.command));
    const pointVisuals=(model.teachingUnits||[]).map((unit,i)=>visuals?.get?.(topic,model.title,model,unit,model.lessonIndex+i));

    const gates=[];
    gates.push(result('aqa-reference','AQA reference',Boolean(model.ref),model.ref||'Missing AQA reference.'));
    gates.push(result('aqa-points','Mapped AQA points',(model.specificationPoints||[]).length>0,`${model.specificationPoints?.length||0} mapped specification points.`));
    gates.push(result('catalog-validation','Complete lesson model',window.GCSE_LESSON_PRESENTATION_CATALOG?.validate?.(model)?.length===0,'Presentation catalogue and 20-part lesson standard must validate.'));
    gates.push(result('point-depth','Full teaching depth',(model.teachingUnits||[]).length>0&&(model.teachingUnits||[]).every(u=>!depth?.validate?.(u)?.length),'Every mapped point must include definition, explanation, example, visual, application, misconception and question.'));
    gates.push(result('chunk-checks','Teach → check pacing',(model.teachingChunks||[]).length>=2&&model.chunkChecks?.length===model.teachingChunks?.length,`${model.teachingChunks?.length||0} teaching chunks / ${model.chunkChecks?.length||0} immediate checks.`));
    gates.push(result('lesson-visual','Lesson-specific visual',lessonVisual?.lessonSpecific===true&&String(lessonVisual?.svg||'').includes('<svg'),'A lesson-specific SVG scientific visual is required.'));
    gates.push(result('point-visuals','Point-specific visuals',pointVisuals.length>0&&pointVisuals.every(v=>v?.pointSpecific===true&&String(v?.svg||'').includes('<svg')),`${pointVisuals.filter(Boolean).length}/${model.teachingUnits?.length||0} point visuals resolved.`));
    gates.push(result('visual-accessibility','Accessible diagrams',String(lessonVisual?.svg||'').includes('role="img"')&&String(lessonVisual?.svg||'').includes('aria-label='),'Scientific visuals require role="img" and an accessible name.'));
    gates.push(result('distributed-questions','Distributed questioning',window.GCSE_LESSON_QUESTION_LADDER?.validate?.(questions)?.length===0&&questions.length>=9&&commands.size>=8,`${questions.length} question interactions using ${commands.size} command words.`));
    gates.push(result('exam-studio','Lesson Exam Studio',window.GCSE_LESSON_EXAM_STUDIO?.validate?.(exam)?.length===0&&exam?.questions?.some(q=>q.marks===6),`${exam?.questions?.length||0} Exam Studio questions; ${exam?.totalMarks||0} total marks.`));
    gates.push(result('differentiation','Support / Core / Stretch',window.GCSE_LESSON_DIFFERENTIATION?.validate?.(diff)?.length===0,'Differentiation must preserve specification content while changing scaffold/challenge.'));
    gates.push(result('teacher-student','Teacher and Student modes',window.GCSE_LESSON_MODE_PLANS?.validate?.(modes)?.length===0,'Both presentation delivery and independent-study routes are required.'));
    gates.push(result('synoptic','Synoptic connection',window.GCSE_LESSON_SYNOPTIC?.validate?.(synoptic)?.length===0&&synopticLinks.length>=2,`${synopticLinks.length} curated science connections.`));

    if(model.practical){
      gates.push(result('practical-coach','Required practical coaching',Boolean(practical)&&window.GCSE_PRACTICAL_LESSON_ENGINE?.validate?.(practical)?.length===0,'Practical-linked lessons require before/during/after/exam coaching.'));
      gates.push(result('practical-evaluate','Practical evaluation question',commands.has('Evaluate'),'Practical-linked lessons require an Evaluate question.'));
    }
    if(model.equations?.length){
      const allCoach=model.equations.every(eq=>Boolean(window.GCSE_EQUATION_COACH?.build?.(eq,topic.subject)));
      gates.push(result('equation-coach','Equation Coach coverage',allCoach,`${model.equations.length} mapped equation relationship${model.equations.length===1?'':'s'}.`));
      gates.push(result('calculate-question','Calculation check',commands.has('Calculate'),'Equation-linked lessons require a Calculate question.'));
    }
    if(model.scope==='triple')gates.push(result('triple-scope','Separate Science scope',model.scope==='triple','Separate Science-only lesson must remain explicitly scoped.'));

    if(topic.subject==='biology'){
      gates.push(result('biology-reasoning','Biology structure/process reasoning',(model.teachingUnits||[]).every(u=>clean(u.explanation).length>20&&clean(u.application).length>20),'Biology teaching points must connect biological idea/process to consequence or application.'));
    }else if(topic.subject==='chemistry'){
      gates.push(result('chemistry-reasoning','Chemistry particle/evidence reasoning',(model.teachingUnits||[]).every(u=>clean(u.example).length>20&&clean(u.misconception).length>20),'Chemistry teaching points must include concrete examples/evidence and misconception control.'));
    }else if(topic.subject==='physics'){
      gates.push(result('physics-reasoning','Physics relationship reasoning',(model.teachingUnits||[]).every(u=>clean(u.question).length>20&&clean(u.application).length>20),'Physics teaching points must apply relationships to questions or unfamiliar contexts.'));
    }

    const blockers=gates.filter(g=>g.severity==='blocker'&&!g.pass);
    const warnings=gates.filter(g=>g.severity!=='blocker'&&!g.pass);
    return {lessonId:model.id,title:model.title,topicId:topic.id,subject:topic.subject,gates,blockers,warnings,passed:blockers.length===0,passedCount:gates.filter(g=>g.pass).length,total:gates.length};
  }

  function courseGate(data,rich,catalog){
    const rows=[];
    for(const topic of data.topics){
      for(let index=0;index<topic.lessons.length;index++){
        const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson);
        rows.push(evaluate(model,topic,data.topics));
      }
    }
    const subjects=['biology','chemistry','physics'].map(subject=>{const list=rows.filter(r=>r.subject===subject);return{subject,total:list.length,passed:list.filter(r=>r.passed).length,failed:list.filter(r=>!r.passed)};});
    return {total:rows.length,passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed),subjects,rows};
  }

  window.GCSE_LESSON_QUALITY_GATES={evaluate,courseGate};
})();
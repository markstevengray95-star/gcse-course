(() => {
  const metaFor=lesson=>lesson?.biologyMeta||lesson?.chemistryMeta||lesson?.physicsMeta||null;
  const stableId=(topic,title)=>`presentation:${topic.id}:${encodeURIComponent(title||'untitled')}`;

  function coverageFor(topic,title,lesson){
    const complete=window.GCSE_SPECIFICATION_COMPLETENESS?.buildCoverage?.(topic,title,lesson);
    if(complete) return complete;
    const meta=metaFor(lesson);
    if(!meta) return null;
    return {
      ref:meta.ref,section:meta.section,scope:meta.scope,tier:meta.tier,
      points:(meta.focus||[]).map((text,index)=>({index:index+1,text,guidance:'Recall, explain and apply this specification point accurately.'})),
      equations:[...(meta.equations||[])],practical:meta.practical||'',keyIdeas:[],skills:[]
    };
  }

  function build(topic,title,index,lesson){
    if(!topic||!title||!lesson) return null;
    const meta=metaFor(lesson);
    const coverage=coverageFor(topic,title,lesson);
    const seq=lesson.sequence||{};
    const focus=coverage?.points?.map(p=>p.text)||meta?.focus||lesson.objectives||[];
    const core=lesson.depth?.explanation||lesson.section?.[1]||topic.summary||'';
    const terms=(lesson.terms||[]).filter(pair=>Array.isArray(pair)&&pair[0]&&pair[1]);
    const worked=lesson.worked||seq.worked||null;
    const application=lesson.depth?.application||seq.application||`Apply ${String(title).toLowerCase()} to an unfamiliar GCSE context.`;
    const misconception=lesson.depth?.misconception||seq.misconception||'Use precise scientific language and connect each claim directly to the evidence or process.';
    const examTip=lesson.examTip||seq.teach?.[2]?.[1]||`Use the exact scientific terminology from ${title} and answer the command word directly.`;
    const starter=(seq.starter||[]).map(item=>Array.isArray(item)?{question:item[0],answer:item[1]}:{question:String(item),answer:''});
    const independent=[...(seq.independent||[])];
    const plenary=[...(seq.plenary||[])];
    const specPoints=(coverage?.points||[]).map(point=>({
      index:point.index,
      text:point.text,
      guidance:point.guidance||'Recall, explain and apply this specification point accurately.',
      teaching:core
    }));
    const model={
      id:stableId(topic,title),topicId:topic.id,topicCode:topic.code,subject:topic.subject,lessonIndex:index,title,
      ref:coverage?.ref||meta?.ref||'',section:coverage?.section||meta?.section||title,scope:coverage?.scope||meta?.scope||'combined',tier:coverage?.tier||meta?.tier||'all',
      duration:seq.duration||'50–60 min',summary:topic.summary||'',objectives:focus,coreExplanation:core,
      specificationPoints:specPoints,keyTerms:terms,workedExample:worked,starter,
      guidedPractice:seq.guided||application,independentPractice:independent.length?independent:[application],stretch:seq.stretch||`Write a GCSE-style extended response applying ${String(title).toLowerCase()} to an unfamiliar context.`,
      application,misconception,examTip,plenary:plenary.length?plenary:[`Summarise ${title} in one sentence.`,`Use the key terminology accurately from memory.`,`Identify one point you would revisit before an exam.`],
      equations:[...(coverage?.equations||meta?.equations||[])],practical:coverage?.practical||meta?.practical||'',
      keyIdeas:[...(coverage?.keyIdeas||[])],skills:[...(coverage?.skills||[])],visualTopicId:topic.id
    };
    const quality=window.GCSE_LESSON_QUALITY_SCHEMA?.build?.(topic,title,index,lesson,model);
    if(quality){
      model.qualitySchemaVersion=quality.schemaVersion;
      model.lessonStandard=quality.standard;
      model.teachingChunks=quality.teachingChunks;
      model.chunkChecks=quality.chunkChecks;
    }else{
      model.teachingChunks=[];model.chunkChecks=[];
    }
    return model;
  }

  function validate(model){
    const missing=[];
    if(!model) return ['presentation model'];
    if(!model.id)missing.push('unique id');
    if(!model.title)missing.push('lesson title');
    if(!model.ref)missing.push('AQA reference');
    if(!model.section)missing.push('AQA subsection');
    if(!model.objectives?.length)missing.push('objectives/spec points');
    if(!model.coreExplanation)missing.push('core explanation');
    if(!model.specificationPoints?.length)missing.push('specification point teaching');
    if(!model.application)missing.push('application');
    if(!model.misconception)missing.push('misconception');
    if(!model.examTip)missing.push('exam guidance');
    if(!model.independentPractice?.length)missing.push('independent practice');
    if(!model.plenary?.length)missing.push('plenary');
    if(!model.teachingChunks?.length)missing.push('teaching chunks');
    if(model.chunkChecks?.length!==model.teachingChunks?.length)missing.push('chunk checks');
    const schemaMissing=window.GCSE_LESSON_QUALITY_SCHEMA?.validate?.(model)||[];
    return [...new Set([...missing,...schemaMissing])];
  }

  window.GCSE_LESSON_PRESENTATION_CATALOG={build,validate,stableId,metaFor,coverageFor};
})();
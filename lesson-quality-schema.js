(() => {
  const REQUIRED_STAGES=[
    'title','retrieval','vocabulary','objectives','coreConcept','teachingChunks','checks','visual',
    'guidedPractice','workedExample','independentPractice','specificationCheck','examQuestion','modelAnswer',
    'misconception','plenary','confidence','nextLesson','aqaReference','application'
  ];
  const MAX_CHUNK_CHARS=320;

  const text=v=>String(v??'').trim();
  const same=(a,b)=>text(a).toLowerCase()===text(b).toLowerCase();

  function splitIdea(textValue,max=MAX_CHUNK_CHARS){
    const value=text(textValue);if(!value)return [];
    const sentences=value.match(/[^.!?]+[.!?]?/g)?.map(s=>s.trim()).filter(Boolean)||[value];
    const out=[];let current='';
    for(const sentence of sentences){
      if(!current){current=sentence;continue;}
      if(`${current} ${sentence}`.length<=max){current=`${current} ${sentence}`;continue;}
      out.push(current);current=sentence;
    }
    if(current)out.push(current);
    return out.flatMap(part=>{
      if(part.length<=max)return [part];
      const pieces=[];for(let i=0;i<part.length;i+=max)pieces.push(part.slice(i,i+max).trim());return pieces.filter(Boolean);
    });
  }

  function buildTeachingChunks(topic,title,lesson,core){
    const seq=lesson?.sequence||{};
    const candidates=[];
    const add=(heading,body,source='lesson')=>{
      const cleaned=text(body);if(!cleaned)return;
      if(candidates.some(item=>same(item.body,cleaned)))return;
      splitIdea(cleaned).forEach((piece,i)=>candidates.push({
        id:`teach-${candidates.length+1}`,
        heading:i?`${text(heading)||'Core idea'} · continued`:text(heading)||'Core idea',
        body:piece,source
      }));
    };
    add('Core concept',core,'core');
    (seq.teach||[]).forEach(item=>Array.isArray(item)&&add(item[0],item[1],'sequence'));
    if(candidates.length<2){
      add('Apply the concept',lesson?.depth?.application||seq.application||`Apply ${String(title).toLowerCase()} to a new GCSE context.`,'application');
    }
    return candidates.slice(0,8).map((chunk,index)=>({
      ...chunk,index:index+1,
      checkQuestion:`Explain ${chunk.heading.toLowerCase()} in your own words, then connect it to ${title}.`,
      checkAnswer:chunk.body
    }));
  }

  function build(topic,title,index,lesson,base={}){
    const seq=lesson?.sequence||{};
    const core=text(base.coreExplanation||lesson?.depth?.explanation||lesson?.section?.[1]||topic?.summary);
    const chunks=buildTeachingChunks(topic,title,lesson,core);
    const nextTitle=topic?.lessons?.[index+1]?.[0]||'';
    const starter=base.starter?.length?base.starter:(seq.starter||[]).map(item=>Array.isArray(item)?{question:item[0],answer:item[1]}:{question:text(item),answer:''});
    const terms=base.keyTerms||lesson?.terms||[];
    const objectives=base.objectives||lesson?.objectives||[];
    const worked=base.workedExample||lesson?.worked||seq.worked||null;
    const application=text(base.application||lesson?.depth?.application||seq.application||`Apply ${String(title).toLowerCase()} to an unfamiliar GCSE context.`);
    const examQuestion=text(base.stretch||seq.stretch||`Write a GCSE-style response applying ${String(title).toLowerCase()} to an unfamiliar context.`);
    const examTip=text(base.examTip||lesson?.examTip||seq.teach?.[2]?.[1]||'Use precise scientific vocabulary and link each point directly to the question context.');
    return {
      schemaVersion:'2.0',requiredStages:[...REQUIRED_STAGES],
      standard:{
        title:text(title),retrieval:starter,vocabulary:terms,objectives,coreConcept:core,
        teachingChunks:chunks,checks:chunks.map(c=>({question:c.checkQuestion,answer:c.checkAnswer,chunkId:c.id})),
        visual:{topicId:topic?.id,label:`${title} scientific visual`},
        guidedPractice:text(base.guidedPractice||seq.guided||application),workedExample:worked,
        independentPractice:base.independentPractice?.length?base.independentPractice:[...(seq.independent||[])],
        specificationCheck:base.specificationPoints||[],examQuestion,modelAnswer:examTip,
        misconception:text(base.misconception||lesson?.depth?.misconception||seq.misconception||'Use precise scientific language and correct vague or incomplete explanations.'),
        plenary:base.plenary?.length?base.plenary:[...(seq.plenary||[])],
        confidence:['Review','Developing','Secure'],
        nextLesson:nextTitle||'Topic complete — move to exam practice and review.',
        aqaReference:text(base.ref),application
      },
      teachingChunks:chunks,
      chunkChecks:chunks.map(c=>({chunkId:c.id,question:c.checkQuestion,answer:c.checkAnswer}))
    };
  }

  function validate(model){
    const s=model?.lessonStandard||model?.standard;const missing=[];
    if(!s)return ['lesson standard'];
    REQUIRED_STAGES.forEach(key=>{
      const value=s[key];
      const empty=value==null||value===''||(Array.isArray(value)&&!value.length);
      if(empty)missing.push(key);
    });
    if((s.teachingChunks||[]).some(c=>!c.heading||!c.body||c.body.length>MAX_CHUNK_CHARS))missing.push('one-idea teaching chunks');
    if((s.checks||[]).length!==(s.teachingChunks||[]).length)missing.push('check after each teaching chunk');
    return [...new Set(missing)];
  }

  window.GCSE_LESSON_QUALITY_SCHEMA={REQUIRED_STAGES,MAX_CHUNK_CHARS,splitIdea,buildTeachingChunks,build,validate};
})();
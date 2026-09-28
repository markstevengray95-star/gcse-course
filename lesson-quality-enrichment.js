(() => {
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  const compact=v=>clean(v).length>320?`${clean(v).slice(0,317).trim()}…`:clean(v);
  const uniq=list=>{const seen=new Set();return (list||[]).filter(item=>{const key=norm(typeof item==='string'?item:item?.body||item?.text||'');if(!key||seen.has(key))return false;seen.add(key);return true;});};
  const GENERIC_MISCONCEPTIONS=new Set([
    'use precise scientific language and connect each claim directly to the evidence or process.',
    'use precise scientific language and correct vague or incomplete explanations.',
    'do not replace the scientific explanation with vague everyday wording.'
  ]);
  const GENERIC_APPLICATION=/^apply .+ to (an |a )?(unfamiliar |new )?gcse(-style)? context\.?$/i;
  const GENERIC_EXAM=/^use (the )?(exact |precise )?scientific (terminology|vocabulary).+/i;

  function subjectReasoning(subject,unit,model){
    const definition=clean(unit?.definition||unit?.text||model.title);
    const explanation=clean(unit?.explanation||model.coreExplanation);
    const application=clean(unit?.application||model.application);
    if(subject==='biology')return[
      {label:'Structure / process',text:definition},
      {label:'Mechanism',text:explanation},
      {label:'Biological outcome',text:application}
    ];
    if(subject==='chemistry')return[
      {label:'Particles / structure',text:definition},
      {label:'Interaction / evidence',text:explanation},
      {label:'Observable result',text:application}
    ];
    return[
      {label:'Quantity / model',text:definition},
      {label:'Relationship',text:explanation},
      {label:'Observable change',text:application}
    ];
  }

  function representations(subject,unit,model){
    if(subject==='biology')return[
      {label:'Structure–function view',text:clean(unit?.example||unit?.definition||model.coreExplanation)},
      {label:'Cause–effect view',text:clean(unit?.application||model.application)}
    ];
    if(subject==='chemistry')return[
      {label:'Particle-level view',text:clean(unit?.explanation||model.coreExplanation)},
      {label:'Macroscopic evidence',text:clean(unit?.example||unit?.application||model.application)}
    ];
    return[
      {label:'Model / diagram view',text:clean(unit?.definition||unit?.explanation||model.coreExplanation)},
      {label:'Measurement / prediction view',text:clean(unit?.application||unit?.example||model.application)}
    ];
  }

  function languageFocus(model){
    const terms=(model.keyTerms||[]).map(pair=>Array.isArray(pair)?clean(pair[0]):'').filter(Boolean);
    const phrases=(model.teachingUnits||[]).flatMap(u=>[u?.text,u?.definition]).map(clean).filter(Boolean);
    return uniq([...terms,...phrases].map(text=>({text}))).slice(0,8).map(x=>x.text);
  }

  function improveCore(model){
    const core=clean(model.coreExplanation);if(core.length>=180)return core;
    const units=model.teachingUnits||[];
    const additions=uniq(units.flatMap(u=>[u?.example,u?.application]).map(text=>({body:clean(text)}))).map(x=>x.body).filter(x=>x&&!norm(core).includes(norm(x)));
    let out=core;
    for(const extra of additions){if(out.length>=180)break;out=`${out}${out?' ':''}${extra}`.trim();}
    return out||core;
  }

  function ensureTeachingChunks(model){
    const chunks=[];const checks=[];const seen=new Set();const originalChecks=model.chunkChecks||[];
    for(const sourceChunk of model.teachingChunks||[]){
      const body=compact(sourceChunk.body),key=norm(body);if(!body||seen.has(key))continue;seen.add(key);
      const id=sourceChunk.id||`teach-${chunks.length+1}`;const oldCheck=originalChecks.find(c=>c.chunkId===sourceChunk.id);
      const chunk={...sourceChunk,id,index:chunks.length+1,body};chunks.push(chunk);
      checks.push({chunkId:id,question:oldCheck?.question||sourceChunk.checkQuestion||`Explain ${clean(sourceChunk.heading||'this idea').toLowerCase()} for ${model.title}.`,answer:oldCheck?.answer||sourceChunk.checkAnswer||body});
    }
    const candidates=[];
    (model.teachingUnits||[]).forEach((u,i)=>{
      candidates.push({heading:`AQA focus ${i+1} · meaning`,body:u.definition,source:'quality-enrichment'});
      candidates.push({heading:`AQA focus ${i+1} · explanation`,body:u.explanation,source:'quality-enrichment'});
      candidates.push({heading:`AQA focus ${i+1} · example`,body:u.example,source:'quality-enrichment'});
      candidates.push({heading:`AQA focus ${i+1} · application`,body:u.application,source:'quality-enrichment'});
      candidates.push({heading:`AQA focus ${i+1} · misconception repair`,body:u.misconception,source:'quality-enrichment'});
      candidates.push({heading:`AQA focus ${i+1} · exam reasoning`,body:u.question||u.guidance,source:'quality-enrichment'});
    });
    (model.keyTerms||[]).forEach((pair,i)=>{
      if(!Array.isArray(pair)||!clean(pair[0])||!clean(pair[1]))return;
      candidates.push({heading:`Scientific language ${i+1} · ${clean(pair[0])}`,body:`${clean(pair[0])} — ${clean(pair[1])}`,source:'quality-enrichment-language'});
    });
    (model.keyIdeas||[]).forEach((text,i)=>candidates.push({heading:`AQA key idea ${i+1}`,body:clean(text),source:'quality-enrichment-key-idea'}));
    (model.skills||[]).forEach((skill,i)=>{
      const body=typeof skill==='string'?clean(skill):`${clean(skill?.type||'Working Scientifically')} — ${clean(skill?.text||'')}`;
      candidates.push({heading:`Scientific skill ${i+1}`,body,source:'quality-enrichment-skill'});
    });
    (model.equations||[]).forEach((eq,i)=>candidates.push({heading:`Quantitative relationship ${i+1}`,body:`For ${model.title}, use ${clean(eq)} by identifying the relevant quantities, keeping units consistent, rearranging if necessary and checking that the final answer has the correct unit.`,source:'quality-enrichment-equation'}));
    if(clean(model.practical))candidates.push({heading:'Required practical connection',body:`In ${model.title}, connect the scientific idea to the required practical: ${clean(model.practical)}`,source:'quality-enrichment-practical'});
    (model.objectives||[]).forEach((obj,i)=>candidates.push({heading:`AQA objective ${i+1}`,body:`For ${model.title}, the AQA focus is: ${clean(obj)}`,source:'quality-enrichment-objective'}));
    if(clean(model.examTip))candidates.push({heading:'Exam reasoning',body:`For ${model.title}, ${clean(model.examTip)}`,source:'quality-enrichment-exam'});
    for(const candidate of candidates){
      if(chunks.length>=6)break;
      const body=compact(candidate.body),key=norm(body);if(!body||seen.has(key))continue;seen.add(key);
      const id=`enrich-${chunks.length+1}`;
      const chunk={id,index:chunks.length+1,heading:candidate.heading,body,source:candidate.source,checkQuestion:`Explain ${candidate.heading.toLowerCase()} for ${model.title}, then give one piece of scientific evidence or an example.`,checkAnswer:body};
      chunks.push(chunk);checks.push({chunkId:id,question:chunk.checkQuestion,answer:chunk.checkAnswer});
    }
    return {chunks:chunks.slice(0,8).map((c,i)=>({...c,index:i+1})),checks:checks.filter(c=>chunks.some(x=>x.id===c.chunkId)).slice(0,8)};
  }

  function enhance(model,topic){
    if(!model||model.qualityEnrichmentVersion)return model;
    const units=model.teachingUnits||[];const u1=units[0]||{};const u2=units[1]||u1;
    model.coreExplanation=improveCore(model);
    if(GENERIC_APPLICATION.test(clean(model.application)))model.application=clean(u1.application||u2.application||model.application);
    if(GENERIC_MISCONCEPTIONS.has(norm(model.misconception)))model.misconception=clean(u1.misconception||u2.misconception||model.misconception);
    if(GENERIC_EXAM.test(clean(model.examTip)))model.examTip=`For ${model.title}, answer the command word directly, use ${clean(u1.definition||u1.text||'the mapped AQA idea')} precisely, and link each statement to the question context.`;
    const paced=ensureTeachingChunks(model);model.teachingChunks=paced.chunks;model.chunkChecks=paced.checks;
    if(model.lessonStandard){
      model.lessonStandard.coreConcept=model.coreExplanation;
      model.lessonStandard.application=model.application;
      model.lessonStandard.misconception=model.misconception;
      model.lessonStandard.modelAnswer=model.examTip;
      model.lessonStandard.teachingChunks=model.teachingChunks;
      model.lessonStandard.checks=model.chunkChecks.map(c=>({question:c.question,answer:c.answer,chunkId:c.chunkId}));
    }
    const reasoning=subjectReasoning(topic?.subject||model.subject,u1,model);
    const representationsPair=representations(topic?.subject||model.subject,u1,model);
    model.enrichment={
      reasoning,
      representations:representationsPair,
      languageFocus:languageFocus(model),
      evidenceChallenge:`In ${model.title}, make a claim about “${clean(u1.text||model.title)}”. Support it with one observation, example, measurement or relationship from this lesson, then explain why that evidence supports the claim.`,
      misconceptionRepair:{incorrect:clean(u1.misconception||model.misconception),prompt:`Rewrite the misconception using the correct science from ${model.title}.`,model:clean(u1.explanation||model.coreExplanation)},
      transferChallenge:`Use the reasoning from ${model.title} to explain a different context involving ${clean(u2.text||u1.text||model.title)}. State what stays the same and what changes.`
    };
    model.qualityEnrichmentVersion='19.0';
    return model;
  }

  const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(catalog?.build&&!catalog.__qualityEnrichmentWrapped){
    const base=catalog.build.bind(catalog);catalog.build=(...args)=>enhance(base(...args),args[0]);catalog.__qualityEnrichmentWrapped=true;
  }
  const ladder=window.GCSE_LESSON_QUESTION_LADDER;
  if(ladder?.build&&!ladder.__qualityEnrichmentWrapped){
    const base=ladder.build.bind(ladder);ladder.build=(model,practical)=>{
      const list=base(model,practical);if(list.some(q=>q.command==='Justify'))return list;
      const unit=model.teachingUnits?.[1]||model.teachingUnits?.[0]||{};
      const q={phase:'apply',command:'Justify',marks:3,prompt:`Justify this statement using the science from ${model.title}: ${clean(unit.application||model.application)}`,marking:[
        {text:clean(unit.definition||unit.text||model.objectives?.[0]),marks:1},
        {text:clean(unit.explanation||model.coreExplanation),marks:1},
        {text:'Link the evidence or scientific relationship directly to the conclusion.',marks:1}
      ].filter(x=>x.text)};
      const insert=Math.min(5,list.length);list.splice(insert,0,q);return list.map((item,i)=>({...item,id:`q${i+1}`}));
    };ladder.__qualityEnrichmentWrapped=true;
  }
  window.GCSE_LESSON_QUALITY_ENRICHMENT={enhance,subjectReasoning,representations,ensureTeachingChunks};
})();
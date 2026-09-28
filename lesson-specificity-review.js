(() => {
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const words=v=>norm(v).split(' ').filter(x=>x.length>3);
  const unique=list=>new Set((list||[]).map(norm).filter(Boolean)).size;
  const generic=[
    /^apply .+ to (an |a )?(unfamiliar |new )?gcse(-style)? context$/i,
    /^use precise scientific language/i,
    /^use the exact scientific terminology/i,
    /^do not replace the scientific explanation with vague everyday wording$/i
  ];
  function anchors(model){
    const title=words(model.title);const terms=(model.keyTerms||[]).map(x=>Array.isArray(x)?clean(x[0]):'').flatMap(words);
    const pointWords=(model.teachingUnits||[]).slice(0,2).flatMap(u=>words(u.text));
    return [...new Set([...title,...terms,...pointWords])].slice(0,18);
  }
  function evaluate(model,questions=[]){
    if(!model)return null;const checks=[];const add=(id,label,pass,detail)=>checks.push({id,label,pass:Boolean(pass),detail:clean(detail)});
    const e=model.enrichment||{};const lessonAnchors=anchors(model);const corpus=norm([model.coreExplanation,model.application,model.misconception,model.examTip,e.evidenceChallenge,e.transferChallenge].join(' '));
    const hits=lessonAnchors.filter(a=>corpus.includes(a)).length;
    add('enrichment','Evidence-driven enrichment',model.qualityEnrichmentVersion==='19.0','Phase 19 enrichment must be attached to the lesson model.');
    add('reasoning','Distinct reasoning chain',(e.reasoning||[]).length===3&&unique(e.reasoning.map(x=>x.text))===3&&e.reasoning.every(x=>clean(x.text).length>20),'Three subject-specific reasoning stages are required.');
    add('representations','Dual representation',(e.representations||[]).length===2&&unique(e.representations.map(x=>x.text))===2&&e.representations.every(x=>clean(x.text).length>20),'Two genuinely different representations of the lesson idea are required.');
    add('cer','Claim-evidence-reasoning challenge',clean(e.evidenceChallenge).length>90,'CER prompt must be substantial and lesson-specific.');
    add('misconception','Misconception repair',clean(e.misconceptionRepair?.incorrect).length>20&&clean(e.misconceptionRepair?.model).length>20,'Misconception repair requires both the misconception and a scientific correction.');
    add('transfer','Transfer challenge',clean(e.transferChallenge).length>60,'Transfer prompt must require application to a different context.');
    add('anchors','Lesson-specific language',lessonAnchors.length>=2&&hits>=Math.min(3,lessonAnchors.length),`${hits}/${lessonAnchors.length} lesson anchors appear in the enriched teaching corpus.`);
    add('chunks','Unique teaching chunks',(model.teachingChunks||[]).length>=6&&unique((model.teachingChunks||[]).map(x=>x.body))===(model.teachingChunks||[]).length,`${model.teachingChunks?.length||0} chunks; repeated chunk bodies are not allowed.`);
    add('question-depth','Expanded question ladder',questions.length>=10&&questions.some(q=>q.command==='Justify'),`${questions.length} questions; Justify command ${questions.some(q=>q.command==='Justify')?'present':'missing'}.`);
    const genericFields=[model.application,model.misconception,model.examTip].filter(v=>generic.some(rx=>rx.test(clean(v))));
    add('generic-fallback','No generic fallback copy',genericFields.length===0,`${genericFields.length} generic fallback field${genericFields.length===1?'':'s'} remain.`);
    const passed=checks.filter(x=>x.pass).length;return{lessonId:model.id,title:model.title,checks,passed,total:checks.length,percent:Math.round(passed/checks.length*100),warnings:checks.filter(x=>!x.pass)};
  }
  function courseReview(data,rich,catalog){
    const rows=[];const cer=new Map(),transfer=new Map();
    for(const topic of data.topics){for(let index=0;index<topic.lessons.length;index++){
      const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson),practical=model.practical?window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,title,model):null,questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[],row=evaluate(model,questions);row.topicId=topic.id;row.subject=topic.subject;rows.push(row);
      const c=norm(model.enrichment?.evidenceChallenge),t=norm(model.enrichment?.transferChallenge);if(c){if(!cer.has(c))cer.set(c,[]);cer.get(c).push(model.id);}if(t){if(!transfer.has(t))transfer.set(t,[]);transfer.get(t).push(model.id);}
    }}
    const duplicateCer=[...cer.values()].filter(x=>x.length>1),duplicateTransfer=[...transfer.values()].filter(x=>x.length>1);
    return{total:rows.length,passed:rows.filter(x=>x.warnings.length===0).length,average:rows.length?Math.round(rows.reduce((n,x)=>n+x.percent,0)/rows.length):0,rows,duplicateCer,duplicateTransfer,warnings:rows.flatMap(x=>x.warnings.map(w=>({lessonId:x.lessonId,title:x.title,topicId:x.topicId,subject:x.subject,...w})))};
  }
  window.GCSE_LESSON_SPECIFICITY_REVIEW={evaluate,courseReview};
})();
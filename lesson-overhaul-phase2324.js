(() => {
  const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(!catalog?.build||catalog.__phase2324Wrapped)return;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const short=(v,max=170)=>{const text=clean(v);return text.length>max?`${text.slice(0,max-1).trim()}…`:text;};
  const firstTerm=model=>(model.keyTerms||[]).find(pair=>Array.isArray(pair)&&pair[0]&&pair[1])||[model.title,model.coreExplanation];
  const firstPoint=model=>clean(model.specificationPoints?.[0]?.text||model.objectives?.[0]||model.title);
  const lessonIdentity=(topic,model)=>`${topic.code||topic.id} · ${model.ref?`AQA ${model.ref}`:'AQA Science'}`;

  function phase23(model,topic,title,index){
    const [term,definition]=firstTerm(model);
    const point=firstPoint(model);
    const scientific=short(model.coreExplanation||model.application||point,190);
    const misconception=short(model.misconception||`A vague explanation of ${title} that does not link cause and mechanism.`,190);
    const examPrompt=clean(model.lessonStandard?.examQuestion||model.stretch||`Explain ${title} using precise scientific language.`);
    const examGuidance=clean(model.lessonStandard?.modelAnswer||model.examTip||scientific);
    const identity=lessonIdentity(topic,model);
    return {
      version:'23.0',
      title:'Live Team Quiz Mode',
      rules:{teams:4,individualLeaderboard:false,facilitatorControlled:true,defaultSeconds:45},
      rounds:[
        {id:'retrieval',label:'Round 1 · Retrieval relay',type:'open',points:1,prompt:`Without notes, define “${term}” in the context of ${title}.`,reveal:`For ${title}, “${term}” means: ${clean(definition)||scientific}`,discussion:`Award the point only when the definition is scientifically precise enough for ${identity}.`},
        {id:'explain',label:'Round 2 · Explain the science',type:'open',points:2,prompt:`As a team, explain this ${title} idea: ${point}`,reveal:`A strong ${title} explanation should include: ${scientific}`,discussion:`Listen for a linked cause → mechanism → outcome chain in ${title} rather than disconnected facts.`},
        {id:'vote',label:'Round 3 · Scenario vote',type:'vote',points:2,prompt:`Which claim best explains ${title}?`,choices:[{id:'A',text:misconception,correct:false},{id:'B',text:scientific,correct:true},{id:'C',text:`There is not enough information to use the science from ${title}.`,correct:false}],reveal:`For ${title}, B is the strongest scientific claim for ${identity}.`,discussion:`Ask each team to justify its ${title} vote using evidence or a mechanism from the lesson.`},
        {id:'exam',label:'Round 4 · Exam sprint',type:'open',points:3,prompt:`For ${title}, answer this exam sprint: ${examPrompt}`,reveal:`For ${title}, strong marking guidance is: ${examGuidance}`,discussion:`Teams should identify the command word for ${title}, then check scientific precision against ${identity}.`}
      ],
      finishPrompt:`Finish by asking each team to state one idea from ${title} that became clearer during discussion.`,
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  function phase24(model,topic,title,index){
    const identity=lessonIdentity(topic,model);
    const pointA=clean(model.specificationPoints?.[0]?.text||model.objectives?.[0]||title);
    const pointB=clean(model.specificationPoints?.[1]?.text||model.objectives?.[1]||model.application||title);
    const neighbour=model.overhaul22?.interleave?.linkLesson||topic.title||topic.code||'another lesson';
    const precision=(model.overhaul21?.precisionTerms||[]).slice(0,4);
    const specialist=model.practical?`A school repeats the ${title} investigation but obtains a different pattern. Diagnose the most likely scientific or methodological explanation, then propose one improvement and justify it.`:model.equations?.length?`A student uses ${model.equations[0]} in a ${title} problem and obtains an answer that conflicts with the expected scientific trend. Diagnose the error, correct the reasoning and explain how you know the final answer is plausible.`:`A new context produces evidence that appears to conflict with a simple explanation of ${title}. Reconcile the evidence using the mechanism from the lesson and state what additional evidence would strengthen your conclusion.`;
    return {
      version:'24.0',
      title:'Unlockable Expert Challenges',
      unlock:{requiresAllSpecificationPointsSecure:true,optional:true,penaltyForSkipping:false},
      challenges:[
        {id:'synthesis',label:'Expert 1 · Synthesis',difficulty:'Expert',prompt:`Combine these two ${title} ideas into one explanation: “${pointA}” and “${pointB}”. Then connect the explanation to ${neighbour}.`,success:['Both specification ideas are used accurately.','The link between the ideas is causal or mechanistic, not just descriptive.',`The connection to ${neighbour} is scientifically relevant.`]},
        {id:'evidence',label:'Expert 2 · Evidence & uncertainty',difficulty:'Expert',prompt:specialist,success:['The answer uses evidence or scientific reasoning, not assertion.','A limitation, uncertainty or alternative explanation is considered.','The final judgement is justified using lesson science.']},
        {id:'examiner',label:'Expert 3 · Examiner challenge',difficulty:'Expert+',prompt:`Write a high-level response to this challenge about ${title}: explain the science, apply it to an unfamiliar context, and then evaluate one limitation of the explanation. Use ${precision.join(', ')||'precise scientific terminology'}.`,success:['The command words are answered separately and clearly.','Scientific terminology is precise and correctly used.','Cause, mechanism and outcome are linked.','The evaluation identifies a genuine scientific limitation or condition.']}
      ],
      masteryMessage:`Mark every mapped AQA point for ${title} as Secure to unlock the optional expert challenges.`,
      unlockedMessage:`All mapped AQA points for ${title} are secure. Expert challenges are now available.`,
      identity,
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  const baseBuild=catalog.build.bind(catalog);
  catalog.build=function(topic,title,index,lesson){
    const model=baseBuild(topic,title,index,lesson);
    if(!model)return model;
    model.overhaul23=phase23(model,topic,title,index);
    model.overhaul24=phase24(model,topic,title,index);
    model.lessonOverhaulVersion='24.0';
    return model;
  };
  catalog.__phase2324Wrapped=true;
  window.GCSE_LESSON_OVERHAUL_PHASE2324={phase23,phase24};
})();

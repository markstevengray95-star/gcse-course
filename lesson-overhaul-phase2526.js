(() => {
  const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(!catalog?.build||catalog.__phase2526Wrapped)return;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const short=(v,max=190)=>{const t=clean(v);return t.length>max?`${t.slice(0,max-1).trim()}…`:t;};
  const terms=model=>(model.keyTerms||[]).map(x=>Array.isArray(x)?x[0]:x).filter(Boolean);
  const point=(model,i,fallback)=>clean(model.specificationPoints?.[i]?.text||model.objectives?.[i]||fallback);
  const identity=(topic,model)=>`${topic.code||topic.id} · ${model.ref?`AQA ${model.ref}`:'AQA Science'}`;

  function modelType(topic,model,title){
    const text=`${title} ${model.coreExplanation||''} ${model.application||''}`.toLowerCase();
    if(model.practical||/required practical|investigat|experiment|method/.test(text))return 'investigation';
    if(model.equations?.length||/calculate|equation|gradient|graph/.test(text))return 'quantitative';
    if(topic.subject==='biology')return /homeostasis|hormone|nervous|feedback/.test(text)?'control-system':'biological-process';
    if(topic.subject==='chemistry')return /reaction|rate|equilibrium|electrolysis|bond/.test(text)?'particle-reaction':'chemical-model';
    return /force|wave|circuit|energy|radiation|magnet/.test(text)?'physical-system':'physics-model';
  }

  function phase25(model,topic,title,index){
    const type=modelType(topic,model,title),vocab=terms(model).slice(0,4),id=identity(topic,model);
    const p0=point(model,0,title),p1=point(model,1,model.application||title),p2=point(model,2,model.examTip||title);
    const core=short(model.coreExplanation||p0),application=short(model.application||p1),misconception=short(model.misconception||`A common error is to describe ${title} without explaining the scientific mechanism.`);
    const variable=type==='quantitative'?'input quantity':type==='investigation'?'independent variable':topic.subject==='biology'?'biological condition':topic.subject==='chemistry'?'particle or reaction condition':'system condition';
    return {
      version:'25.0',title:'Interactive Diagrams & Models',modelType:type,identity:id,variableLabel:variable,
      stages:[
        {id:'observe',label:'1 · Observe',heading:`Read the ${title} model`,explanation:`Identify what the model represents before changing anything. ${core}`,focus:p0,decision:{prompt:`Which feature should you identify first when reading a ${title} model?`,choices:[{id:'A',text:`The feature linked directly to: ${p0}`,correct:true},{id:'B',text:'A decorative feature that is not part of the scientific relationship',correct:false}],feedback:`Start with the feature linked to the AQA idea: ${p0}`}},
        {id:'mechanism',label:'2 · Mechanism',heading:'Trace what causes the change',explanation:`Follow the scientific mechanism rather than jumping straight to the outcome. ${application}`,focus:p1,decision:{prompt:`What makes an explanation of ${title} scientifically stronger?`,choices:[{id:'A',text:'Naming the outcome only',correct:false},{id:'B',text:'Linking cause → mechanism → outcome',correct:true}],feedback:`For ${id}, the mechanism must connect the starting condition to the observed outcome.`}},
        {id:'change',label:'3 · Change a condition',heading:`Manipulate the ${variable}`,explanation:`Use the control to represent a lower or higher ${variable}. Predict the direction of change before revealing the consequence.`,focus:p2,decision:{prompt:`When the ${variable} changes in a ${title} model, what should you do first?`,choices:[{id:'A',text:'Predict using the scientific relationship, then check the model',correct:true},{id:'B',text:'Assume every output increases',correct:false}],feedback:`A valid prediction must follow the relationship taught in ${title}, not a generic “more gives more” rule.`}},
        {id:'explain',label:'4 · Explain',heading:'Turn the model into an exam explanation',explanation:`Use the model as evidence, then write a complete scientific explanation. Watch for this misconception: ${misconception}`,focus:model.examTip||p0,decision:{prompt:`Which final sentence best completes a response about ${title}?`,choices:[{id:'A',text:'A sentence that explicitly links the model evidence to the question outcome',correct:true},{id:'B',text:'A sentence that simply repeats the question',correct:false}],feedback:`Finish by linking the evidence, mechanism and outcome using precise ${topic.subject} vocabulary.`}}
      ],
      vocabulary:vocab,
      lowState:`Lower ${variable}: use the lesson relationship to predict how ${title} should respond.`,
      highState:`Higher ${variable}: compare the response with the lower state and justify the difference.`,
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  function phase26(model,topic,title,index){
    const id=identity(topic,model),p0=point(model,0,title),p1=point(model,1,model.application||title),core=short(model.coreExplanation||p0),application=short(model.application||p1),misconception=short(model.misconception||`The student uses an imprecise explanation of ${title}.`);
    return {
      version:'26.0',title:'Video Decision Points',identity:id,
      scenarioTitle:`${title} · animated science scenario`,
      transcriptIntro:`A short classroom-style science scenario about ${title}. Pause at each decision point, choose what should happen next, then compare the consequence with the scientific explanation.`,
      pauses:[
        {id:'observe',time:8,label:'Pause 1 · What do you notice?',scene:`A student begins a ${title} task and observes evidence linked to: ${p0}`,prompt:`What should the student do next to interpret the ${title} evidence correctly?`,choices:[{id:'A',text:'Identify the relevant scientific relationship before making a conclusion',correct:true,consequence:`The student connects the observation to ${core}`},{id:'B',text:'Write a conclusion immediately without identifying the relationship',correct:false,consequence:`The conclusion risks being descriptive rather than scientifically explained.`}],feedback:`In ${id}, observations should be interpreted using the relevant scientific relationship.`},
        {id:'reason',time:20,label:'Pause 2 · Choose the reasoning',scene:`The student now needs to explain why the result occurs. A tempting misconception is: ${misconception}`,prompt:`Which reasoning route should the student use for ${title}?`,choices:[{id:'A',text:'State the result and stop',correct:false,consequence:'The response misses the mechanism and is unlikely to reach the strongest explanation marks.'},{id:'B',text:'Link cause → mechanism → outcome using lesson vocabulary',correct:true,consequence:`The response now explains the result using: ${application}`}],feedback:`Strong GCSE science explanations make the mechanism explicit rather than relying on vague wording.`},
        {id:'transfer',time:34,label:'Pause 3 · Transfer the science',scene:`The context changes, but the underlying ${title} science is still relevant.`,prompt:`What is the best next step when applying ${title} to this unfamiliar context?`,choices:[{id:'A',text:'Identify what has changed and apply the same underlying scientific principle',correct:true,consequence:`The student transfers the ${id} science to the new context and checks whether the evidence still supports the prediction.`},{id:'B',text:'Ignore the lesson model because the surface context looks different',correct:false,consequence:'The student misses that GCSE questions often test the same principle in an unfamiliar setting.'}],feedback:`Transfer questions reward recognising the same science in a different context.`}
      ],
      completionPrompt:`Complete all three ${title} decision pauses to mark this animated scenario complete.`,
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  const baseBuild=catalog.build.bind(catalog);
  catalog.build=function(topic,title,index,lesson){
    const model=baseBuild(topic,title,index,lesson);if(!model)return model;
    model.overhaul25=phase25(model,topic,title,index);
    model.overhaul26=phase26(model,topic,title,index);
    model.lessonOverhaulVersion='26.0';
    return model;
  };
  catalog.__phase2526Wrapped=true;
  window.GCSE_LESSON_OVERHAUL_PHASE2526={phase25,phase26,modelType};
})();

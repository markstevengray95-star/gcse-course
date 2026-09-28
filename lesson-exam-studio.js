(() => {
  const clean=v=>String(v??'').trim();
  const point=(text,marks=1)=>({text:clean(text),marks});
  const commandGuide={
    Define:'Give the precise scientific meaning of the term.',
    Describe:'State what happens or what the data show. Do not explain unless asked.',
    Explain:'Make a linked scientific chain: point → because → consequence.',
    Calculate:'Show the equation, rearrangement if needed, substitution, calculation and unit.',
    Analyse:'Use the evidence or data, identify a pattern, then connect it to the science.',
    Evaluate:'Use evidence to make a balanced judgement. Include limitations and improvements where relevant.',
    Compare:'Give a clear similarity and/or difference using the same comparison point.',
    Suggest:'Apply relevant science to an unfamiliar context and justify the suggestion.'
  };

  function modelAnswer(marking){
    const items=(marking||[]).map(m=>m.text).filter(Boolean);
    return items.length?items.join(' '):'Use the lesson science precisely and link each statement to the question context.';
  }

  function build(model,practical=null){
    if(!model)return null;
    const p1=model.teachingUnits?.[0]||model.specificationPoints?.[0]||{};
    const p2=model.teachingUnits?.[1]||model.specificationPoints?.[1]||p1;
    const term=model.keyTerms?.[0]||['key scientific term',p1.definition||model.coreExplanation];
    const shortMarking=[
      point(p1.definition||term[1]||model.coreExplanation),
      point(p1.example||model.application)
    ];
    const applicationMarking=[
      point(p1.definition||model.coreExplanation),
      point(p1.explanation||model.coreExplanation),
      point(p2.application||model.application),
      point('Link the scientific reasoning directly to the unfamiliar context.')
    ];
    const extendedMarking=practical?[
      point(`State the purpose or scientific principle: ${practical.purpose}`),
      point(`Identify the independent and dependent variables: ${practical.variables.independent}; ${practical.variables.dependent}.`),
      point(`Control relevant variables: ${practical.variables.controls.slice(0,2).join('; ')}.`),
      point('Use repeat measurements and identify anomalous results before drawing a conclusion.'),
      point('Discuss uncertainty or limitations in the measurements or method.'),
      point('Suggest a specific improvement and explain how it improves validity, reliability or precision.')
    ]:[
      point(p1.definition||model.coreExplanation),
      point(p1.explanation||model.coreExplanation),
      point(p1.example||model.application),
      point(p2.application||model.application),
      point(`Address the common misconception: ${model.misconception}`),
      point('Reach a justified conclusion using precise scientific terminology.')
    ];
    const questions=[
      {
        id:'exam-short',section:'Short response',command:'Describe',marks:2,revisitType:'specpoint',
        prompt:`Describe what is meant by “${term[0]}” in the context of ${model.title}. Include one scientifically relevant detail or example.`,
        marking:shortMarking,modelAnswer:modelAnswer(shortMarking)
      },
      {
        id:'exam-application',section:'Application',command:'Explain',marks:4,revisitType:'specapply',
        prompt:`A student meets an unfamiliar situation involving ${model.title}. Explain how the science in AQA ${model.ref} can be used to predict or explain what happens.`,
        marking:applicationMarking,modelAnswer:modelAnswer(applicationMarking)
      },
      {
        id:'exam-extended',section:'Extended response',command:practical?'Evaluate':'Explain',marks:6,revisitType:practical?'spec':'exam',
        prompt:practical?`Evaluate how a student could obtain valid and reliable evidence in the ${practical.title} investigation. Your answer should use the scientific ideas from this lesson.`:`Explain, in a logically linked response, how the ideas in ${model.title} can be applied to an unfamiliar GCSE Science context. Include evidence, scientific reasoning and a justified conclusion.`,
        marking:extendedMarking,modelAnswer:modelAnswer(extendedMarking),levelOfResponse:true
      }
    ];
    if(model.equations?.length){
      const eq=model.equations[0];
      const calc=window.GCSE_EQUATION_COACH?.build?.(eq,model.subject)||null;
      const calcMarking=[
        point(`Select ${eq} and rearrange it if required.`),
        point('Convert values into consistent units before substitution.'),
        point('Substitute the values correctly and show the calculation.'),
        point('State the final answer with an appropriate unit.')
      ];
      questions.splice(2,0,{id:'exam-calculate',section:'Calculation',command:'Calculate',marks:4,revisitType:'worked',prompt:calc?.exam||`Use ${eq} to solve an unfamiliar GCSE calculation. Show all working and give the final unit.`,marking:calcMarking,modelAnswer:modelAnswer(calcMarking)});
    }
    return {
      id:`exam:${model.id}`,title:model.title,ref:model.ref,subject:model.subject,
      note:'Original AQA-style practice generated from this lesson. Marking guidance is indicative, not an official AQA mark scheme.',
      questions,totalMarks:questions.reduce((n,q)=>n+q.marks,0),commandGuide
    };
  }

  function validate(pack){
    const missing=[];
    if(!pack) return ['exam-pack'];
    if((pack.questions||[]).length<3)missing.push('question-count');
    if(pack.totalMarks<12)missing.push('total-marks');
    if(!pack.questions?.some(q=>q.marks===6))missing.push('extended-response');
    if(!pack.questions?.some(q=>q.marks<=2))missing.push('short-response');
    if(!pack.questions?.some(q=>q.marks===4))missing.push('application-or-calculation');
    (pack.questions||[]).forEach((q,i)=>{
      if(!clean(q.prompt))missing.push(`prompt-${i}`);
      if(!commandGuide[q.command])missing.push(`command-guide-${i}`);
      if((q.marking||[]).length<Math.min(q.marks,4))missing.push(`marking-${i}`);
      if(!clean(q.modelAnswer))missing.push(`model-answer-${i}`);
      if(!q.revisitType)missing.push(`revisit-${i}`);
    });
    return [...new Set(missing)];
  }

  window.GCSE_LESSON_EXAM_STUDIO={build,validate,commandGuide};
})();
(() => {
  const clean=v=>String(v??'').trim();
  const phaseFor=type=>{
    if(['title','retrieval','objectives'].includes(type))return 'prepare';
    if(['teach','teachchunk','specpoint','terms','worked'].includes(type))return 'teach';
    if(['chunkcheck','specapply','practice'].includes(type))return 'check';
    if(['spec','exam'].includes(type))return 'assess';
    return 'review';
  };
  const timing={prepare:2,teach:4,check:3,assess:5,review:3};
  const teacherPrompt={
    prepare:'Set the purpose, activate prior knowledge and make success criteria explicit.',
    teach:'Model the scientific reasoning aloud. Cold-call for precise vocabulary and ask students to justify each link.',
    check:'Give silent thinking time first, then sample answers before revealing guidance.',
    assess:'Keep mark points hidden until students commit to an answer. Focus feedback on the command word and scientific precision.',
    review:'Return to the lesson objectives, identify any weak AQA point and set the next review action.'
  };
  const studentAction={
    prepare:'Answer from memory and identify what you already know.',
    teach:'Read one idea at a time, use the visual and explain the science back in your own words.',
    check:'Attempt the question before revealing any guidance. If unsure, use one hint then try again.',
    assess:'Write a complete answer independently, then self-mark against the indicative points.',
    review:'Rate your confidence, save anything you need to revisit and choose the next lesson action.'
  };
  function build(model){
    if(!model)return null;
    const terms=(model.keyTerms||[]).slice(0,4).map(x=>x?.[0]).filter(Boolean);
    return {
      lessonId:model.id,title:model.title,ref:model.ref,duration:model.duration||'50–60 min',
      teacher:{
        prompts:teacherPrompt,
        questioning:[
          `What does the key idea in ${model.title} mean in precise scientific language?`,
          `What evidence, observation or relationship supports this explanation?`,
          `Which common misconception could lead to a lost mark here?`,
          `How could this idea appear in an unfamiliar AQA context?`,
          model.equations?.length?`Which equation or quantitative relationship applies, and why?`:`Which key term must appear in a high-quality answer?`
        ],
        vocabulary:terms,
        watchFor:model.misconception,
        examCue:model.examTip,
        practical:model.practical||''
      },
      student:{
        actions:studentAction,
        hints:[
          `Start with the command word and identify the exact scientific idea being tested.`,
          terms.length?`Try using these terms: ${terms.join(', ')}.`:`Use the exact vocabulary from the lesson rather than everyday wording.`,
          model.equations?.length?`For calculations: write the equation first, convert units, substitute, calculate and include the unit.`:`Link each scientific statement with because, therefore or so when an explanation is required.`,
          `If you are still unsure, revisit the previous teaching or diagram slide before revealing the model guidance.`
        ],
        nextActions:['Complete the current slide task.','Self-mark any question you attempted.','Rate each AQA point in the mastery panel.','Save weak areas to the notebook.','Continue to the next unfinished lesson.']
      },
      phaseFor,timing
    };
  }
  function validate(plan){
    const missing=[];
    if(!plan)return['mode-plan'];
    if(Object.keys(plan.teacher?.prompts||{}).length<5)missing.push('teacher-prompts');
    if((plan.teacher?.questioning||[]).length<5)missing.push('teacher-questioning');
    if(Object.keys(plan.student?.actions||{}).length<5)missing.push('student-actions');
    if((plan.student?.hints||[]).length<4)missing.push('student-hints');
    if((plan.student?.nextActions||[]).length<5)missing.push('student-next-actions');
    if(!clean(plan.teacher?.watchFor))missing.push('teacher-misconception');
    if(!clean(plan.teacher?.examCue))missing.push('teacher-exam-cue');
    return missing;
  }
  window.GCSE_LESSON_MODE_PLANS={build,validate,phaseFor,timing,teacherPrompt,studentAction};
})();
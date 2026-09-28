(() => {
  const clean=v=>String(v??'').trim();
  const mark=(text,marks)=>({text:clean(text),marks});
  function build(model,practical=null){
    const term=model.keyTerms?.[0]||['key term',model.coreExplanation];
    const term2=model.keyTerms?.[1]||[model.title,model.summary];
    const p1=model.teachingUnits?.[0]||model.specificationPoints?.[0]||{};
    const p2=model.teachingUnits?.[1]||model.specificationPoints?.[1]||p1;
    const questions=[
      {phase:'teach',command:'Define',marks:1,prompt:`Define the scientific term “${term[0]}” using precise GCSE Science language.`,marking:[mark(term[1],1)]},
      {phase:'teach',command:'Describe',marks:2,prompt:`Describe the key scientific idea in this lesson: ${p1.text||model.title}.`,marking:[mark(p1.definition||model.coreExplanation,1),mark(p1.example||model.application,1)]},
      {phase:'apply',command:'Explain',marks:3,prompt:p1.question||`Explain ${p1.text||model.title} using precise scientific language.`,marking:[mark(p1.explanation||model.coreExplanation,2),mark(p1.application||model.application,1)]},
      {phase:'apply',command:'Predict',marks:2,prompt:`Predict what would happen in this new context, then justify it: ${p2.application||model.application}`,marking:[mark('State a scientifically plausible outcome.',1),mark(p2.explanation||model.coreExplanation,1)]},
      {phase:'practice',command:'Compare',marks:2,prompt:`Compare “${term[0]}” with “${term2[0]}”. Give a scientifically meaningful similarity or difference.`,marking:[mark(term[1],1),mark(term2[1],1)]},
      {phase:'practice',command:'Suggest',marks:2,prompt:`Suggest one way this idea could be applied or tested in an unfamiliar GCSE Science context.`,marking:[mark(model.application,1),mark('Link the suggestion directly to the scientific principle.',1)]},
      {phase:'exam',command:'Analyse',marks:3,prompt:`Analyse how the evidence or observation in this lesson supports the scientific explanation.`,marking:[mark(p1.example||model.summary,1),mark(p1.explanation||model.coreExplanation,1),mark('Use evidence → scientific idea → conclusion.',1)]}
    ];
    if(model.equations?.length){
      const eq=model.equations[0];const calc=window.GCSE_EQUATION_COACH?.build?.(eq,model.subject)||null;
      questions.splice(6,0,{phase:'practice',command:'Calculate',marks:3,prompt:calc?.scaffold||`Use ${eq} in a calculation. Show the rearrangement, substitution and unit.`,marking:[mark(`Select and, if needed, rearrange ${eq}.`,1),mark('Substitute values with consistent units.',1),mark('Calculate and state the final unit.',1)]});
    }
    if(practical){
      questions.splice(6,0,{phase:'practice',command:'Evaluate',marks:4,prompt:practical.exam.question,marking:practical.exam.marking.map(x=>mark(x,1))});
    }else{
      questions.splice(6,0,{phase:'practice',command:'Evaluate',marks:3,prompt:`Evaluate the strength of the explanation or model used in this lesson. What evidence would make the conclusion more secure?`,marking:[mark(model.misconception,1),mark('Identify evidence or measurement that would test the idea.',1),mark('Explain how that evidence would strengthen or challenge the conclusion.',1)]});
    }
    questions.push({phase:'review',command:'Explain',marks:3,prompt:`Without notes, explain the most important AQA point from this lesson and apply it to a new example.`,marking:[mark(model.objectives?.[0]||model.coreExplanation,1),mark(model.coreExplanation,1),mark(model.application,1)]});
    return questions.map((q,i)=>({...q,id:`q${i+1}`,marking:q.marking.filter(x=>x.text)}));
  }
  function validate(list){
    const missing=[];if(!Array.isArray(list)||list.length<7)missing.push('question-count');
    const commands=new Set((list||[]).map(q=>q.command));if(commands.size<6)missing.push('command-variety');
    (list||[]).forEach((q,i)=>{if(!clean(q.prompt))missing.push(`prompt-${i}`);if(!(q.marks>0))missing.push(`marks-${i}`);if((q.marking||[]).length<1)missing.push(`marking-${i}`);});
    return missing;
  }
  window.GCSE_LESSON_QUESTION_LADDER={build,validate};
})();
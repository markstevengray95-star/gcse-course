(() => {
  const clean=v=>String(v??'').trim();
  function adjacentTopics(topic,allTopics=[]){
    const same=(allTopics||[]).filter(t=>t.subject===topic.subject);const i=same.findIndex(t=>t.id===topic.id);return [same[i-1],same[i+1]].filter(Boolean);
  }
  function build(model,topic,allTopics=[]){
    if(!model||!topic)return null;
    const terms=(model.keyTerms||[]).slice(0,4).map(([term,definition])=>({term,definition}));
    const neighbours=adjacentTopics(topic,allTopics);
    const support={
      label:'Support',purpose:'Add scaffolds without removing any AQA content.',
      sentenceStarters:[
        `The key scientific idea is…`,
        `${terms[0]?.term||'The key term'} means…`,
        `This happens because…`,
        `The evidence shows… therefore…`
      ],
      steps:['Identify the command word.','Underline the key scientific idea or data.','Answer one idea at a time.','Use a precise scientific term in every sentence.','Check that the final sentence answers the question directly.'],
      vocabulary:terms,
      calculation:model.equations?.length?[`Write ${model.equations[0]} first.`,`Rearrange before substituting numbers.`,`Convert units before calculating.`,`Include the final unit.`]:[],
      prompt:`Use the lesson diagram and vocabulary before attempting the question independently.`
    };
    const core={
      label:'Core',purpose:'Use the standard lesson sequence and expected GCSE independence.',
      prompt:`Answer using precise terminology from AQA ${model.ref}, justify your reasoning and check your response against the command word.`,
      checklist:['Use accurate science.','Apply it to the context.','Show working where relevant.','Answer the command word directly.']
    };
    const synoptic=neighbours.map(t=>`${t.code} ${t.title}`);
    const stretch={
      label:'Stretch',purpose:'Increase depth, transfer and synoptic reasoning without adding unsupported specification content.',
      challenge:model.stretch||`Apply ${model.title} to an unfamiliar context and justify each step of your reasoning.`,
      unfamiliar:`Imagine the same scientific principle is observed in a different system or data set. Predict the outcome, explain the mechanism and identify what evidence would test your prediction.`,
      synoptic,
      synopticQuestion:synoptic.length?`Explain one scientifically valid connection between ${model.title} and ${synoptic[0]}. State what knowledge transfers and where the contexts differ.`:`Connect two ideas from this lesson and explain how they combine to solve an unfamiliar problem.`,
      evaluation:`Identify one limitation or assumption in the model/explanation used in this lesson, then suggest evidence that would strengthen the conclusion.`,
      tierNote:model.tier==='higher'?'This lesson contains Higher Tier content: stretch questions can use the full mapped Higher Tier detail.':model.scope==='triple'?'This is Separate Science content: stretch stays within the mapped Separate Science specification.':'Stretch remains within the mapped lesson specification and increases reasoning demand rather than adding new content.'
    };
    return{lessonId:model.id,title:model.title,ref:model.ref,support,core,stretch};
  }
  function validate(plan){
    const missing=[];if(!plan)return['differentiation-plan'];
    if((plan.support?.sentenceStarters||[]).length<3)missing.push('support-sentence-starters');
    if((plan.support?.steps||[]).length<4)missing.push('support-steps');
    if(!clean(plan.core?.prompt))missing.push('core-prompt');
    if((plan.core?.checklist||[]).length<3)missing.push('core-checklist');
    if(!clean(plan.stretch?.challenge))missing.push('stretch-challenge');
    if(!clean(plan.stretch?.unfamiliar))missing.push('stretch-unfamiliar');
    if(!clean(plan.stretch?.synopticQuestion))missing.push('stretch-synoptic');
    if(!clean(plan.stretch?.evaluation))missing.push('stretch-evaluation');
    return missing;
  }
  window.GCSE_LESSON_DIFFERENTIATION={build,validate};
})();
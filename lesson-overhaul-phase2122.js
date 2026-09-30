(() => {
  const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(!catalog?.build||catalog.__phase2122Wrapped)return;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const firstSentence=v=>{
    const text=clean(v);
    if(!text)return '';
    const hit=text.match(/^.*?[.!?](?:\s|$)/);
    return clean(hit?.[0]||text);
  };
  const unique=items=>[...new Set(items.map(clean).filter(Boolean))];
  const short=v=>{
    const text=clean(v);
    return text.length>180?`${text.slice(0,177).trim()}…`:text;
  };
  const titleCase=v=>clean(v).replace(/\b\w/g,c=>c.toUpperCase());

  function precisionTerms(model,topic){
    const terms=(model.keyTerms||[]).map(pair=>Array.isArray(pair)?pair[0]:pair).filter(Boolean);
    const objectiveTerms=(model.objectives||[]).flatMap(item=>clean(item).split(/[,;:()]/)).filter(x=>x.length>4);
    const fallback=[model.title,`${titleCase(topic.subject)} terminology`,model.ref?`AQA ${model.ref}`:'AQA science'];
    return unique([...terms,...objectiveTerms,...fallback]).slice(0,6);
  }

  function phase21(model,topic,title,index){
    const terms=precisionTerms(model,topic);
    const objective=clean(model.objectives?.[0]||`Explain ${title} accurately.`);
    const cause=firstSentence(model.coreExplanation)||objective;
    const mechanism=firstSentence(model.application)||`Apply ${title} to an unfamiliar scientific context.`;
    const consequence=firstSentence(model.examTip)||`Link the mechanism back to the command word and evidence.`;
    const required=terms.slice(0,3);
    return {
      version:'21.0',
      title:'Scientific explanation mastery',
      explanationFrame:{
        prompt:`Explain ${title} as a connected scientific chain rather than a list of facts.`,
        steps:[
          {label:'1 · State the scientific idea',text:objective},
          {label:'2 · Give the cause',text:`Use the lesson evidence to establish the cause: ${short(cause)}`},
          {label:'3 · Explain the mechanism',text:`Show how or why the change happens: ${short(mechanism)}`},
          {label:'4 · Link to the outcome',text:`Finish by connecting the mechanism to the outcome or marks: ${short(consequence)}`}
        ]
      },
      precisionTerms:terms,
      extendedResponsePrompt:`Write a precise GCSE explanation of ${title}. Use ${required.join(', ')} and include at least two clear cause → mechanism → outcome links.`,
      selfCheck:[
        `I answered the command word for ${title}.`,
        'I used scientific vocabulary rather than vague everyday wording.',
        'I linked each cause to a mechanism before stating the outcome.',
        'I checked that every sentence adds a new piece of scientific reasoning.'
      ],
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  function phase22(model,topic,title,index){
    const lessons=Array.isArray(topic.lessons)?topic.lessons:[];
    const previous=index>0?lessons[index-1]?.[0]:null;
    const next=index<lessons.length-1?lessons[index+1]?.[0]:null;
    const neighbour=previous||next||topic.title||topic.code||'this topic';
    const ref=model.ref?`AQA ${model.ref}`:'the AQA specification';
    const visualPrompt=`Before revealing a model for ${title}, predict the labels, trend, sequence or relationship that must be visible for the diagram to be scientifically correct.`;
    const questions=[
      {command:'Define',prompt:`Define one essential term from ${title} precisely.`,guidance:'Give the scientific meaning, not an example.'},
      {command:'Describe',prompt:`Describe the key pattern, structure or sequence in ${title}.`,guidance:'State what happens or what is shown before explaining why.'},
      {command:'Explain',prompt:`Explain why the key process or relationship in ${title} occurs.`,guidance:'Use linked cause → mechanism → outcome reasoning.'},
      {command:'Apply',prompt:`Apply ${title} to a new GCSE context that is different from the worked example.`,guidance:'Identify the same underlying science before using the new context.'},
      {command:'Analyse',prompt:`Analyse what evidence would support or challenge a claim about ${title}.`,guidance:'Refer to a pattern, comparison, measurement or mechanism.'},
      {command:'Evaluate',prompt:`Evaluate the strongest evidence or limitation in a conclusion about ${title}.`,guidance:'Make a judgement and justify it scientifically.'}
    ];
    return {
      version:'22.0',
      title:'Visual reasoning and question variety',
      visualReasoning:[
        {label:'Predict',prompt:visualPrompt},
        {label:'Read',prompt:`Identify the scientific evidence a correct ${title} visual must communicate, not just its labels.`},
        {label:'Explain',prompt:`Use the visual evidence to explain ${title} in a complete scientific sentence.`},
        {label:'Transfer',prompt:`Change one condition or variable and predict how the ${title} visual or outcome should change.`}
      ],
      questionSet:questions,
      interleave:{
        linkLesson:neighbour,
        prompt:`Connect ${title} to ${neighbour}: state one idea that transfers between them and one important difference.`,
        examLink:`Use the connection to build a two-topic response that still stays focused on ${ref}.`
      },
      interactionModes:['Predict → reveal → explain','Compare two representations','Spot the scientific error','Transfer to an unfamiliar context'],
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  const baseBuild=catalog.build.bind(catalog);
  catalog.build=function(topic,title,index,lesson){
    const model=baseBuild(topic,title,index,lesson);
    if(!model)return model;
    model.overhaul21=phase21(model,topic,title,index);
    model.overhaul22=phase22(model,topic,title,index);
    model.lessonOverhaulVersion='22.0';
    return model;
  };
  catalog.__phase2122Wrapped=true;
  window.GCSE_LESSON_OVERHAUL_PHASE2122={phase21,phase22,precisionTerms};
})();

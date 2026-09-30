(() => {
  const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(!catalog?.build||catalog.__phase2731Wrapped)return;
  const data=window.GCSE_COURSE_DATA;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const short=(v,max=190)=>{const t=clean(v);return t.length>max?`${t.slice(0,max-1).trim()}…`:t;};
  const point=(model,i,fallback)=>clean(model.specificationPoints?.[i]?.text||model.objectives?.[i]||fallback);
  const identity=(topic,model)=>`${topic.code||topic.id} · ${model.ref?`AQA ${model.ref}`:'AQA Science'}`;

  function phase27(model,topic,title,index){
    const p0=point(model,0,title),p1=point(model,1,model.application||title);
    const core=short(model.coreExplanation||p0,210),application=short(model.application||p1,210),misconception=short(model.misconception||`A student describes ${title} without explaining the scientific mechanism.`,210);
    const term=(model.keyTerms||[]).find(x=>Array.isArray(x)&&x[0]&&x[1])||[title,core];
    return {
      version:'27.0',title:'Audio Science Scenarios',identity:identity(topic,model),
      clips:[
        {id:'diagnose',label:'Audio 1 · Diagnose the misconception',duration:'35–45 sec',narration:`You are revising ${title}. A classmate says: ${misconception} Decide whether that explanation is strong enough, and identify the scientific idea that needs correcting.`,prompt:`What is the best response to the ${title} misconception?`,choices:[{id:'A',text:`Replace the vague claim with the AQA idea: ${p0}`,correct:true},{id:'B',text:'Keep the claim because scientific explanations do not need a mechanism',correct:false}],feedback:`For ${title}, use the specification idea and explain why it causes the observed outcome.`,transcript:`Scenario: revising ${title}. Misconception: ${misconception} The task is to identify what is scientifically wrong or incomplete and replace it with the relevant AQA idea.`},
        {id:'explain',label:'Audio 2 · Build the explanation',duration:'40–50 sec',narration:`Now explain ${title} aloud as if another student has never studied it. Begin with ${term[0]}: ${term[1]} Then connect that definition to the mechanism: ${core}`,prompt:`Which structure gives the strongest spoken explanation of ${title}?`,choices:[{id:'A',text:'Definition → cause → mechanism → outcome',correct:true},{id:'B',text:'Outcome → repeat the question → stop',correct:false}],feedback:`A strong spoken answer to ${title} should make the scientific chain explicit and use precise terminology.`,transcript:`Start with the key term ${term[0]} and its meaning: ${term[1]} Then use the lesson mechanism to connect cause to outcome: ${core}`},
        {id:'transfer',label:'Audio 3 · Exam transfer',duration:'40–50 sec',narration:`An exam question changes the surface context but still tests ${title}. The relevant application is: ${application} Pause and decide how you would recognise the underlying science before answering.`,prompt:`What should you do first when ${title} appears in an unfamiliar exam context?`,choices:[{id:'A',text:'Identify the same underlying relationship or process, then apply it to the new details',correct:true},{id:'B',text:'Ignore the lesson because the new context looks different',correct:false}],feedback:`Transfer questions reward recognising the same ${topic.subject} principle in a different setting.`,transcript:`The context is unfamiliar, but the science remains ${title}. Application guidance: ${application} Identify the underlying relationship, then use the new evidence or values.`}
      ],
      lessonKey:`${topic.id}:${index}:${encodeURIComponent(title)}`
    };
  }

  const routes=[
    {id:'fresh',label:'Fresh Start',description:'Build secure foundations in sequence, starting with incomplete early topics.'},
    {id:'exam',label:'Exam Focus',description:'Prioritise incomplete Paper 1 and Paper 2 topics, then practise exam transfer.'},
    {id:'practical',label:'Practical & Maths',description:'Prioritise topics with required practicals, equations and quantitative reasoning.'},
    {id:'repair',label:'Targeted Repair',description:'Return first to incomplete topics and lessons before adding new content.'}
  ];
  function recommendTopics(routeId='fresh',subject='all',progress={}){
    const list=(data?.topics||[]).filter(t=>subject==='all'||t.subject===subject);
    const score=t=>{
      let n=progress?.[t.id]?30:0;
      if(routeId==='exam')n+=t.paper===2?2:0;
      if(routeId==='practical')n-=Math.min(8,(t.practicals||[]).length*3);
      if(routeId==='repair')n+=progress?.[t.id]?20:-8;
      n+=Number(t.order||0)/100;
      return n;
    };
    return [...list].sort((a,b)=>score(a)-score(b)).slice(0,4);
  }

  const toolkitCategories=[
    {id:'definitions',label:'Definitions',description:'Precise scientific vocabulary and definitions.'},
    {id:'equations',label:'Equations & maths',description:'Equations, units and calculation reminders.'},
    {id:'practicals',label:'Practical methods',description:'Methods, variables, safety and evaluation prompts.'},
    {id:'exam',label:'Exam technique',description:'Command words, explanation frames and common traps.'}
  ];

  const phase30={version:'30.0',title:'Final Science Implementation Challenge',checkpoints:[7,30,90],fields:['topicId','focus','action','evidence'],prompt:'Choose one science weakness, plan a concrete revision or practice action, and review the evidence after 7, 30 and 90 days.'};

  function buildCertificationBank(topics=data?.topics||[]){
    const bySubject={biology:[],chemistry:[],physics:[]};
    topics.forEach(topic=>(topic.quiz||[]).forEach((pair,i)=>bySubject[topic.subject]?.push({id:`${topic.id}:${i}`,topicId:topic.id,topicCode:topic.code,topicTitle:topic.title,subject:topic.subject,prompt:pair[0],answer:pair[1]})));
    const selected=[];['biology','chemistry','physics'].forEach(subject=>selected.push(...bySubject[subject].slice(0,10)));
    const all=[...bySubject.biology,...bySubject.chemistry,...bySubject.physics];
    return selected.slice(0,30).map((q,index)=>{
      const distractors=[];
      for(let step=1;distractors.length<3&&step<all.length;step++){
        const candidate=all[(all.findIndex(x=>x.id===q.id)+step*7)%all.length]?.answer;
        if(candidate&&candidate!==q.answer&&!distractors.includes(candidate))distractors.push(candidate);
      }
      const choices=[q.answer,...distractors].slice(0,4).map((text,i)=>({id:String.fromCharCode(65+i),text,correct:i===0}));
      const rotate=index%choices.length;
      const rotated=[...choices.slice(rotate),...choices.slice(0,rotate)];
      return {...q,choices:rotated.map((c,i)=>({...c,id:String.fromCharCode(65+i)}))};
    });
  }
  function sampleCertification(bank,count=15,seed=Date.now()){
    const list=[...(bank||[])];let s=Math.abs(Number(seed)||1)%2147483647||1;
    const rand=()=>{s=s*16807%2147483647;return(s-1)/2147483646;};
    for(let i=list.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
    return list.slice(0,Math.min(count,list.length));
  }
  const phase31={version:'31.0',title:'GCSE Science Course Certification Exam',bankSize:30,questionCount:15,passMark:0.8,unlimitedResits:true,officialQualification:false,certificateTitle:'GCSE Science Course Completion Certificate'};

  const baseBuild=catalog.build.bind(catalog);
  catalog.build=function(topic,title,index,lesson){
    const model=baseBuild(topic,title,index,lesson);if(!model)return model;
    model.overhaul27=phase27(model,topic,title,index);
    model.lessonOverhaulVersion='31.0';
    return model;
  };
  catalog.__phase2731Wrapped=true;
  window.GCSE_LESSON_OVERHAUL_PHASE2731={phase27};
  window.GCSE_COURSE_COMPLETION_PHASES={
    phase28:{version:'28.0',title:'Personalised Course Entry Routes',routes,recommendTopics},
    phase29:{version:'29.0',title:'Personal Science Toolkit',categories:toolkitCategories},
    phase30,
    phase31:{...phase31,buildCertificationBank,sampleCertification}
  };
})();

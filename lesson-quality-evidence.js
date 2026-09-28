(() => {
  const clamp=(n,max)=>Math.max(0,Math.min(max,n));
  const clean=v=>String(v??'').trim();
  const ratio=(value,target,max)=>clamp(target?value/target*max:0,max);
  const band=score=>score>=95?'Exemplary':score>=90?'Strong':score>=80?'Secure':score>=70?'Developing':'Priority review';
  const priorityFor=percent=>percent<70?'high':percent<85?'medium':percent<100?'low':'none';
  const add=(cat,id,label,max,score,evidence,improve)=>{const earned=clamp(score,max);cat.items.push({id,label,max,earned,evidence:clean(evidence),improve:clean(improve)});cat.score+=earned;cat.max+=max;};

  function score(model,topic,allTopics=[]){
    if(!model||!topic)return null;
    const depth=window.GCSE_LESSON_TEACHING_DEPTH;
    const visuals=window.GCSE_LESSON_VISUALS;
    const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,model.title,model)||null;
    const questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[];
    const exam=window.GCSE_LESSON_EXAM_STUDIO?.build?.(model,practical)||null;
    const diff=window.GCSE_LESSON_DIFFERENTIATION?.build?.(model,topic,allTopics)||null;
    const modes=window.GCSE_LESSON_MODE_PLANS?.build?.(model)||null;
    const synoptic=window.GCSE_LESSON_SYNOPTIC?.build?.(model,topic,allTopics)||null;
    const lessonVisual=visuals?.get?.(topic,model.title,model,null,model.lessonIndex)||null;
    const gate=window.GCSE_LESSON_QUALITY_GATES?.evaluate?.(model,topic,allTopics)||null;
    const cats={
      specification:{label:'Specification coverage',score:0,max:0,items:[]},
      teaching:{label:'Teaching depth',score:0,max:0,items:[]},
      visuals:{label:'Visual evidence',score:0,max:0,items:[]},
      interactivity:{label:'Interactivity',score:0,max:0,items:[]},
      questions:{label:'Questioning',score:0,max:0,items:[]},
      exam:{label:'Exam preparation',score:0,max:0,items:[]},
      specialist:{label:'Practical / calculation',score:0,max:0,items:[]},
      accessibility:{label:'Accessibility',score:0,max:0,items:[]}
    };

    const points=model.specificationPoints||[],units=model.teachingUnits||[];
    add(cats.specification,'ref','AQA reference',4,model.ref?4:0,model.ref||'No reference','Add the exact AQA reference.');
    add(cats.specification,'points','Mapped specification points',5,points.length?Math.min(5,2+points.length):0,`${points.length} explicit points`,`Ensure each assessable point is mapped.`);
    add(cats.specification,'retention','Point retention',5,points.length&&points.length===model.objectives?.length?5:0,`${points.length}/${model.objectives?.length||0} retained`,'Keep every mapped point in the presentation model.');
    const depthValid=units.filter(u=>!depth?.validate?.(u)?.length).length;
    add(cats.specification,'depth-validation','Specification teaching units',6,units.length?ratio(depthValid,units.length,6):0,`${depthValid}/${units.length} full teaching units`,'Complete the seven-part teaching sequence for every point.');

    const coreLen=clean(model.coreExplanation).length;
    add(cats.teaching,'core','Core explanation',5,coreLen>=180?5:coreLen>=100?4:coreLen>=60?3:coreLen>=30?2:0,`${coreLen} characters of core explanation`,'Deepen the core explanation with causal scientific reasoning.');
    const chunks=model.teachingChunks||[];
    add(cats.teaching,'chunks','Teaching chunks',4,chunks.length>=6?4:chunks.length>=4?3.5:chunks.length>=2?3:0,`${chunks.length} one-idea chunks`,'Break dense explanations into more teachable idea-sized chunks.');
    add(cats.teaching,'checks','Immediate checks',4,chunks.length&&model.chunkChecks?.length===chunks.length?4:ratio(model.chunkChecks?.length||0,chunks.length||1,4),`${model.chunkChecks?.length||0}/${chunks.length} chunks checked`,'Add an immediate understanding check after every teaching chunk.');
    const unitExplanationAvg=units.length?units.reduce((n,u)=>n+clean(u.explanation).length,0)/units.length:0;
    add(cats.teaching,'point-depth','Point explanation depth',4,unitExplanationAvg>=120?4:unitExplanationAvg>=80?3.5:unitExplanationAvg>=45?3:unitExplanationAvg>=25?2:0,`Average point explanation ${Math.round(unitExplanationAvg)} characters`,'Strengthen explanation and causal reasoning at individual specification-point level.');
    const terms=model.keyTerms||[];
    add(cats.teaching,'language','Scientific language',3,terms.length>=6?3:terms.length>=4?2.5:terms.length>=2?2:terms.length?1:0,`${terms.length} defined key terms`,'Add more explicitly defined scientific terminology where useful.');

    const lessonSpecific=lessonVisual?.lessonSpecific===true&&String(lessonVisual?.svg||'').includes('<svg');
    add(cats.visuals,'lesson','Lesson-specific visual',5,lessonSpecific?5:0,lessonVisual?.kind||'No resolved visual','Add a lesson-specific scientific visual.');
    const pointVisuals=units.map((u,i)=>visuals?.get?.(topic,model.title,model,u,model.lessonIndex+i));
    const pointSpecific=pointVisuals.filter(v=>v?.pointSpecific===true).length;
    add(cats.visuals,'points','Point-specific visuals',6,units.length?ratio(pointSpecific,units.length,6):0,`${pointSpecific}/${units.length} mapped points have specific visuals`,'Give every specification point a relevant visual model.');
    const visualKinds=new Set(pointVisuals.map(v=>v?.kind).filter(Boolean));if(lessonVisual?.kind)visualKinds.add(lessonVisual.kind);
    add(cats.visuals,'variety','Visual variety',2,visualKinds.size>=3?2:visualKinds.size===2?1.5:visualKinds.size===1?1:0,`${visualKinds.size} visual type${visualKinds.size===1?'':'s'} in the lesson`,'Use a second visual representation when it genuinely improves understanding.');
    const aria=String(lessonVisual?.svg||'').includes('role="img"')&&String(lessonVisual?.svg||'').includes('aria-label=');
    add(cats.visuals,'semantics','Diagram semantics',2,aria?2:0,aria?'Accessible SVG semantics present':'Accessible semantics missing','Give every scientific diagram an accessible name.');

    const qValid=window.GCSE_LESSON_QUESTION_LADDER?.validate?.(questions)?.length===0;
    add(cats.interactivity,'question-ui','Interactive checks',4,qValid?4:0,`${questions.length} distributed checks`,'Repair the distributed-question model.');
    add(cats.interactivity,'differentiation','Differentiation',3,window.GCSE_LESSON_DIFFERENTIATION?.validate?.(diff)?.length===0?3:0,'Support / Core / Stretch','Complete the differentiation plan.');
    add(cats.interactivity,'modes','Teacher / Student modes',3,window.GCSE_LESSON_MODE_PLANS?.validate?.(modes)?.length===0?3:0,'Teacher-led and self-paced routes','Restore both delivery modes.');
    add(cats.interactivity,'synoptic','Synoptic transfer',3,Math.min(3,(synoptic?.connections?.length||0)),`${synoptic?.connections?.length||0} curated connections`,'Add more purposeful connections where they strengthen transfer.');
    add(cats.interactivity,'specialist','Specialist interaction',2,(model.practical||model.equations?.length)?2:1.5,model.practical?'Practical interaction':model.equations?.length?'Equation interaction':'General interactive lesson','Add a purposeful manipulation/prediction interaction if the science supports it.');

    const commands=new Set(questions.map(q=>q.command));
    add(cats.questions,'count','Question frequency',3,questions.length>=10?3:questions.length>=9?2.5:ratio(questions.length,9,3),`${questions.length} question interactions`,'Add checks across more lesson phases.');
    add(cats.questions,'commands','Command-word breadth',3,commands.size>=9?3:commands.size>=8?2.5:ratio(commands.size,8,3),`${commands.size} command words`,'Broaden AQA command-word practice where appropriate.');
    const marked=questions.filter(q=>q.marks>0&&(q.marking||[]).length).length;
    add(cats.questions,'marking','Mark guidance',2,questions.length?ratio(marked,questions.length,2):0,`${marked}/${questions.length} questions have marks/guidance`,'Add indicative mark points to every question.');
    const phases=new Set(questions.map(q=>q.phase));
    add(cats.questions,'distribution','Lesson distribution',2,phases.size>=5?2:ratio(phases.size,5,2),`${phases.size} lesson phases contain questions`,'Spread assessment through teach, apply, practise, exam and review stages.');

    const examValid=window.GCSE_LESSON_EXAM_STUDIO?.validate?.(exam)?.length===0;
    add(cats.exam,'studio','Exam Studio integrity',4,examValid?4:0,`${exam?.questions?.length||0} original lesson exam questions`,'Repair or complete the lesson Exam Studio.');
    add(cats.exam,'marks','Practice mark volume',2,exam?.totalMarks>=12?2:ratio(exam?.totalMarks||0,12,2),`${exam?.totalMarks||0} practice marks`,'Increase useful exam-practice mark coverage.');
    add(cats.exam,'extended','Extended response',2,exam?.questions?.some(q=>q.marks===6)?2:0,'Six-mark response '+(exam?.questions?.some(q=>q.marks===6)?'present':'missing'),'Add an appropriate six-mark extended response.');
    const allMarking=(exam?.questions||[]).every(q=>(q.marking||q.markScheme||q.points||[]).length||clean(q.modelAnswer).length);
    add(cats.exam,'feedback','Exam feedback evidence',2,exam?.questions?.length&&allMarking?2:1,allMarking?'Marking/model guidance available':'Partial feedback evidence','Strengthen indicative marking/model guidance.');

    let specialistScore=5,specialistEvidence='No specialist requirement; general scientific application is present.',specialistImprove='';
    if(model.practical){const ok=Boolean(practical)&&window.GCSE_PRACTICAL_LESSON_ENGINE?.validate?.(practical)?.length===0;specialistScore=ok?5:0;specialistEvidence='Required-practical coach '+(ok?'validated':'incomplete');specialistImprove='Complete purpose, apparatus, variables, method, results, analysis and evaluation support.';}
    if(model.equations?.length){const good=model.equations.filter(eq=>Boolean(window.GCSE_EQUATION_COACH?.build?.(eq,topic.subject))).length;const eqScore=ratio(good,model.equations.length,5);specialistScore=model.practical?Math.min(specialistScore,eqScore):eqScore;specialistEvidence=`${good}/${model.equations.length} mapped equations have coaching`;specialistImprove='Complete Equation Coach coverage including meaning, symbols, units, rearrangement and worked practice.';}
    add(cats.specialist,'specialist','Specialist teaching',5,specialistScore,specialistEvidence,specialistImprove);

    add(cats.accessibility,'svg','Accessible visual',2,aria?2:0,aria?'Diagram accessible name present':'Diagram accessible name missing','Add accessible image semantics.');
    add(cats.accessibility,'structure','Clear lesson structure',1,model.title&&model.ref&&model.plenary?.length?1:0,'Title, specification reference and plenary','Restore clear semantic lesson structure.');
    add(cats.accessibility,'routes','Multiple access routes',1,window.GCSE_LESSON_MODE_PLANS?.validate?.(modes)?.length===0?1:0,'Teacher and independent routes','Provide both presentation and self-paced routes.');
    add(cats.accessibility,'chunking','Cognitive chunking',1,chunks.length>=2&&chunks.every(x=>clean(x.text||x).length<=320)?1:0,`${chunks.length} constrained teaching chunks`,'Reduce oversized teaching chunks.');

    const categories=Object.values(cats).map(c=>({...c,percent:c.max?Math.round(c.score/c.max*100):0,band:band(c.max?Math.round(c.score/c.max*100):0)}));
    const total=categories.reduce((n,c)=>n+c.score,0),max=categories.reduce((n,c)=>n+c.max,0),percent=max?Math.round(total/max*100):0;
    const improvements=categories.flatMap(c=>c.items.filter(i=>i.earned<i.max).map(i=>({category:c.label,id:i.id,label:i.label,percent:i.max?Math.round(i.earned/i.max*100):0,priority:priorityFor(i.max?Math.round(i.earned/i.max*100):0),evidence:i.evidence,action:i.improve}))).sort((a,b)=>({high:0,medium:1,low:2,none:3}[a.priority]-({high:0,medium:1,low:2,none:3}[b.priority])||a.percent-b.percent);
    return {lessonId:model.id,title:model.title,topicId:topic.id,subject:topic.subject,score:Math.round(total*10)/10,max,percent,band:band(percent),gatePassed:gate?.passed!==false,blockers:gate?.blockers||[],categories,improvements,topPriorities:improvements.slice(0,5)};
  }

  function courseEvidence(data,rich,catalog){
    const lessons=[];
    for(const subject of ['biology','chemistry','physics'])for(const topic of data.topics.filter(t=>t.subject===subject).sort((a,b)=>a.order-b.order))for(let index=0;index<topic.lessons.length;index++){const title=topic.lessons[index][0],lesson=rich.getLesson(topic,title,index),model=catalog.build(topic,title,index,lesson);lessons.push(score(model,topic,data.topics));}
    const subjects=['biology','chemistry','physics'].map(subject=>{const rows=lessons.filter(x=>x.subject===subject);return{subject,total:rows.length,average:rows.length?Math.round(rows.reduce((n,x)=>n+x.percent,0)/rows.length):0,min:rows.length?Math.min(...rows.map(x=>x.percent)):0,gatePassed:rows.filter(x=>x.gatePassed).length,priority:rows.filter(x=>x.topPriorities.length).sort((a,b)=>a.percent-b.percent)};});
    return {total:lessons.length,average:lessons.length?Math.round(lessons.reduce((n,x)=>n+x.percent,0)/lessons.length):0,min:lessons.length?Math.min(...lessons.map(x=>x.percent)):0,gatePassed:lessons.filter(x=>x.gatePassed).length,lessons,subjects,bands:Object.fromEntries(['Exemplary','Strong','Secure','Developing','Priority review'].map(b=>[b,lessons.filter(x=>x.band===b).length]))};
  }

  window.GCSE_LESSON_QUALITY_EVIDENCE={score,courseEvidence,band};
})();
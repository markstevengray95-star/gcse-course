(() => {
  const clean=v=>String(v??'').trim();
  const priority={review:0,developing:1,unrated:2,secure:3};
  function action(kind,label,target,detail){return{kind,label,target,detail:clean(detail)}}
  function actionsForPoint(model,point,index){
    const actions=[
      action('teach','Revisit teaching',`specpoint:${index}`,point.explanation||point.text),
      action('apply','Try application',`specapply:${index}`,point.application||model.application),
      action('question','Practise exam question','exam',point.question||model.examTip)
    ];
    if(point.visualKey)actions.splice(1,0,action('visual','Review diagram',`specpoint:${index}`,`Use the lesson-specific visual for ${point.visualKey}.`));
    if(model.equations?.length)actions.push(action('equation','Open Equation Coach','equationcoach',model.equations[0]));
    if(model.practical)actions.push(action('practical','Review practical','practical',model.practical));
    return actions;
  }
  function recommendation(state,actions){
    if(state==='review')return actions.find(a=>a.kind==='teach')||actions[0];
    if(state==='developing')return actions.find(a=>a.kind==='apply')||actions[0];
    if(state==='secure')return actions.find(a=>a.kind==='question')||actions[0];
    return actions.find(a=>a.kind==='question')||actions[0];
  }
  function build(model,stateMap={}){
    if(!model)return null;
    const points=(model.specificationPoints||[]).map((point,index)=>{
      const state=stateMap[index]||stateMap[String(index)]||'unrated';
      const actions=actionsForPoint(model,point,index);
      return{index,text:point.text,state,priority:priority[state]??2,actions,recommended:recommendation(state,actions)};
    });
    const weak=points.filter(p=>p.state!=='secure').sort((a,b)=>a.priority-b.priority||a.index-b.index);
    const secure=points.filter(p=>p.state==='secure');
    return{
      lessonId:model.id,title:model.title,ref:model.ref,total:points.length,points,weak,secure,
      summary:{secure:secure.length,developing:points.filter(p=>p.state==='developing').length,review:points.filter(p=>p.state==='review').length,unrated:points.filter(p=>p.state==='unrated').length},
      next:weak[0]?.recommended||null
    };
  }
  function validate(plan){
    const missing=[];if(!plan)return['mastery-plan'];
    if(plan.points.length!==plan.total)missing.push('point-total');
    plan.points.forEach((p,i)=>{
      if(!clean(p.text))missing.push(`point-text-${i}`);
      if((p.actions||[]).length<3)missing.push(`actions-${i}`);
      if(!p.actions?.some(a=>a.kind==='teach'))missing.push(`teach-${i}`);
      if(!p.actions?.some(a=>a.kind==='apply'))missing.push(`apply-${i}`);
      if(!p.actions?.some(a=>a.kind==='question'))missing.push(`question-${i}`);
      if(!p.recommended)missing.push(`recommended-${i}`);
    });
    return [...new Set(missing)];
  }
  window.GCSE_LESSON_MASTERY_ACTIONS={build,validate,actionsForPoint,priority};
})();
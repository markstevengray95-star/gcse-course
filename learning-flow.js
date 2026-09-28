(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;

  const PHYSICS_EQ={p1:'Ek=0.5mv²',p2:'V=IR',p5:'F=ma',p6:'v=fλ'};
  const ARCADE_MODE={overview:'commands',lessons:'vocab',textbook:'vocab',activities:'variables',practicals:'variables',simulation:'variables',exam:'commands',quiz:'describeVsExplain',equations:'commands',coach:'vocab'};
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);

  function lessonStats(topic){
    const lessons=visibleLessons(topic);
    const complete=lessons.map(([,],i)=>!!lessonProgress[lessonKey(topic.id,i)]);
    const done=complete.filter(Boolean).length;
    const next=complete.findIndex(v=>!v);
    return {lessons,complete,done,total:lessons.length,percent:lessons.length?Math.round(done/lessons.length*100):0,next};
  }

  function openLesson(index,{completeCurrent=false}={}){
    const topic=activeTopic();if(!topic)return;
    const stats=lessonStats(topic);
    if(completeCurrent&&state.activeLessonIndex>=0&&state.activeLessonIndex<stats.total){
      lessonProgress[lessonKey(topic.id,state.activeLessonIndex)]=true;
      if(typeof saveLessons==='function')saveLessons();
    }
    const target=Math.max(0,Math.min(index,stats.total-1));
    state.activeTab='lessons';state.activeLessonIndex=target;renderTopic();
    requestAnimationFrame(()=>document.querySelectorAll('.lesson-card')[target]?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function recommendedAction(topic,stats){
    if(stats.next>=0){
      const title=stats.lessons[stats.next]?.[0]||'next lesson';
      return {kind:'lesson',label:`Continue lesson ${stats.next+1}`,detail:title};
    }
    const guide=window.GCSE_RICH_CONTENT?.guides?.[topic.id];
    const attempted=(window.GCSE_COURSE_MASTERY?.attemptsForTopic?.(topic.id)||[]).length;
    if(!attempted&&guide?.exam?.length) return {kind:'exam',label:'Start exam practice',detail:`${guide.exam.length} questions available`};
    return {kind:'coach',label:'Review your mastery',detail:'Check strengths and next revision priorities'};
  }

  function renderFlowBar(){
    const topic=activeTopic(),view=document.getElementById('topicView');
    if(!topic||!view||view.hidden)return;
    const stats=lessonStats(topic),action=recommendedAction(topic,stats);
    let bar=document.getElementById('topicLearningFlow');
    if(!bar){bar=document.createElement('section');bar.id='topicLearningFlow';bar.className='topic-learning-flow';document.getElementById('topicHero')?.insertAdjacentElement('afterend',bar);}
    const nextTitle=stats.next>=0?stats.lessons[stats.next][0]:'All lesson sections completed';
    const eq=topic.subject==='physics'?PHYSICS_EQ[topic.id]:null;
    const arcade=ARCADE_MODE[state.activeTab]||'commands';
    bar.innerHTML=`
      <div class="flow-progress-block">
        <div class="flow-progress-copy"><span class="eyebrow">Topic learning path</span><strong>${stats.done} of ${stats.total} lessons complete</strong><small>${stats.percent}% · ${esc(nextTitle)}</small></div>
        <div class="flow-progress-track" aria-label="${stats.percent}% of topic lessons complete"><i style="width:${stats.percent}%"></i></div>
      </div>
      <div class="flow-actions">
        <button type="button" class="button primary" data-flow-action="${action.kind}"><span>${esc(action.label)}</span><small>${esc(action.detail)}</small></button>
        <button type="button" class="button" data-flow-tool="arcade" data-mode="${arcade}"><span>Exam-skill drill</span><small>${arcade==='variables'?'Variables & practical thinking':arcade==='vocab'?'Scientific vocabulary':arcade==='describeVsExplain'?'Describe vs explain':'Command words'}</small></button>
        ${eq?`<button type="button" class="button" data-flow-tool="physics" data-eq="${esc(eq)}"><span>Physics calculation</span><small>${esc(eq)}</small></button>`:''}
      </div>`;
    bar.querySelector('[data-flow-action]')?.addEventListener('click',e=>{
      const kind=e.currentTarget.dataset.flowAction;
      if(kind==='lesson')openLesson(stats.next);
      else {state.activeTab=kind==='coach'?'coach':'exam';renderTopic();document.getElementById('topicContent')?.scrollIntoView({behavior:'smooth',block:'start'});}
    });
    bar.querySelectorAll('[data-flow-tool]').forEach(btn=>btn.addEventListener('click',()=>{
      window.GCSE_INTEGRATED_TOOLS?.openTool(btn.dataset.flowTool,{mode:btn.dataset.mode,eq:btn.dataset.eq,topicId:topic.id});
    }));
  }

  function renderOverviewQueue(){
    if(state.activeTab!=='overview')return;
    const topic=activeTopic(),root=document.getElementById('topicContent');if(!topic||!root||root.querySelector('.next-lessons-panel'))return;
    const stats=lessonStats(topic),pending=stats.lessons.map(([title],index)=>({title,index,done:stats.complete[index]})).filter(x=>!x.done).slice(0,3);
    const panel=document.createElement('section');panel.className='panel content-panel full-span next-lessons-panel';
    panel.innerHTML=pending.length?`<div class="content-heading"><div><span class="eyebrow">Continue learning</span><h2>Your next lessons</h2><p class="muted">Start with the first unfinished lesson rather than searching through the whole topic.</p></div></div><div class="next-lesson-grid">${pending.map((x,i)=>`<button type="button" data-queue-lesson="${x.index}"><span>${x.index+1}</span><div><strong>${esc(x.title)}</strong><small>${i===0?'Recommended next':'Coming up'}</small></div><b>→</b></button>`).join('')}</div>`:`<div class="content-heading"><div><span class="eyebrow">Lessons complete</span><h2>Move into exam practice</h2><p class="muted">You have checked off every visible lesson in this topic. Test recall and application next.</p></div><button class="button primary" type="button" data-queue-exam>Open exam practice</button></div>`;
    root.appendChild(panel);
    panel.querySelectorAll('[data-queue-lesson]').forEach(btn=>btn.addEventListener('click',()=>openLesson(Number(btn.dataset.queueLesson))));
    panel.querySelector('[data-queue-exam]')?.addEventListener('click',()=>{state.activeTab='exam';renderTopic();});
  }

  function renderLessonNavigator(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    const topic=activeTopic(),cards=[...document.querySelectorAll('#topicContent .lesson-card')];if(!topic||!cards.length)return;
    const index=Math.min(state.activeLessonIndex,cards.length-1),card=cards[index];if(!card||card.querySelector('.lesson-sequence-nav'))return;
    const stats=lessonStats(topic),done=stats.complete[index],last=index===stats.total-1;
    const nav=document.createElement('nav');nav.className='lesson-sequence-nav';nav.setAttribute('aria-label','Lesson sequence navigation');
    nav.innerHTML=`<button type="button" ${index===0?'disabled':''} data-lesson-nav="prev">← Previous</button><div><strong>Lesson ${index+1} of ${stats.total}</strong><small>${esc(stats.lessons[index][0])}</small></div><button type="button" class="complete-next" data-lesson-nav="complete">${done?'Next lesson':'Mark complete & next'} ${last?'✓':'→'}</button><button type="button" ${last?'disabled':''} data-lesson-nav="next">Next →</button>`;
    card.appendChild(nav);
    nav.querySelector('[data-lesson-nav="prev"]')?.addEventListener('click',()=>openLesson(index-1));
    nav.querySelector('[data-lesson-nav="next"]')?.addEventListener('click',()=>openLesson(index+1));
    nav.querySelector('[data-lesson-nav="complete"]')?.addEventListener('click',()=>{
      if(!done){lessonProgress[lessonKey(topic.id,index)]=true;if(typeof saveLessons==='function')saveLessons();}
      if(last){state.activeTab='exam';state.activeLessonIndex=-1;renderTopic();}
      else openLesson(index+1);
    });
  }

  function addContextualToolHints(){
    const topic=activeTopic(),root=document.getElementById('topicContent');if(!topic||!root)return;
    if((state.activeTab==='exam'||state.activeTab==='quiz')&&!root.querySelector('.context-tool-hint')){
      const mode=state.activeTab==='quiz'?'describeVsExplain':'commands';
      const hint=document.createElement('div');hint.className='context-tool-hint';hint.innerHTML=`<div><strong>Need an exam-technique warm-up?</strong><small>${mode==='commands'?'Practise command words before answering.':'Sharpen the difference between describing and explaining.'}</small></div><button class="button" type="button">Open skill drill</button>`;
      hint.querySelector('button').addEventListener('click',()=>window.GCSE_INTEGRATED_TOOLS?.openTool('arcade',{mode,topicId:topic.id}));root.prepend(hint);
    }
    const eq=PHYSICS_EQ[topic.id];
    if(topic.subject==='physics'&&eq&&(state.activeTab==='equations'||state.activeTab==='simulation')&&!root.querySelector('.physics-context-hint')){
      const hint=document.createElement('div');hint.className='context-tool-hint physics-context-hint';hint.innerHTML=`<div><strong>Recommended equation practice</strong><small>${esc(eq)} · opens directly on the relevant Physics relationship.</small></div><button class="button" type="button">Practise ${esc(eq)}</button>`;
      hint.querySelector('button').addEventListener('click',()=>window.GCSE_INTEGRATED_TOOLS?.openTool('physics',{eq,topicId:topic.id}));root.prepend(hint);
    }
  }

  const baseRenderTopic=renderTopic;
  renderTopic=function(){baseRenderTopic();renderFlowBar();renderOverviewQueue();renderLessonNavigator();addContextualToolHints();};

  document.addEventListener('keydown',e=>{
    if(document.getElementById('topicView')?.hidden||state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();openLesson(state.activeLessonIndex+1);}
    if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();openLesson(state.activeLessonIndex-1);}
  });

  if(!document.getElementById('topicView')?.hidden){renderFlowBar();renderOverviewQueue();renderLessonNavigator();addContextualToolHints();}
  window.GCSE_LEARNING_FLOW={lessonStats,openLesson,recommendedAction,PHYSICS_EQ,ARCADE_MODE};
})();
(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;

  const CHECKPOINT_KEY='gcse-science-study-checkpoints-v1';
  const RESUME_KEY='gcse-science-resume-v2';
  const parse=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
  let checkpoints=parse(localStorage.getItem(CHECKPOINT_KEY),{});
  let resume=parse(localStorage.getItem(RESUME_KEY),null);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const stableKey=(topicId,title)=>window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topicId,title)||`lesson:${topicId}:${encodeURIComponent(title||'untitled')}`;

  function saveCheckpoints(){localStorage.setItem(CHECKPOINT_KEY,JSON.stringify(checkpoints));}
  function saveResume(){if(resume)localStorage.setItem(RESUME_KEY,JSON.stringify(resume));}
  function lessonCheckpoint(topic,title){return checkpoints[stableKey(topic.id,title)]||null;}
  function checkpointLabel(value){return value===3?'Secure':value===2?'Developing':value===1?'Needs review':'Not checked';}
  function checkpointClass(value){return value===3?'secure':value===2?'developing':value===1?'review':'unset';}

  function lessonMeta(topic,title,index){
    const rich=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);
    const meta=rich?.biologyMeta||rich?.chemistryMeta||rich?.physicsMeta||null;
    const focus=meta?.focus||rich?.objectives||[];
    return {rich,meta,focus};
  }

  function rememberPosition(){
    const topic=activeTopic();if(!topic||document.getElementById('topicView')?.hidden)return;
    const lessons=visibleLessons(topic);
    const index=state.activeTab==='lessons'&&state.activeLessonIndex>=0?state.activeLessonIndex:null;
    resume={topicId:topic.id,tab:state.activeTab,lessonIndex:index,lessonTitle:index!==null?lessons[index]?.[0]||null:null,updated:new Date().toISOString()};
    saveResume();
  }

  function resolveResumeLesson(topic){
    if(!resume||resume.topicId!==topic.id||resume.lessonIndex===null)return null;
    const lessons=visibleLessons(topic);
    if(resume.lessonTitle){
      const byTitle=lessons.findIndex(([title])=>title===resume.lessonTitle);
      if(byTitle>=0)return byTitle;
    }
    return Math.max(0,Math.min(Number(resume.lessonIndex)||0,lessons.length-1));
  }

  function openResume(){
    if(!resume)return;
    const topic=topics.find(t=>t.id===resume.topicId&&(state.mode==='triple'||t.scope!=='triple'));
    if(!topic)return;
    if(typeof openTopic==='function')openTopic(topic.id);
    state.activeTab=resume.tab||'overview';
    const index=resolveResumeLesson(topic);
    state.activeLessonIndex=index===null?0:index;
    renderTopic();
    if(index!==null)requestAnimationFrame(()=>document.querySelectorAll('#topicContent .lesson-card')[index]?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function reviewItems(){
    const now=Date.now();
    const items=[];
    for(const topic of availableTopics()){
      visibleLessons(topic).forEach(([title],index)=>{
        const cp=lessonCheckpoint(topic,title);if(!cp)return;
        const ageDays=Math.floor((now-new Date(cp.updated).getTime())/86400000);
        const due=cp.confidence<3||ageDays>=14;
        if(due)items.push({topic,title,index,confidence:cp.confidence,ageDays,updated:cp.updated});
      });
    }
    return items.sort((a,b)=>a.confidence-b.confidence||b.ageDays-a.ageDays);
  }

  function topicConfidence(topic){
    const lessons=visibleLessons(topic);
    const values=lessons.map(([title])=>lessonCheckpoint(topic,title)?.confidence).filter(Boolean);
    if(!values.length)return null;
    return {checked:values.length,total:lessons.length,percent:Math.round(values.reduce((a,b)=>a+b,0)/(values.length*3)*100),secure:values.filter(v=>v===3).length};
  }

  function injectResumeHome(){
    const home=document.getElementById('homeView'),hero=home?.querySelector('.hero');if(!home||!hero)return;
    home.querySelector('.resume-learning-card')?.remove();
    const topic=resume?topics.find(t=>t.id===resume.topicId&&(state.mode==='triple'||t.scope!=='triple')):null;
    if(!topic)return;
    const card=document.createElement('section');card.className='resume-learning-card panel';
    const when=resume.updated?new Date(resume.updated).toLocaleDateString(undefined,{day:'numeric',month:'short'}):'';
    const place=resume.tab==='lessons'&&resume.lessonTitle?resume.lessonTitle:(resume.tab||'overview').replace(/^./,c=>c.toUpperCase());
    card.innerHTML=`<div class="resume-icon">▶</div><div><span class="eyebrow">Resume where you left off</span><h2>${esc(topic.code)} · ${esc(topic.title)}</h2><p>${esc(place)}${when?` · last opened ${esc(when)}`:''}</p></div><button type="button" class="button primary">Continue</button>`;
    hero.insertAdjacentElement('afterend',card);
    card.querySelector('button').addEventListener('click',openResume);
  }

  function injectReviewQueue(){
    const home=document.getElementById('homeView');if(!home)return;
    home.querySelector('.study-review-queue')?.remove();
    const items=reviewItems().slice(0,5);if(!items.length)return;
    const section=document.createElement('section');section.className='study-review-queue panel';
    section.innerHTML=`<div class="section-head compact"><div><span class="eyebrow">Personal review queue</span><h2>Revisit these lessons</h2><p>Lessons you marked as uncertain, plus secure lessons that have not been checked for a while.</p></div><span class="review-count">${reviewItems().length} due</span></div><div class="review-queue-list">${items.map(item=>`<button type="button" data-review-topic="${item.topic.id}" data-review-index="${item.index}"><span class="review-dot ${checkpointClass(item.confidence)}"></span><div><strong>${esc(item.topic.code)} · ${esc(item.title)}</strong><small>${checkpointLabel(item.confidence)}${item.ageDays?` · checked ${item.ageDays}d ago`:''}</small></div><b>Review →</b></button>`).join('')}</div>`;
    const quick=document.getElementById('courseQuickLaunch'),anchor=quick||document.querySelector('#homeView .control-panel');
    anchor?.insertAdjacentElement('afterend',section);
    section.querySelectorAll('[data-review-topic]').forEach(btn=>btn.addEventListener('click',()=>{
      if(typeof openTopic==='function')openTopic(btn.dataset.reviewTopic);
      state.activeTab='lessons';state.activeLessonIndex=Number(btn.dataset.reviewIndex);renderTopic();
      requestAnimationFrame(()=>document.querySelectorAll('#topicContent .lesson-card')[state.activeLessonIndex]?.scrollIntoView({behavior:'smooth',block:'start'}));
    }));
  }

  function checkpointPrompts(topic,title,index){
    const {focus,rich}=lessonMeta(topic,title,index);
    const fallback=[
      `Explain the main idea in ${title.toLowerCase()} without looking at your notes.`,
      `Apply ${title.toLowerCase()} to a new GCSE-style example.`,
      `Use the key terminology${topic.subject==='physics'?' and equations':''} accurately in an exam answer.`
    ];
    return [
      focus[0]?`Can you explain this without notes: ${focus[0]}`:fallback[0],
      focus[1]?`Can you apply this idea: ${focus[1]}`:fallback[1],
      rich?.examTip?`Can you follow this exam advice: ${rich.examTip}`:fallback[2]
    ];
  }

  function renderLessonCheckpoint(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    const topic=activeTopic(),lessons=visibleLessons(topic);if(!topic)return;
    const index=Math.min(state.activeLessonIndex,lessons.length-1),entry=lessons[index];if(!entry)return;
    const [title]=entry,card=document.querySelectorAll('#topicContent .lesson-card')[index];if(!card||card.querySelector('.lesson-checkpoint'))return;
    const cp=lessonCheckpoint(topic,title),prompts=checkpointPrompts(topic,title,index);
    const section=document.createElement('section');section.className='lesson-checkpoint';
    section.innerHTML=`<div class="checkpoint-head"><div><span class="eyebrow">End-of-lesson checkpoint</span><h3>How secure is this lesson?</h3><p>Try these from memory before choosing a confidence level.</p></div><span class="checkpoint-status ${checkpointClass(cp?.confidence)}">${checkpointLabel(cp?.confidence)}</span></div><ol class="checkpoint-prompts">${prompts.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><div class="checkpoint-confidence" role="group" aria-label="Lesson confidence"><button type="button" data-confidence="1" class="${cp?.confidence===1?'active':''}"><span>1</span><strong>Needs review</strong><small>I still need notes/help.</small></button><button type="button" data-confidence="2" class="${cp?.confidence===2?'active':''}"><span>2</span><strong>Developing</strong><small>I can explain most of it.</small></button><button type="button" data-confidence="3" class="${cp?.confidence===3?'active':''}"><span>3</span><strong>Secure</strong><small>I can explain and apply it.</small></button></div><p class="checkpoint-note">This is your own study confidence, not an exam grade.</p>`;
    const nav=card.querySelector('.lesson-sequence-nav');
    if(nav)card.insertBefore(section,nav);else card.appendChild(section);
    section.querySelectorAll('[data-confidence]').forEach(btn=>btn.addEventListener('click',()=>{
      const confidence=Number(btn.dataset.confidence);
      checkpoints[stableKey(topic.id,title)]={confidence,updated:new Date().toISOString(),topicId:topic.id,title};saveCheckpoints();
      if(confidence===3&&!lessonProgress[lessonKey(topic.id,index)]){lessonProgress[lessonKey(topic.id,index)]=true;if(typeof saveLessons==='function')saveLessons();}
      renderTopic();
    }));
  }

  function decorateLessonConfidence(){
    if(state.activeTab!=='lessons')return;
    const topic=activeTopic();if(!topic)return;
    visibleLessons(topic).forEach(([title],index)=>{
      const card=document.querySelectorAll('#topicContent .lesson-card')[index],cp=lessonCheckpoint(topic,title);if(!card||!cp)return;
      const head=card.querySelector('.lesson-card-head');if(!head||head.querySelector('.lesson-confidence-pill'))return;
      const pill=document.createElement('span');pill.className=`lesson-confidence-pill ${checkpointClass(cp.confidence)}`;pill.textContent=checkpointLabel(cp.confidence);pill.title='Your saved study confidence for this lesson';
      head.querySelector('.lesson-open')?.before(pill);
    });
  }

  function injectTopicConfidence(){
    const topic=activeTopic(),flow=document.getElementById('topicLearningFlow');if(!topic||!flow)return;
    const stat=topicConfidence(topic);flow.querySelector('.topic-confidence-summary')?.remove();
    const box=document.createElement('div');box.className='topic-confidence-summary';
    box.innerHTML=stat?`<span class="eyebrow">Study confidence</span><strong>${stat.percent}%</strong><small>${stat.secure} secure · ${stat.checked}/${stat.total} lessons checked</small>`:`<span class="eyebrow">Study confidence</span><strong>Not checked yet</strong><small>Use the checkpoint at the end of each lesson.</small>`;
    flow.appendChild(box);
  }

  function injectCoachReviewSummary(){
    if(state.activeTab!=='coach')return;
    const topic=activeTopic(),root=document.getElementById('topicContent');if(!topic||!root||root.querySelector('.checkpoint-coach-panel'))return;
    const lessons=visibleLessons(topic),rows=lessons.map(([title],index)=>({title,index,cp:lessonCheckpoint(topic,title)})).filter(x=>x.cp).sort((a,b)=>a.cp.confidence-b.cp.confidence);
    const stat=topicConfidence(topic),panel=document.createElement('section');panel.className='panel content-panel checkpoint-coach-panel';
    panel.innerHTML=`<span class="eyebrow">Lesson confidence</span><h2>${stat?`${stat.percent}% study confidence`:'Start checking your lessons'}</h2><p class="muted">This self-check complements exam-practice evidence; it does not replace marked questions.</p>${rows.length?`<div class="coach-confidence-list">${rows.slice(0,6).map(row=>`<button type="button" data-coach-lesson="${row.index}"><span class="review-dot ${checkpointClass(row.cp.confidence)}"></span><span>${esc(row.title)}</span><strong>${checkpointLabel(row.cp.confidence)}</strong></button>`).join('')}</div>`:'<p>No lesson checkpoints saved for this topic yet.</p>'}`;
    root.prepend(panel);
    panel.querySelectorAll('[data-coach-lesson]').forEach(btn=>btn.addEventListener('click',()=>{state.activeTab='lessons';state.activeLessonIndex=Number(btn.dataset.coachLesson);renderTopic();}));
  }

  const baseRenderTopic=renderTopic;
  renderTopic=function(){baseRenderTopic();rememberPosition();renderLessonCheckpoint();decorateLessonConfidence();injectTopicConfidence();injectCoachReviewSummary();};
  if(typeof renderHome==='function'){
    const baseRenderHome=renderHome;
    renderHome=function(){baseRenderHome();injectResumeHome();injectReviewQueue();};
  }

  injectResumeHome();injectReviewQueue();
  if(!document.getElementById('topicView')?.hidden){rememberPosition();renderLessonCheckpoint();decorateLessonConfidence();injectTopicConfidence();injectCoachReviewSummary();}
  window.GCSE_STUDY_CHECKPOINTS={get:()=>checkpoints,reviewItems,topicConfidence,openResume,lessonCheckpoint};
})();
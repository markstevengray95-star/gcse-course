(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const QUIZ_KEY='gcse-science-team-quiz-v1';
  const EXPERT_KEY='gcse-science-expert-challenges-v1';
  const MASTERY_KEY='gcse-science-presentation-mastery-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(key,f={})=>{try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  let quizStore=parse(QUIZ_KEY,{}),expertStore=parse(EXPERT_KEY,{}),timerId=null;

  function context(deck){
    const topic=activeTopic();if(!topic)return null;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const title=deck.dataset.lessonTitle||'';const index=lessons.findIndex(([name])=>name===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);
    if(!model?.overhaul23||!model?.overhaul24)return null;
    return {topic,title,index,lesson,model,key:model.id};
  }

  function defaultQuiz(ctx){return{round:0,reveal:false,seconds:ctx.model.overhaul23.rules.defaultSeconds,running:false,teams:[1,2,3,4].map(i=>({name:`Team ${i}`,score:0,vote:''}))};}
  function quizState(ctx){quizStore[ctx.key]||=defaultQuiz(ctx);return quizStore[ctx.key];}
  function persistQuiz(){save(QUIZ_KEY,quizStore);}
  function masteryState(ctx){const all=parse(MASTERY_KEY,{}),states=all[ctx.key]||{},total=ctx.model.specificationPoints?.length||0,secure=Array.from({length:total},(_,i)=>states[i]||states[String(i)]).filter(v=>v==='secure').length;return{states,total,secure,unlocked:total>0&&secure===total};}

  function teamHtml(team,index,round){
    const vote=team.vote||'';const voteButtons=round?.type==='vote'?`<div class="team-vote-buttons" aria-label="${esc(team.name)} vote">${['A','B','C'].map(choice=>`<button type="button" data-team-vote="${index}:${choice}" class="${vote===choice?'active':''}">${choice}</button>`).join('')}</div>`:'';
    return `<article class="team-quiz-team"><input type="text" maxlength="20" value="${esc(team.name)}" data-team-name="${index}" aria-label="Team ${index+1} name"><strong data-team-score="${index}">${team.score}</strong><span>points</span>${voteButtons}<div class="team-score-actions"><button type="button" data-team-minus="${index}" aria-label="Remove one point from ${esc(team.name)}">−1</button><button type="button" data-team-plus="${index}" aria-label="Add one point to ${esc(team.name)}">+1</button></div></article>`;
  }

  function roundHtml(ctx,q){
    const quiz=ctx.model.overhaul23,round=quiz.rounds[Math.max(0,Math.min(q.round,quiz.rounds.length-1))];
    const choices=round.type==='vote'?`<div class="team-quiz-choices">${round.choices.map(choice=>`<article><span>${choice.id}</span><p>${esc(choice.text)}</p></article>`).join('')}</div>`:'';
    return `<div class="team-quiz-round" data-team-quiz-round><div class="team-quiz-round-head"><div><span class="eyebrow">${esc(round.label)}</span><h4>${esc(round.prompt)}</h4></div><span class="team-quiz-points">${round.points} pt${round.points===1?'':'s'}</span></div>${choices}<div class="team-quiz-teams">${q.teams.map((team,i)=>teamHtml(team,i,round)).join('')}</div><div class="team-quiz-reveal" ${q.reveal?'':'hidden'}><strong>Reveal</strong><p>${esc(round.reveal)}</p><small>${esc(round.discussion)}</small></div><div class="team-quiz-controls"><button type="button" data-quiz-prev ${q.round===0?'disabled':''}>← Previous</button><button type="button" data-quiz-reveal>${q.reveal?'Hide reveal':'Reveal & discuss'}</button><button type="button" data-quiz-next ${q.round===quiz.rounds.length-1?'disabled':''}>Next round →</button></div></div>`;
  }

  function phase23Html(ctx){
    const q=quizState(ctx);return `<section class="phase23-team-quiz" data-phase23-team-quiz data-lesson-id="${esc(ctx.key)}"><div class="phase2324-head"><div><span class="eyebrow">Phase 23 · Live Team Quiz Mode</span><h3>Presenter-led team rounds</h3><p>Four teams share one screen. Scores stay by team and are never converted into individual rankings.</p></div><div class="team-quiz-timer"><strong data-quiz-time>${q.seconds}s</strong><button type="button" data-quiz-timer>${q.running?'Pause':'Start timer'}</button></div></div>${roundHtml(ctx,q)}<div class="team-quiz-footer"><span>${esc(ctx.model.overhaul23.finishPrompt)}</span><button type="button" data-quiz-reset>Reset quiz</button></div></section>`;
  }

  function challengeCard(ctx,challenge){
    const value=expertStore[ctx.key]?.[challenge.id]||'';
    return `<article class="expert-challenge-card" data-expert-card="${esc(challenge.id)}"><div class="expert-challenge-head"><span>${esc(challenge.difficulty)}</span><strong>${esc(challenge.label)}</strong></div><p>${esc(challenge.prompt)}</p><textarea rows="4" data-expert-response="${esc(challenge.id)}" placeholder="Build your expert response…">${esc(value)}</textarea><div class="expert-challenge-actions"><button type="button" data-expert-save="${esc(challenge.id)}">Save response</button><button type="button" data-expert-note="${esc(challenge.id)}">＋ Notebook</button></div><details><summary>Expert success criteria</summary><ul>${challenge.success.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details></article>`;
  }

  function phase24Html(ctx){
    const mastery=masteryState(ctx),phase=ctx.model.overhaul24;
    if(!mastery.unlocked)return `<section class="phase24-expert-challenges is-locked" data-phase24-expert data-lesson-key="${esc(ctx.key)}" data-unlock="false"><div class="phase2324-head"><div><span class="eyebrow">Phase 24 · Unlockable Expert Challenges</span><h3>Expert challenges locked</h3><p>${esc(phase.masteryMessage)}</p></div><span class="expert-lock">🔒 ${mastery.secure}/${mastery.total} secure</span></div><div class="expert-progress" aria-label="${mastery.secure} of ${mastery.total} specification points secure"><i style="width:${mastery.total?Math.round(mastery.secure/mastery.total*100):0}%"></i></div><small>These are optional stretch tasks. Nothing is lost by skipping them.</small></section>`;
    return `<section class="phase24-expert-challenges is-unlocked" data-phase24-expert data-lesson-key="${esc(ctx.key)}" data-unlock="true"><div class="phase2324-head"><div><span class="eyebrow">Phase 24 · Unlockable Expert Challenges</span><h3>Expert mode unlocked</h3><p>${esc(phase.unlockedMessage)}</p></div><span class="expert-lock">✓ ${mastery.secure}/${mastery.total} secure</span></div><div class="expert-challenge-grid">${phase.challenges.map(challenge=>challengeCard(ctx,challenge)).join('')}</div><p class="expert-optional-note">Optional stretch only · no penalty for skipping · use after the main lesson work is secure.</p></section>`;
  }

  function renderQuiz(panel,ctx){
    const q=quizState(ctx);const host=panel.querySelector('[data-team-quiz-round]');if(host)host.outerHTML=roundHtml(ctx,q);bindQuiz(panel,ctx);
    const timer=panel.querySelector('[data-quiz-time]');if(timer)timer.textContent=`${q.seconds}s`;const timerBtn=panel.querySelector('[data-quiz-timer]');if(timerBtn)timerBtn.textContent=q.running?'Pause':'Start timer';
  }

  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
  function startTimer(panel,ctx){
    const q=quizState(ctx);stopTimer();q.running=true;persistQuiz();const btn=panel.querySelector('[data-quiz-timer]');if(btn)btn.textContent='Pause';
    timerId=setInterval(()=>{q.seconds=Math.max(0,q.seconds-1);if(q.seconds===0){q.running=false;stopTimer();}persistQuiz();const time=panel.querySelector('[data-quiz-time]');if(time)time.textContent=`${q.seconds}s`;if(btn)btn.textContent=q.running?'Pause':'Start timer';},1000);
  }

  function bindQuiz(panel,ctx){
    const q=quizState(ctx),quiz=ctx.model.overhaul23;
    panel.querySelectorAll('[data-team-name]').forEach(input=>input.addEventListener('change',()=>{const i=Number(input.dataset.teamName);q.teams[i].name=input.value.trim()||`Team ${i+1}`;persistQuiz();}));
    panel.querySelectorAll('[data-team-plus]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.teamPlus);q.teams[i].score++;persistQuiz();renderQuiz(panel,ctx);}));
    panel.querySelectorAll('[data-team-minus]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.teamMinus);q.teams[i].score=Math.max(0,q.teams[i].score-1);persistQuiz();renderQuiz(panel,ctx);}));
    panel.querySelectorAll('[data-team-vote]').forEach(btn=>btn.addEventListener('click',()=>{const [i,choice]=btn.dataset.teamVote.split(':');q.teams[Number(i)].vote=choice;persistQuiz();renderQuiz(panel,ctx);}));
    panel.querySelector('[data-quiz-reveal]')?.addEventListener('click',()=>{q.reveal=!q.reveal;persistQuiz();renderQuiz(panel,ctx);});
    panel.querySelector('[data-quiz-prev]')?.addEventListener('click',()=>{q.round=Math.max(0,q.round-1);q.reveal=false;q.teams.forEach(t=>t.vote='');q.seconds=quiz.rules.defaultSeconds;q.running=false;stopTimer();persistQuiz();renderQuiz(panel,ctx);});
    panel.querySelector('[data-quiz-next]')?.addEventListener('click',()=>{q.round=Math.min(quiz.rounds.length-1,q.round+1);q.reveal=false;q.teams.forEach(t=>t.vote='');q.seconds=quiz.rules.defaultSeconds;q.running=false;stopTimer();persistQuiz();renderQuiz(panel,ctx);});
  }

  function bindPanel(panel,ctx){
    bindQuiz(panel,ctx);
    panel.querySelector('[data-quiz-timer]')?.addEventListener('click',()=>{const q=quizState(ctx);if(q.running){q.running=false;stopTimer();persistQuiz();panel.querySelector('[data-quiz-timer]').textContent='Start timer';}else startTimer(panel,ctx);});
    panel.querySelector('[data-quiz-reset]')?.addEventListener('click',()=>{stopTimer();quizStore[ctx.key]=defaultQuiz(ctx);persistQuiz();const parent=panel.parentElement;panel.outerHTML=phase23Html(ctx);const replacement=parent?.querySelector(`[data-phase23-team-quiz][data-lesson-id="${ctx.key.replace(/"/g,'\\"')}"]`)||parent?.querySelector('[data-phase23-team-quiz]');if(replacement)bindPanel(replacement,ctx);});
  }

  function bindExpert(panel,ctx){
    panel.querySelectorAll('[data-expert-save]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.expertSave,area=panel.querySelector(`[data-expert-response="${id}"]`);expertStore[ctx.key]||={};expertStore[ctx.key][id]=area?.value||'';save(EXPERT_KEY,expertStore);}));
    panel.querySelectorAll('[data-expert-note]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.expertNote,challenge=ctx.model.overhaul24.challenges.find(x=>x.id===id),area=panel.querySelector(`[data-expert-response="${id}"]`),text=(area?.value||'').trim();if(!text)return;window.GCSE_COURSE_POLISH?.addNote?.(`${challenge?.label||'Expert challenge'} · ${ctx.title}\n${text}`,`${ctx.title} · expert challenge`,'expert-challenge');}));
  }

  function inject(deck){
    const ctx=context(deck);if(!ctx)return;ctx.deck=deck;const parent=deck.parentElement;if(!parent)return;
    let quiz=parent.querySelector('[data-phase23-team-quiz]');if(!quiz){const anchor=parent.querySelector('.targeted-mastery-plan')||parent.querySelector('.lesson-presentation-mastery')||deck;anchor.insertAdjacentHTML('afterend',phase23Html(ctx));quiz=anchor.nextElementSibling;bindPanel(quiz,ctx);}
    const unlocked=String(masteryState(ctx).unlocked);let expert=parent.querySelector('[data-phase24-expert]');const html=phase24Html(ctx);if(!expert){quiz.insertAdjacentHTML('afterend',html);expert=quiz.nextElementSibling;}else if(expert.dataset.lessonKey!==ctx.key||expert.dataset.unlock!==unlocked){expert.outerHTML=html;expert=quiz.nextElementSibling;}
    bindExpert(expert,ctx);
  }

  function refreshExpert(deck){const ctx=context(deck);if(!ctx)return;const parent=deck.parentElement,quiz=parent?.querySelector('[data-phase23-team-quiz]'),old=parent?.querySelector('[data-phase24-expert]');if(!quiz)return;const html=phase24Html(ctx);if(old)old.outerHTML=html;else quiz.insertAdjacentHTML('afterend',html);const expert=quiz.nextElementSibling;bindExpert(expert,ctx);}
  function scan(){if(state.activeTab!=='lessons')return;document.querySelectorAll('.lesson-presentation').forEach(inject);}

  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-mastery-state]'))setTimeout(()=>document.querySelectorAll('.lesson-presentation').forEach(refreshExpert),0);});
  window.addEventListener('storage',e=>{if(e.key===MASTERY_KEY)document.querySelectorAll('.lesson-presentation').forEach(refreshExpert);});
  requestAnimationFrame(scan);
  window.GCSE_LESSON_OVERHAUL_PHASE2324_UI={scan,inject,refreshExpert,masteryState};
})();

(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const MODE_KEY='gcse-science-presentation-mode-v1';
  const timers=new WeakMap();
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const slideType=slide=>[...slide.classList].find(c=>c.startsWith('slide-'))?.replace('slide-','')||'slide';
  function contextFor(deck){
    const topic=activeTopic();if(!topic)return null;
    const title=deck.dataset.lessonTitle||deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    const plan=window.GCSE_LESSON_MODE_PLANS?.build?.(model);if(!plan)return null;
    return{topic,title,index,lesson,model,plan};
  }
  function currentSlide(deck){return deck.querySelector('.presentation-slide.active')||deck.querySelector('.presentation-slide:not([hidden])');}
  function format(seconds){seconds=Math.max(0,Math.round(seconds));const m=Math.floor(seconds/60),s=seconds%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function setTimer(deck,seconds){
    const old=timers.get(deck);if(old?.id)clearInterval(old.id);
    timers.set(deck,{remaining:seconds,running:false,id:null});
    const display=deck.querySelector('[data-teacher-timer-display]');if(display)display.textContent=format(seconds);
    deck.querySelector('[data-teacher-timer-start]')?.classList.remove('active');
  }
  function toggleTimer(deck){
    let t=timers.get(deck)||{remaining:300,running:false,id:null};
    if(t.running){clearInterval(t.id);t.id=null;t.running=false;timers.set(deck,t);deck.querySelector('[data-teacher-timer-start]').textContent='Start';return;}
    if(t.remaining<=0)t.remaining=300;
    t.running=true;deck.querySelector('[data-teacher-timer-start]').textContent='Pause';
    t.id=setInterval(()=>{
      t.remaining=Math.max(0,t.remaining-1);const display=deck.querySelector('[data-teacher-timer-display]');if(display)display.textContent=format(t.remaining);
      if(t.remaining<=0){clearInterval(t.id);t.id=null;t.running=false;deck.classList.add('teacher-time-up');deck.querySelector('[data-teacher-timer-start]').textContent='Start';setTimeout(()=>deck.classList.remove('teacher-time-up'),1500);}
    },1000);timers.set(deck,t);
  }
  function revealCurrent(deck){
    const slide=currentSlide(deck);if(!slide)return;
    slide.classList.add('teacher-reveal-current');
    slide.querySelectorAll('details').forEach(d=>d.open=true);
    slide.querySelectorAll('[data-question-mark-points],[data-whiteboard-model],[data-exam-marking],[data-exam-model]').forEach(el=>el.hidden=false);
    slide.querySelectorAll('.step-hidden').forEach(el=>el.classList.remove('step-hidden'));
    slide.querySelectorAll('.presentation-term-grid article').forEach(el=>el.classList.add('revealed'));
  }
  function hideCurrent(deck){
    const slide=currentSlide(deck);if(!slide)return;
    slide.classList.remove('teacher-reveal-current');
    slide.querySelectorAll('details').forEach(d=>d.open=false);
    slide.querySelectorAll('[data-question-mark-points],[data-whiteboard-model],[data-exam-marking],[data-exam-model]').forEach(el=>el.hidden=true);
    slide.querySelectorAll('.presentation-term-grid article').forEach(el=>el.classList.remove('revealed'));
  }
  function updateConsole(deck,ctx){
    const slide=currentSlide(deck);if(!slide)return;
    const type=slideType(slide),phase=ctx.plan.phaseFor(type),prompt=ctx.plan.teacher.prompts[phase]||ctx.plan.teacher.prompts.teach;
    const current=Number(deck.dataset.slide||0)+1,total=deck.querySelectorAll('.presentation-slide').length;
    const mins=ctx.plan.timing[phase]||3;
    const title=slide.querySelector('.presentation-slide-heading h2,.presentation-title-copy h2,h2')?.textContent?.trim()||`Slide ${current}`;
    const phaseEl=deck.querySelector('[data-teacher-current]');if(phaseEl)phaseEl.innerHTML=`<span>${esc(phase)} · slide ${current}/${total}</span><strong>${esc(title)}</strong><p>${esc(prompt)}</p><small>Suggested pace: about ${mins} min on this slide.</small>`;
    const pace=deck.querySelector('[data-teacher-pace]');if(pace){const estimate=[...deck.querySelectorAll('.presentation-slide')].reduce((n,s)=>n+(ctx.plan.timing[ctx.plan.phaseFor(slideType(s))]||3),0);pace.textContent=`Deck pacing guide: ${estimate} min total`;}
  }
  function questionPrompt(deck,ctx){
    const prompts=ctx.plan.teacher.questioning;const out=deck.querySelector('[data-teacher-question-output]');if(!out)return;
    const previous=Number(out.dataset.index||-1);const next=(previous+1)%prompts.length;out.dataset.index=String(next);out.textContent=prompts[next];
  }
  function boardHtml(ctx){return `<section class="teacher-board" data-teacher-board hidden><div class="teacher-board-head"><div><span class="eyebrow">Quick whiteboard</span><h2>${esc(ctx.title)}</h2></div><div><button type="button" data-teacher-board-clear>Clear</button><button type="button" data-teacher-board-close>Close</button></div></div><p data-teacher-board-prompt>${esc(ctx.plan.teacher.questioning[0])}</p><textarea rows="8" placeholder="Write or type key ideas here for the class…"></textarea></section>`;}
  function consoleHtml(ctx,deck){
    const slides=[...deck.querySelectorAll('.presentation-slide')];const estimate=slides.reduce((n,s)=>n+(ctx.plan.timing[ctx.plan.phaseFor(slideType(s))]||3),0);
    return `<section class="teacher-console" data-teacher-console><div class="teacher-console-head"><div><span class="eyebrow">Teacher presenter mode</span><h3>Classroom controls</h3><p data-teacher-pace>Deck pacing guide: ${estimate} min total</p></div><button type="button" data-teacher-console-collapse>Hide tools</button></div><div class="teacher-console-grid"><article class="teacher-current-card" data-teacher-current></article><article class="teacher-timer-card"><strong>Lesson timer</strong><div class="teacher-timer-display" data-teacher-timer-display>05:00</div><div class="teacher-timer-presets"><button type="button" data-teacher-preset="120">2 min</button><button type="button" data-teacher-preset="300">5 min</button><button type="button" data-teacher-preset="600">10 min</button></div><div><button type="button" data-teacher-timer-start>Start</button><button type="button" data-teacher-timer-reset>Reset</button></div></article><article class="teacher-question-card"><strong>Question the class</strong><p data-teacher-question-output data-index="-1">Use this to generate a teaching question for the current lesson.</p><button type="button" data-teacher-question>Next prompt</button></article><article class="teacher-reveal-card"><strong>Presentation actions</strong><div><button type="button" data-teacher-reveal>Reveal current answers</button><button type="button" data-teacher-hide>Hide answers</button><button type="button" data-teacher-board-open>Whiteboard</button><button type="button" data-teacher-presenter-notes>Presenter notes</button></div><small><b>Watch for:</b> ${esc(ctx.plan.teacher.watchFor)}</small></article></div></section>`;
  }
  function bind(deck,ctx){
    setTimer(deck,300);updateConsole(deck,ctx);
    deck.querySelectorAll('[data-teacher-preset]').forEach(btn=>btn.addEventListener('click',()=>setTimer(deck,Number(btn.dataset.teacherPreset))));
    deck.querySelector('[data-teacher-timer-start]')?.addEventListener('click',()=>toggleTimer(deck));
    deck.querySelector('[data-teacher-timer-reset]')?.addEventListener('click',()=>setTimer(deck,300));
    deck.querySelector('[data-teacher-reveal]')?.addEventListener('click',()=>revealCurrent(deck));
    deck.querySelector('[data-teacher-hide]')?.addEventListener('click',()=>hideCurrent(deck));
    deck.querySelector('[data-teacher-question]')?.addEventListener('click',()=>questionPrompt(deck,ctx));
    deck.querySelector('[data-teacher-board-open]')?.addEventListener('click',()=>{const board=deck.querySelector('[data-teacher-board]');if(board){board.hidden=false;board.querySelector('[data-teacher-board-prompt]').textContent=deck.querySelector('[data-teacher-question-output]')?.textContent||ctx.plan.teacher.questioning[0];}});
    deck.querySelector('[data-teacher-board-close]')?.addEventListener('click',()=>deck.querySelector('[data-teacher-board]').hidden=true);
    deck.querySelector('[data-teacher-board-clear]')?.addEventListener('click',()=>{const area=deck.querySelector('[data-teacher-board] textarea');if(area)area.value='';});
    deck.querySelector('[data-teacher-presenter-notes]')?.addEventListener('click',()=>deck.querySelector('[data-presenter-toggle]')?.click());
    deck.querySelector('[data-teacher-console-collapse]')?.addEventListener('click',e=>{const panel=deck.querySelector('[data-teacher-console]');panel.classList.toggle('collapsed');e.currentTarget.textContent=panel.classList.contains('collapsed')?'Show tools':'Hide tools';});
    new MutationObserver(()=>updateConsole(deck,ctx)).observe(deck,{attributes:true,attributeFilter:['data-slide','class']});
  }
  function upgrade(deck){
    if(deck.dataset.phase11Teacher==='done')return;const ctx=contextFor(deck);if(!ctx)return;deck.dataset.phase11Teacher='done';
    const progress=deck.querySelector('.presentation-progress');progress?.insertAdjacentHTML('afterend',consoleHtml(ctx,deck));deck.insertAdjacentHTML('beforeend',boardHtml(ctx));bind(deck,ctx);
  }
  function applyVisibility(){
    const teacher=localStorage.getItem(MODE_KEY)==='teacher';document.querySelectorAll('.lesson-presentation').forEach(deck=>{upgrade(deck);deck.classList.toggle('phase11-teacher-active',teacher);});
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);applyVisibility();}
  document.addEventListener('click',e=>{if(e.target.closest('[data-presentation-mode]'))requestAnimationFrame(applyVisibility);});
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_TEACHER_MODE={scan,upgrade,revealCurrent,hideCurrent,setTimer};
})();
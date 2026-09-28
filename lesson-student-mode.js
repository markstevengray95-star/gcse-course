(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const MODE_KEY='gcse-science-presentation-mode-v1';
  const KEY='gcse-science-student-pathway-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};let saved=parse(localStorage.getItem(KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const slideType=slide=>[...slide.classList].find(c=>c.startsWith('slide-'))?.replace('slide-','')||'slide';
  function contextFor(deck){
    const topic=activeTopic();if(!topic)return null;const title=deck.dataset.lessonTitle||deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    const plan=window.GCSE_LESSON_MODE_PLANS?.build?.(model);if(!plan)return null;
    const diff=window.GCSE_LESSON_DIFFERENTIATION?.build?.(model,topic,topics)||null;
    const key=window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title)}`;
    return{topic,title,index,lesson,model,plan,diff,key};
  }
  function stateFor(ctx){saved[ctx.key]||={done:[],hintIndex:0,updated:Date.now()};return saved[ctx.key];}
  function persist(){localStorage.setItem(KEY,JSON.stringify(saved));}
  function currentSlide(deck){return deck.querySelector('.presentation-slide.active')||deck.querySelector('.presentation-slide:not([hidden])');}
  function nextAction(deck,ctx){
    const slide=currentSlide(deck),type=slide?slideType(slide):'title',phase=ctx.plan.phaseFor(type),i=Number(deck.dataset.slide||0),total=deck.querySelectorAll('.presentation-slide').length;
    if(i<total-1)return ctx.plan.student.actions[phase]||'Complete the current task before moving on.';
    const cp=window.GCSE_STUDY_CHECKPOINTS?.lessonCheckpoint?.(ctx.topic,ctx.title);
    if(!cp)return 'Finish by rating your lesson confidence, then mark each AQA point in the mastery panel.';
    if(cp.confidence<3)return 'Add this lesson to your review plan, then continue to the next unfinished lesson.';
    return 'This lesson is marked secure. Continue to the next unfinished lesson or start exam practice.';
  }
  function update(deck,ctx){
    const st=stateFor(ctx),slides=[...deck.querySelectorAll('.presentation-slide')],i=Math.max(0,Number(deck.dataset.slide)||0),slide=slides[i];if(!slide)return;
    const phase=ctx.plan.phaseFor(slideType(slide)),title=slide.querySelector('.presentation-slide-heading h2,.presentation-title-copy h2,h2')?.textContent?.trim()||`Slide ${i+1}`;
    const done=new Set(st.done||[]),pct=slides.length?Math.round(done.size/slides.length*100):0;
    const current=deck.querySelector('[data-student-current]');if(current)current.innerHTML=`<span>${esc(phase)} · slide ${i+1}/${slides.length}</span><strong>${esc(title)}</strong><p>${esc(ctx.plan.student.actions[phase]||'Complete this stage independently.')}</p>`;
    const progress=deck.querySelector('[data-student-progress]');if(progress)progress.innerHTML=`<strong>${done.size}/${slides.length} stages complete</strong><span>${pct}%</span><i><b style="width:${pct}%"></b></i>`;
    const mark=deck.querySelector('[data-student-stage-done]');if(mark){mark.classList.toggle('active',done.has(i));mark.textContent=done.has(i)?'✓ Stage complete':'Mark stage complete';}
    const next=deck.querySelector('[data-student-next-action]');if(next)next.textContent=nextAction(deck,ctx);
    const resume=deck.querySelector('[data-student-resume]');if(resume)resume.textContent=`Position saved automatically · slide ${i+1}`;
  }
  function toggleDone(deck,ctx){const st=stateFor(ctx),i=Number(deck.dataset.slide||0),set=new Set(st.done||[]);set.has(i)?set.delete(i):set.add(i);st.done=[...set].sort((a,b)=>a-b);st.updated=Date.now();persist();update(deck,ctx);}
  function showHint(deck,ctx){
    const st=stateFor(ctx),hints=ctx.plan.student.hints;const box=deck.querySelector('[data-student-hint-box]');if(!box)return;
    const hint=hints[st.hintIndex%hints.length];st.hintIndex=(st.hintIndex+1)%hints.length;st.updated=Date.now();persist();box.hidden=false;box.innerHTML=`<strong>Hint</strong><p>${esc(hint)}</p><small>Try again before revealing model guidance.</small>`;
  }
  function saveKeyIdea(deck,ctx){
    const slide=currentSlide(deck);if(!slide)return;const heading=slide.querySelector('.presentation-slide-heading h2,.presentation-title-copy h2,h2')?.textContent?.trim()||ctx.title;
    const lead=slide.querySelector('.presentation-lead,.spec-depth-card p,.teaching-chunk-card p,.presentation-callout p')?.textContent?.trim()||slide.innerText?.replace(/\n{2,}/g,'\n').slice(0,500);
    if(lead)window.GCSE_COURSE_POLISH?.addNote?.(`${heading}\n${lead}`,`${ctx.title} · key idea`,'student-pathway');
  }
  function openSupport(deck){const btn=deck.querySelector('[data-diff-mode="support"]');btn?.click();}
  function panelHtml(ctx){return `<section class="student-pathway" data-student-pathway><div class="student-pathway-head"><div><span class="eyebrow">Student self-paced mode</span><h3>Work through one stage at a time</h3><small data-student-resume>Position saved automatically</small></div><div class="student-stage-progress" data-student-progress></div></div><div class="student-pathway-grid"><article data-student-current></article><article><strong>Need help?</strong><p>Use one hint, then attempt the task again before opening model guidance.</p><div><button type="button" data-student-hint>Give me a hint</button><button type="button" data-student-support>Use Support mode</button></div><div class="student-hint-box" data-student-hint-box hidden></div></article><article><strong>Capture your learning</strong><p>Save the current slide's main scientific idea into your Science Notebook.</p><button type="button" data-student-save>＋ Save key idea</button></article><article><strong>What should I do next?</strong><p data-student-next-action></p><div><button type="button" data-student-stage-done>Mark stage complete</button><button type="button" data-student-mastery>Lesson mastery</button></div></article></div></section>`;}
  function finishHtml(ctx){return `<section class="student-finish-card" data-student-finish><span class="eyebrow">Finish this lesson</span><h3>Prove it before moving on</h3><div class="student-finish-grid"><article><span>1</span><strong>Check the specification</strong><p>Can you explain every AQA ${esc(ctx.model.ref)} point without notes?</p><button type="button" data-finish-mastery>Open mastery</button></article><article><span>2</span><strong>Check your evidence</strong><p>Self-mark the lesson questions and Exam Studio answers you attempted.</p><button type="button" data-finish-exam>Review exam answers</button></article><article><span>3</span><strong>Set confidence</strong><p>Use the end-of-lesson checkpoint below: Review, Developing or Secure.</p><button type="button" data-finish-checkpoint>Go to confidence check</button></article><article><span>4</span><strong>Continue</strong><p>Move to the next lesson when you can explain and apply the core science.</p><button type="button" data-finish-next>Mark complete & next</button></article></div></section>`;}
  function bind(deck,ctx){
    deck.querySelector('[data-student-stage-done]')?.addEventListener('click',()=>toggleDone(deck,ctx));
    deck.querySelector('[data-student-hint]')?.addEventListener('click',()=>showHint(deck,ctx));
    deck.querySelector('[data-student-support]')?.addEventListener('click',()=>openSupport(deck));
    deck.querySelector('[data-student-save]')?.addEventListener('click',()=>saveKeyIdea(deck,ctx));
    deck.querySelector('[data-student-mastery]')?.addEventListener('click',()=>deck.parentElement?.querySelector('[data-presentation-mastery]')?.scrollIntoView({behavior:'smooth',block:'start'}));
    deck.querySelector('[data-finish-mastery]')?.addEventListener('click',()=>deck.parentElement?.querySelector('[data-presentation-mastery]')?.scrollIntoView({behavior:'smooth',block:'start'}));
    deck.querySelector('[data-finish-exam]')?.addEventListener('click',()=>deck.querySelector('[data-exam-studio]')?.scrollIntoView({behavior:'smooth',block:'start'}));
    deck.querySelector('[data-finish-checkpoint]')?.addEventListener('click',()=>document.querySelector('.lesson-checkpoint')?.scrollIntoView({behavior:'smooth',block:'start'}));
    deck.querySelector('[data-finish-next]')?.addEventListener('click',()=>document.querySelector('.lesson-sequence-nav [data-lesson-nav="complete"]')?.click());
    new MutationObserver(()=>update(deck,ctx)).observe(deck,{attributes:true,attributeFilter:['data-slide','class']});update(deck,ctx);
  }
  function upgrade(deck){
    if(deck.dataset.phase12Student==='done')return;const ctx=contextFor(deck);if(!ctx)return;deck.dataset.phase12Student='done';
    const progress=deck.querySelector('.presentation-progress');progress?.insertAdjacentHTML('afterend',panelHtml(ctx));const plenary=deck.querySelector('.slide-plenary');if(plenary&&!plenary.querySelector('[data-student-finish]'))plenary.insertAdjacentHTML('beforeend',finishHtml(ctx));bind(deck,ctx);
  }
  function applyVisibility(){const student=localStorage.getItem(MODE_KEY)!=='teacher';document.querySelectorAll('.lesson-presentation').forEach(deck=>{upgrade(deck);deck.classList.toggle('phase12-student-active',student);});}
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);applyVisibility();}
  document.addEventListener('click',e=>{if(e.target.closest('[data-presentation-mode]'))requestAnimationFrame(applyVisibility);});
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_STUDENT_MODE={scan,upgrade,update,state:()=>saved};
})();
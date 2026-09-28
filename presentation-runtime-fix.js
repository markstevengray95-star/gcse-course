(() => {
  const API=()=>window.GCSE_PRESENTATION_LESSONS;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mounting=false;

  function openLessonContext(){
    if(typeof state==='undefined'||typeof topics==='undefined'||state.activeTab!=='lessons'||state.activeLessonIndex<0)return null;
    const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return null;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons.filter(([,scope])=>state.mode==='triple'||scope!=='triple');
    if(!lessons.length)return null;
    const index=Math.max(0,Math.min(state.activeLessonIndex,lessons.length-1));
    const title=lessons[index]?.[0];
    const cards=[...document.querySelectorAll('#topicContent .lesson-card')];
    const expandedCards=cards.filter(card=>card.querySelector('.lesson-expanded'));
    const card=cards[index]?.querySelector('.lesson-expanded')?cards[index]:expandedCards[0];
    const expanded=card?.querySelector('.lesson-expanded');
    const lesson=title?window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index):null;
    return title&&card&&expanded&&lesson?{topic,lessons,index,title,card,expanded,lesson}:null;
  }

  function bindFallback(deck,notes){
    const api=API();
    const show=i=>api?.showSlide?.(deck,i);
    deck.querySelector('[data-slide-prev]')?.addEventListener('click',()=>show(Number(deck.dataset.slide||0)-1));
    deck.querySelector('[data-slide-next]')?.addEventListener('click',()=>show(Number(deck.dataset.slide||0)+1));
    deck.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.addEventListener('click',()=>show(Number(btn.dataset.slideJump))));
    deck.querySelector('[data-presentation-fullscreen]')?.addEventListener('click',()=>deck.requestFullscreen?.());
    deck.querySelector('[data-presentation-notes]')?.addEventListener('click',()=>{notes.open=!notes.open;if(notes.open)notes.scrollIntoView({behavior:'smooth',block:'start'});});
    deck.querySelector('[data-presentation-save]')?.addEventListener('click',()=>{
      const current=deck.querySelector('.presentation-slide.active')||deck.querySelector('.presentation-slide:not([hidden])');
      const text=current?.innerText?.replace(/\n{3,}/g,'\n\n').trim();
      if(text)window.GCSE_COURSE_POLISH?.addNote?.(text,`${deck.dataset.lessonTitle} · presentation slide`,'presentation');
    });
  }

  function mountFallback(ctx){
    const api=API();if(!api?.slideDeck||ctx.card.querySelector('.lesson-presentation'))return false;
    const slides=api.slideDeck(ctx.topic,ctx.title,ctx.index,ctx.lesson);if(!slides?.length)return false;
    const deck=document.createElement('section');
    deck.className=`lesson-presentation ${ctx.topic.subject} presentation-runtime-mounted`;
    deck.dataset.lessonKey=`lesson:${ctx.topic.id}:${encodeURIComponent(ctx.title)}`;
    deck.dataset.lessonTitle=ctx.title;deck.dataset.slide='0';deck.dataset.presentationRuntime='fallback';
    deck.innerHTML=`<div class="presentation-runtime-banner"><strong>Presentation mode</strong><span>${slides.length} interactive slides · ${esc(ctx.title)}</span></div><div class="presentation-toolbar"><div><span class="eyebrow">Lesson presentation</span><strong>${esc(ctx.title)}</strong></div><div class="presentation-toolbar-actions"><button type="button" data-presentation-save>＋ Notebook</button><button type="button" data-presentation-notes>Full notes</button><button type="button" data-presentation-fullscreen>Present ⛶</button></div></div><div class="presentation-progress"><i></i></div><div class="presentation-stage">${slides.map((slide,i)=>`<article class="presentation-slide slide-${esc(slide.type)}" data-slide-index="${i}" ${i?'hidden':''}>${slide.html}</article>`).join('')}</div><div class="presentation-bottom"><button type="button" data-slide-prev>← Previous</button><div class="presentation-dots">${slides.map((slide,i)=>`<button type="button" data-slide-jump="${i}" aria-label="Go to ${esc(slide.label)}" title="${esc(slide.label)}"><span></span></button>`).join('')}</div><span class="presentation-count">1 / ${slides.length}</span><button type="button" data-slide-next>Next →</button></div><div class="presentation-keyboard-hint">Use Previous / Next or the slide dots · Present opens fullscreen</div>`;
    const notes=document.createElement('details');notes.className='presentation-full-notes';notes.innerHTML='<summary>Full lesson notes & all learning activities</summary>';
    ctx.expanded.parentNode.insertBefore(deck,ctx.expanded);ctx.expanded.parentNode.insertBefore(notes,ctx.expanded);notes.appendChild(ctx.expanded);
    bindFallback(deck,notes);api.showSlide?.(deck,0);
    return true;
  }

  function ensurePresentation(){
    if(mounting)return;const ctx=openLessonContext();if(!ctx)return;
    if(ctx.card.querySelector('.lesson-presentation'))return;
    mounting=true;
    try{API()?.enhanceOpenLesson?.();}catch(err){console.warn('Presentation enhancer retry failed:',err);}
    requestAnimationFrame(()=>{
      try{
        const fresh=openLessonContext();if(fresh&&!fresh.card.querySelector('.lesson-presentation'))mountFallback(fresh);
      }catch(err){console.error('Presentation fallback mount failed:',err);}
      finally{mounting=false;}
    });
  }

  if(typeof renderTopic==='function'){
    const baseRenderTopic=renderTopic;
    renderTopic=function(){baseRenderTopic();requestAnimationFrame(()=>requestAnimationFrame(ensurePresentation));};
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-lesson],[data-queue-lesson],[data-lesson-nav]'))setTimeout(ensurePresentation,0);
  });
  const root=document.getElementById('topicContent');
  if(root)new MutationObserver(()=>ensurePresentation()).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(ensurePresentation,0));
  window.GCSE_PRESENTATION_RUNTIME_FIX={ensurePresentation,mountFallback,openLessonContext};
})();

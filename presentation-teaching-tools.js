(() => {
  if(typeof renderTopic!=='function'||typeof topics==='undefined'||typeof state==='undefined') return;

  const VISITED_KEY='gcse-science-presentation-visited-v1';
  const MASTERY_KEY='gcse-science-presentation-mastery-v1';
  const parse=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  let visited=parse(VISITED_KEY),mastery=parse(MASTERY_KEY);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);

  function modelFor(deck){
    const topic=activeTopic();if(!topic||!deck)return null;
    const title=deck.dataset.lessonTitle||'';
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const index=Math.max(0,lessons.findIndex(([name])=>name===title));
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);
    return window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson)||null;
  }

  function slideType(slide){
    return [...slide.classList].find(c=>c.startsWith('slide-'))?.replace('slide-','')||'slide';
  }
  function phaseFor(type){
    if(['title','retrieval','objectives'].includes(type))return ['Ready','Prepare'];
    if(['teach','specpoint','terms','worked'].includes(type))return ['Learn','Teach'];
    if(['practice'].includes(type))return ['Practise','Apply'];
    if(['spec','exam'].includes(type))return ['Check','Assess'];
    return ['Review','Reflect'];
  }
  function slideLabel(slide,index){
    return slide.querySelector('.presentation-slide-heading h2,.presentation-title-copy h2,h2')?.textContent?.trim()||`Slide ${index+1}`;
  }

  function jumpTo(deck,index){
    const dot=deck.querySelector(`[data-slide-jump="${index}"]`);
    if(dot)dot.click();
  }

  function markVisited(deck,index){
    const id=deck.dataset.presentationId||deck.dataset.lessonKey;if(!id)return;
    const list=new Set(visited[id]||[]);list.add(index);visited[id]=[...list].sort((a,b)=>a-b);save(VISITED_KEY,visited);
  }

  function updateDeckTools(deck){
    const slides=[...deck.querySelectorAll('.presentation-slide')];if(!slides.length)return;
    const index=Math.max(0,Number(deck.dataset.slide)||0);markVisited(deck,index);
    const id=deck.dataset.presentationId||deck.dataset.lessonKey,seen=new Set(visited[id]||[]);
    const map=deck.querySelector('[data-slide-map]');
    map?.querySelectorAll('[data-map-jump]').forEach(btn=>{
      const i=Number(btn.dataset.mapJump);btn.classList.toggle('active',i===index);btn.classList.toggle('visited',seen.has(i));
      btn.setAttribute('aria-current',i===index?'step':'false');
    });
    const phase=phaseFor(slideType(slides[index]));
    const phaseEl=deck.querySelector('[data-presentation-phase]');if(phaseEl)phaseEl.innerHTML=`<strong>${phase[0]}</strong><span>${phase[1]}</span>`;
    const covered=deck.querySelector('[data-slides-covered]');if(covered)covered.textContent=`${seen.size}/${slides.length} slides visited`;
    updatePresenterNotes(deck,slides[index],modelFor(deck));
  }

  function presenterNotesHtml(model){
    if(!model)return '';
    return `<aside class="presenter-notes" data-presenter-notes hidden>
      <div class="presenter-notes-head"><div><span class="eyebrow">Presenter notes</span><h3>${esc(model.title)}</h3></div><button type="button" data-close-presenter aria-label="Close presenter notes">×</button></div>
      <div data-presenter-dynamic></div>
      <div class="presenter-note-grid">
        <article><strong>Core explanation</strong><p>${esc(model.coreExplanation)}</p></article>
        <article><strong>Watch for</strong><p>${esc(model.misconception)}</p></article>
        <article><strong>Exam cue</strong><p>${esc(model.examTip)}</p></article>
        ${model.practical?`<article><strong>Practical connection</strong><p>${esc(model.practical)}</p><small>Use the school's approved practical method, supervision and risk assessment.</small></article>`:''}
      </div>
    </aside>`;
  }

  function updatePresenterNotes(deck,slide,model){
    const target=deck.querySelector('[data-presenter-dynamic]');if(!target||!slide||!model)return;
    const type=slideType(slide),phase=phaseFor(type);
    const prompts={
      retrieval:'Ask students to answer silently first, then compare reasoning before revealing responses.',
      objectives:'Make the success criteria explicit. Return to these points at the end of the lesson.',
      teach:'Model the causal chain or scientific relationship aloud and connect each step to precise vocabulary.',
      specpoint:'Ask for a student explanation, then test the same idea in an unfamiliar context.',
      terms:'Cold-call definitions, then require each term to be used correctly in a full scientific sentence.',
      worked:'Reveal one step at a time and ask students to predict the next step before showing it.',
      practice:'Give thinking time before feedback. Look for misconceptions rather than just final answers.',
      spec:'Use the checklist as a live coverage check and revisit any point students cannot explain unaided.',
      exam:'Focus feedback on the command word, scientific precision and explicit links to the question context.',
      plenary:'Use this as an exit check. Any weak specification point should be added to the student review queue.'
    };
    target.innerHTML=`<div class="presenter-current"><span>${esc(phase[0])} · ${esc(slideLabel(slide,Number(slide.dataset.slideIndex)||0))}</span><p>${esc(prompts[type]||'Check understanding before moving on and make the scientific reasoning explicit.')}</p></div>`;
  }

  function slideMapHtml(deck){
    const slides=[...deck.querySelectorAll('.presentation-slide')];
    return `<section class="presentation-slide-map" data-slide-map hidden><div class="slide-map-head"><div><span class="eyebrow">Lesson overview</span><h3>Jump to any slide</h3></div><span data-slides-covered>0/${slides.length} slides visited</span></div><div class="slide-map-grid">${slides.map((slide,i)=>{const type=slideType(slide),phase=phaseFor(type);return `<button type="button" data-map-jump="${i}"><span>${i+1}</span><div><small>${esc(phase[0])}</small><strong>${esc(slideLabel(slide,i))}</strong></div><i aria-hidden="true">✓</i></button>`}).join('')}</div></section>`;
  }

  function masteryHtml(model){
    if(!model?.specificationPoints?.length)return '';
    return `<section class="lesson-presentation-mastery" data-presentation-mastery data-presentation-id="${esc(model.id)}">
      <div class="presentation-mastery-head"><div><span class="eyebrow">Lesson mastery</span><h3>AQA ${esc(model.ref)} · what can you do now?</h3><p>Rate each specification point separately. This is a study-confidence record, not an exam grade.</p></div><div class="presentation-mastery-score" data-mastery-score>0/${model.specificationPoints.length} secure</div></div>
      <div class="presentation-mastery-points">${model.specificationPoints.map((point,i)=>`<article data-mastery-point="${i}"><div><span>${i+1}</span><p>${esc(point.text)}</p></div><div class="mastery-state-buttons"><button type="button" data-mastery-state="review">Review</button><button type="button" data-mastery-state="developing">Developing</button><button type="button" data-mastery-state="secure">Secure</button></div></article>`).join('')}</div>
      <div class="presentation-mastery-actions"><button type="button" data-save-review-plan>＋ Save review plan to notebook</button><small data-mastery-message></small></div>
    </section>`;
  }

  function applyMastery(panel,model){
    const id=model.id,stateMap=mastery[id]||{};
    panel.querySelectorAll('[data-mastery-point]').forEach(row=>{
      const idx=row.dataset.masteryPoint,current=stateMap[idx]||'';row.dataset.state=current;
      row.querySelectorAll('[data-mastery-state]').forEach(btn=>btn.classList.toggle('active',btn.dataset.masteryState===current));
    });
    const secure=Object.values(stateMap).filter(v=>v==='secure').length;
    const score=panel.querySelector('[data-mastery-score]');if(score)score.textContent=`${secure}/${model.specificationPoints.length} secure`;
    const msg=panel.querySelector('[data-mastery-message]');if(msg)msg.textContent=secure===model.specificationPoints.length?'All mapped AQA points marked secure.':`${model.specificationPoints.length-secure} point${model.specificationPoints.length-secure===1?'':'s'} still to secure.`;
  }

  function bindMastery(panel,model){
    panel.querySelectorAll('[data-mastery-state]').forEach(btn=>btn.addEventListener('click',()=>{
      const row=btn.closest('[data-mastery-point]'),idx=row.dataset.masteryPoint;
      mastery[model.id]||={};mastery[model.id][idx]=btn.dataset.masteryState;save(MASTERY_KEY,mastery);applyMastery(panel,model);
    }));
    panel.querySelector('[data-save-review-plan]')?.addEventListener('click',()=>{
      const states=mastery[model.id]||{};
      const lines=model.specificationPoints.map((p,i)=>`${states[i]==='secure'?'✓':'•'} ${p.text} — ${states[i]||'not rated'}`);
      window.GCSE_COURSE_POLISH?.addNote?.(`AQA ${model.ref} · ${model.title}\n\n${lines.join('\n')}`,`${model.title} · AQA review plan`,'presentation-mastery');
    });
    applyMastery(panel,model);
  }

  function enhanceDeck(deck){
    if(!deck||deck.dataset.teachingTools==='true')return;deck.dataset.teachingTools='true';
    const model=modelFor(deck);if(!model)return;
    const toolbar=deck.querySelector('.presentation-toolbar-actions');
    if(toolbar){
      const overview=document.createElement('button');overview.type='button';overview.dataset.presentationOverview='';overview.textContent='Slides';toolbar.prepend(overview);
      const presenter=document.createElement('button');presenter.type='button';presenter.dataset.presenterToggle='';presenter.textContent='Presenter notes';toolbar.prepend(presenter);
    }
    deck.querySelector('.presentation-progress')?.insertAdjacentHTML('afterend','<div class="presentation-phase" data-presentation-phase><strong>Ready</strong><span>Prepare</span></div>');
    deck.querySelector('.presentation-stage')?.insertAdjacentHTML('beforebegin',slideMapHtml(deck));
    deck.insertAdjacentHTML('beforeend',presenterNotesHtml(model));
    const map=deck.querySelector('[data-slide-map]'),notes=deck.querySelector('[data-presenter-notes]');
    deck.querySelector('[data-presentation-overview]')?.addEventListener('click',()=>{map.hidden=!map.hidden;if(!map.hidden)map.scrollIntoView({behavior:'smooth',block:'nearest'});});
    deck.querySelector('[data-presenter-toggle]')?.addEventListener('click',()=>{notes.hidden=!notes.hidden;});
    deck.querySelector('[data-close-presenter]')?.addEventListener('click',()=>{notes.hidden=true;});
    map?.querySelectorAll('[data-map-jump]').forEach(btn=>btn.addEventListener('click',()=>{jumpTo(deck,Number(btn.dataset.mapJump));map.hidden=true;}));
    const observer=new MutationObserver(()=>updateDeckTools(deck));observer.observe(deck,{attributes:true,attributeFilter:['data-slide']});
    const id=deck.dataset.presentationId||deck.dataset.lessonKey;visited[id]||=[];updateDeckTools(deck);

    const existing=deck.parentElement?.querySelector('.lesson-presentation-mastery');
    if(!existing){
      deck.insertAdjacentHTML('afterend',masteryHtml(model));
      const panel=deck.nextElementSibling;if(panel?.matches('[data-presentation-mastery]'))bindMastery(panel,model);
    }
  }

  function enhance(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    document.querySelectorAll('#topicContent .lesson-presentation').forEach(enhanceDeck);
  }

  const previousRenderTopic=renderTopic;
  renderTopic=function(){previousRenderTopic();requestAnimationFrame(()=>requestAnimationFrame(enhance));};
  if(!document.getElementById('topicView')?.hidden)requestAnimationFrame(()=>requestAnimationFrame(enhance));

  window.GCSE_PRESENTATION_TEACHING_TOOLS={enhance,enhanceDeck,phaseFor,modelFor,keys:{VISITED_KEY,MASTERY_KEY}};
})();
(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;

  const POS_KEY='gcse-science-presentation-position-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let positions=parse(localStorage.getItem(POS_KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const stableKey=(topic,title)=>window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title||'untitled')}`;

  function subjectName(topic){return window.GCSE_COURSE_DATA?.subjects?.find(s=>s.id===topic.subject)?.name||topic.subject;}
  function lessonData(topic,title,index){return window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;}
  function lessonMeta(lesson){return lesson?.biologyMeta||lesson?.chemistryMeta||lesson?.physicsMeta||null;}

  function visualFor(topic,index,title){
    const textbook=window.GCSE_TEXTBOOK_ENHANCEMENTS;
    const plan=textbook?.diagramPlan?.[topic.id]||[];
    if(!plan.length||typeof textbook?.visual!=='function') return `<div class="presentation-fallback-visual"><span>${topic.subject==='biology'?'🧬':topic.subject==='chemistry'?'⚗️':'⚡'}</span><strong>${esc(topic.title)}</strong></div>`;
    const words=String(title||'').toLowerCase().split(/\W+/).filter(w=>w.length>3);
    const found=plan.find(([,label])=>words.some(w=>String(label).toLowerCase().includes(w)))||plan[index%plan.length];
    return `<div class="presentation-diagram">${textbook.visual(found[0],found[1])}<small>${esc(found[1])}</small></div>`;
  }

  function list(items,cls='presentation-bullets'){
    return `<ul class="${cls}">${(items||[]).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  }

  function slideDeck(topic,title,index,lesson){
    const meta=lessonMeta(lesson),seq=lesson.sequence||{},focus=meta?.focus||lesson.objectives||[];
    const terms=(lesson.terms||[]).slice(0,6);
    const worked=lesson.worked||seq.worked;
    const core=lesson.depth?.explanation||lesson.section?.[1]||topic.summary;
    const misconception=lesson.depth?.misconception||seq.misconception||'Use precise scientific language and link each statement to the evidence or process in the question.';
    const application=lesson.depth?.application||seq.application||`Apply ${title.toLowerCase()} to an unfamiliar GCSE context.`;
    const equations=meta?.equations||[];
    const slides=[
      {type:'title',label:'Start',html:`<div class="presentation-title-copy"><span class="presentation-kicker">${esc(topic.code)} · ${esc(subjectName(topic))}${meta?.ref?` · AQA ${esc(meta.ref)}`:''}</span><h2>${esc(title)}</h2><p>${esc(topic.summary)}</p><div class="presentation-title-tags"><span>Lesson ${index+1}</span><span>${esc(seq.duration||'50–60 min')}</span>${meta?.tier==='higher'?'<span>Higher Tier</span>':''}${meta?.scope==='triple'?'<span>Separate Science</span>':''}</div></div>${visualFor(topic,index,title)}`},
      {type:'objectives',label:'Objectives',html:`<div class="presentation-slide-heading"><span>01</span><div><small>Learning objectives</small><h2>What you need to know</h2></div></div>${list(focus.length?focus:lesson.objectives)}<div class="presentation-callout"><strong>By the end</strong><p>You should be able to explain these ideas without notes and apply them to a new GCSE-style example.</p></div>`},
      {type:'teach',label:'Teach',html:`<div class="presentation-slide-heading"><span>02</span><div><small>Core teaching</small><h2>The big idea</h2></div></div><div class="presentation-teach-grid"><div><p class="presentation-lead">${esc(core)}</p>${seq.teach?.slice(1,3).map(([h,p])=>`<section><strong>${esc(h)}</strong><p>${esc(p)}</p></section>`).join('')||''}</div>${visualFor(topic,index+1,title)}</div>`},
      {type:'terms',label:'Vocabulary',html:`<div class="presentation-slide-heading"><span>03</span><div><small>Scientific language</small><h2>Key terminology</h2></div></div><div class="presentation-term-grid">${terms.map(([term,definition])=>`<article><strong>${esc(term)}</strong><p>${esc(definition)}</p></article>`).join('')}</div><div class="presentation-callout"><strong>Presentation challenge</strong><p>Explain the lesson idea aloud using at least three of these terms accurately.</p></div>`},
      {type:'worked',label:'Worked example',html:`<div class="presentation-slide-heading"><span>04</span><div><small>Model the thinking</small><h2>${esc(worked?.title||'Worked example')}</h2></div></div>${worked?`<div class="presentation-worked"><p class="presentation-question">${esc(worked.question)}</p><ol>${worked.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`:`<p class="presentation-lead">${esc(seq.guided||application)}</p>`}${equations.length?`<div class="presentation-equations">${equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}`},
      {type:'practice',label:'Practice',html:`<div class="presentation-slide-heading"><span>05</span><div><small>Guided → independent</small><h2>Now you try</h2></div></div><div class="presentation-practice-grid"><article><strong>Guided practice</strong><p>${esc(seq.guided||application)}</p></article><article><strong>Independent practice</strong>${list(seq.independent||[application])}</article></div><div class="presentation-callout"><strong>Apply it</strong><p>${esc(application)}</p></div>`},
      {type:'spec',label:'AQA coverage',html:`<div class="presentation-slide-heading"><span>06</span><div><small>Specification coverage</small><h2>${meta?.ref?`AQA ${esc(meta.ref)} · `:''}${esc(meta?.section||title)}</h2></div></div>${list(focus,'presentation-spec-list')}${equations.length?`<div class="presentation-equations"><strong>Equations</strong>${equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}${meta?.practical?`<div class="presentation-practical"><strong>Required practical connection</strong><p>${esc(meta.practical)}</p></div>`:''}`},
      {type:'exam',label:'Exam skill',html:`<div class="presentation-slide-heading"><span>07</span><div><small>Exam technique</small><h2>Turn knowledge into marks</h2></div></div><div class="presentation-exam-grid"><article><strong>How to answer</strong><p>${esc(lesson.examTip||seq.teach?.[2]?.[1]||'Use precise scientific vocabulary and link each point to the question context.')}</p></article><article class="presentation-warning"><strong>Common misconception</strong><p>${esc(misconception)}</p></article></div><div class="presentation-callout"><strong>Exam challenge</strong><p>${esc(seq.stretch||`Write a 4–6 mark response applying ${title.toLowerCase()} to an unfamiliar context.`)}</p></div>`},
      {type:'plenary',label:'Plenary',html:`<div class="presentation-slide-heading"><span>08</span><div><small>Finish the lesson</small><h2>Plenary & self-check</h2></div></div>${list(seq.plenary||[`Summarise ${title} in one sentence.`,`Write one key term you can now use accurately.`,`Identify one point you would revisit before an exam.`])}<div class="presentation-finish-grid"><article><strong>From memory</strong><p>Can you explain the lesson without looking back at the slides?</p></article><article><strong>Application</strong><p>Can you use the idea in a different context rather than repeating a definition?</p></article><article><strong>Next step</strong><p>Use the confidence checkpoint below the presentation, then continue to the next lesson.</p></article></div>`}
    ];
    return slides;
  }

  function savePosition(key,index){positions[key]=index;localStorage.setItem(POS_KEY,JSON.stringify(positions));}

  function showSlide(deck,index){
    const slides=[...deck.querySelectorAll('.presentation-slide')];
    if(!slides.length)return;
    const next=Math.max(0,Math.min(index,slides.length-1));
    slides.forEach((slide,i)=>{slide.hidden=i!==next;slide.classList.toggle('active',i===next);});
    deck.dataset.slide=String(next);
    deck.querySelector('.presentation-count').textContent=`${next+1} / ${slides.length}`;
    deck.querySelector('.presentation-progress i').style.width=`${Math.round((next+1)/slides.length*100)}%`;
    deck.querySelector('[data-slide-prev]').disabled=next===0;
    deck.querySelector('[data-slide-next]').disabled=next===slides.length-1;
    deck.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.slideJump)===next));
    const key=deck.dataset.lessonKey;if(key)savePosition(key,next);
  }

  function bindDeck(deck,fullNotes){
    deck.querySelector('[data-slide-prev]').addEventListener('click',()=>showSlide(deck,Number(deck.dataset.slide)-1));
    deck.querySelector('[data-slide-next]').addEventListener('click',()=>showSlide(deck,Number(deck.dataset.slide)+1));
    deck.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.addEventListener('click',()=>showSlide(deck,Number(btn.dataset.slideJump))));
    deck.querySelector('[data-presentation-fullscreen]').addEventListener('click',()=>{if(deck.requestFullscreen)deck.requestFullscreen();});
    deck.querySelector('[data-presentation-notes]').addEventListener('click',()=>{fullNotes.open=!fullNotes.open;if(fullNotes.open)fullNotes.scrollIntoView({behavior:'smooth',block:'start'});});
    deck.querySelector('[data-presentation-save]').addEventListener('click',()=>{
      const current=deck.querySelector('.presentation-slide.active');
      const text=current?.innerText?.replace(/\n{3,}/g,'\n\n').trim();
      if(text)window.GCSE_COURSE_POLISH?.addNote?.(text,`${deck.dataset.lessonTitle} · presentation slide`,'presentation');
    });
  }

  function enhanceOpenLesson(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    const topic=activeTopic(),lessons=visibleLessons(topic);if(!topic||!lessons.length)return;
    const index=Math.min(state.activeLessonIndex,lessons.length-1),title=lessons[index]?.[0],card=document.querySelectorAll('#topicContent .lesson-card')[index];
    if(!title||!card||card.querySelector('.lesson-presentation'))return;
    const expanded=card.querySelector('.lesson-expanded');if(!expanded)return;
    const lesson=lessonData(topic,title,index);if(!lesson)return;
    const slides=slideDeck(topic,title,index,lesson),key=stableKey(topic,title);
    const deck=document.createElement('section');deck.className=`lesson-presentation ${topic.subject}`;deck.dataset.lessonKey=key;deck.dataset.lessonTitle=title;deck.dataset.slide='0';
    deck.innerHTML=`<div class="presentation-toolbar"><div><span class="eyebrow">Presentation lesson</span><strong>${esc(title)}</strong></div><div class="presentation-toolbar-actions"><button type="button" data-presentation-save>＋ Notebook</button><button type="button" data-presentation-notes>Full notes</button><button type="button" data-presentation-fullscreen>Present ⛶</button></div></div><div class="presentation-progress"><i></i></div><div class="presentation-stage">${slides.map((slide,i)=>`<article class="presentation-slide slide-${slide.type}" data-slide-index="${i}" ${i?'hidden':''}>${slide.html}</article>`).join('')}</div><div class="presentation-bottom"><button type="button" data-slide-prev>← Previous</button><div class="presentation-dots">${slides.map((slide,i)=>`<button type="button" data-slide-jump="${i}" aria-label="Go to ${esc(slide.label)}" title="${esc(slide.label)}"><span></span></button>`).join('')}</div><span class="presentation-count">1 / ${slides.length}</span><button type="button" data-slide-next>Next →</button></div><div class="presentation-keyboard-hint">Use ← → keys to move between slides · Alt + ←/→ still changes lesson</div>`;
    const notes=document.createElement('details');notes.className='presentation-full-notes';notes.innerHTML='<summary>Full lesson notes & all learning activities</summary>';
    expanded.parentNode.insertBefore(deck,expanded);expanded.parentNode.insertBefore(notes,expanded);notes.appendChild(expanded);
    bindDeck(deck,notes);
    showSlide(deck,Number(positions[key]||0));
  }

  const baseRenderTopic=renderTopic;
  renderTopic=function(){baseRenderTopic();requestAnimationFrame(enhanceOpenLesson);};

  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
    const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    const deck=document.querySelector('#topicContent .lesson-presentation');if(!deck||state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    if(e.key==='ArrowRight'){e.preventDefault();showSlide(deck,Number(deck.dataset.slide)+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();showSlide(deck,Number(deck.dataset.slide)-1);}
  });

  if(!document.getElementById('topicView')?.hidden)requestAnimationFrame(enhanceOpenLesson);
  window.GCSE_PRESENTATION_LESSONS={enhanceOpenLesson,showSlide,slideDeck};
})();
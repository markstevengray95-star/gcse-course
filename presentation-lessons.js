(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;

  const POS_KEY='gcse-science-presentation-position-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let positions=parse(localStorage.getItem(POS_KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const stableKey=(topic,title)=>window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title||'untitled')}`;
  const subjectName=topic=>window.GCSE_COURSE_DATA?.subjects?.find(s=>s.id===topic.subject)?.name||topic.subject;
  const lessonData=(topic,title,index)=>window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;

  function visualFor(topic,index,title){
    const real=window.GCSE_SCIENCE_DIAGRAMS?.get?.(topic.id);
    if(real) return `<div class="presentation-diagram science-presentation-visual">${real.svg}<small>${esc(real.title)}</small></div>`;
    const textbook=window.GCSE_TEXTBOOK_ENHANCEMENTS;
    const plan=textbook?.diagramPlan?.[topic.id]||[];
    if(!plan.length||typeof textbook?.visual!=='function') return `<div class="presentation-fallback-visual"><span>${topic.subject==='biology'?'🧬':topic.subject==='chemistry'?'⚗️':'⚡'}</span><strong>${esc(topic.title)}</strong></div>`;
    const words=String(title||'').toLowerCase().split(/\W+/).filter(w=>w.length>3);
    const found=plan.find(([,label])=>words.some(w=>String(label).toLowerCase().includes(w)))||plan[index%plan.length];
    return `<div class="presentation-diagram">${textbook.visual(found[0],found[1])}<small>${esc(found[1])}</small></div>`;
  }

  const list=(items,cls='presentation-bullets')=>`<ul class="${cls}">${(items||[]).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  const chunk=(items,size)=>{const out=[];for(let i=0;i<items.length;i+=size)out.push(items.slice(i,i+size));return out;};

  function slideDeck(topic,title,index,lesson){
    const catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
    const m=catalog?.build?.(topic,title,index,lesson);
    if(!m) return [];
    const slides=[];
    slides.push({type:'title',label:'Start',html:`<div class="presentation-title-copy"><span class="presentation-kicker">${esc(topic.code)} · ${esc(subjectName(topic))} · AQA ${esc(m.ref)}</span><h2>${esc(m.title)}</h2><p>${esc(m.summary)}</p><div class="presentation-title-tags"><span>Lesson ${index+1}</span><span>${esc(m.duration)}</span>${m.tier==='higher'?'<span>Higher Tier</span>':''}${m.scope==='triple'?'<span>Separate Science</span>':''}</div></div>${visualFor(topic,index,title)}`});

    const starter=m.starter.length?m.starter:[{question:`What do you already know about ${title}?`,answer:m.coreExplanation},{question:'Which key term can you define from memory?',answer:m.keyTerms[0]?.[1]||m.coreExplanation}];
    slides.push({type:'retrieval',label:'Starter',html:`<div class="presentation-slide-heading"><span>01</span><div><small>Retrieval starter</small><h2>Activate prior knowledge</h2></div></div><div class="presentation-retrieval-grid">${starter.map((q,i)=>`<details><summary>${i+1}. ${esc(q.question)}</summary><p>${esc(q.answer||'Use your previous learning and explain your reasoning.')}</p></details>`).join('')}</div><div class="presentation-callout"><strong>Do this first</strong><p>Answer from memory before opening the model responses.</p></div>`});

    slides.push({type:'objectives',label:'Objectives',html:`<div class="presentation-slide-heading"><span>02</span><div><small>Learning objectives</small><h2>Everything this lesson must cover</h2></div></div>${list(m.objectives)}<div class="presentation-callout"><strong>AQA ${esc(m.ref)}</strong><p>${esc(m.section)} · By the end, you should be able to recall, explain and apply every point shown here.</p></div>`});

    slides.push({type:'teach',label:'Big idea',html:`<div class="presentation-slide-heading"><span>03</span><div><small>Core teaching</small><h2>The big idea</h2></div></div><div class="presentation-teach-grid"><div><p class="presentation-lead">${esc(m.coreExplanation)}</p><section><strong>Apply the idea</strong><p>${esc(m.application)}</p></section><section><strong>Scientific precision</strong><p>${esc(m.examTip)}</p></section></div>${visualFor(topic,index+1,title)}</div>`});

    m.specificationPoints.forEach((point,i)=>slides.push({type:'specpoint',label:`AQA ${i+1}`,html:`<div class="presentation-slide-heading"><span>${String(i+4).padStart(2,'0')}</span><div><small>AQA ${esc(m.ref)} · specification point ${point.index}</small><h2>${esc(point.text)}</h2></div></div><div class="presentation-specpoint-grid"><article><span class="eyebrow">What it means</span><p class="presentation-lead">${esc(point.teaching)}</p></article><article><span class="eyebrow">How to show mastery</span><p>${esc(point.guidance)}</p></article></div><div class="presentation-callout"><strong>Check yourself</strong><p>Explain this point without notes, then apply it to a different GCSE-style context.</p></div>`}));

    const termChunks=chunk(m.keyTerms,6);
    if(termChunks.length){
      termChunks.forEach((terms,i)=>slides.push({type:'terms',label:termChunks.length>1?`Vocabulary ${i+1}`:'Vocabulary',html:`<div class="presentation-slide-heading"><span>V${i+1}</span><div><small>Scientific language</small><h2>${termChunks.length>1?`Key terminology · ${i+1}/${termChunks.length}`:'Key terminology'}</h2></div></div><div class="presentation-term-grid">${terms.map(([term,definition])=>`<article><strong>${esc(term)}</strong><p>${esc(definition)}</p></article>`).join('')}</div><div class="presentation-callout"><strong>Language challenge</strong><p>Use each term accurately in a scientific sentence linked to ${esc(title)}.</p></div>`}));
    }else{
      slides.push({type:'terms',label:'Vocabulary',html:`<div class="presentation-slide-heading"><span>V</span><div><small>Scientific language</small><h2>Essential terminology</h2></div></div><p class="presentation-lead">Use the exact scientific vocabulary from the AQA points in this lesson rather than vague everyday wording.</p>${list(m.objectives.slice(0,5))}`});
    }

    slides.push({type:'worked',label:'Worked example',html:`<div class="presentation-slide-heading"><span>W</span><div><small>Model the thinking</small><h2>${esc(m.workedExample?.title||'Worked example')}</h2></div></div>${m.workedExample?`<div class="presentation-worked"><p class="presentation-question">${esc(m.workedExample.question)}</p><ol>${m.workedExample.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`:`<div class="presentation-worked"><p class="presentation-question">${esc(m.guidedPractice)}</p><ol><li>Identify the scientific idea being tested.</li><li>Choose the evidence, relationship or vocabulary that answers it.</li><li>Link the science directly to the question context.</li></ol></div>`}${m.equations.length?`<div class="presentation-equations">${m.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}`});

    slides.push({type:'practice',label:'Practice',html:`<div class="presentation-slide-heading"><span>P</span><div><small>Guided → independent</small><h2>Now you try</h2></div></div><div class="presentation-practice-grid"><article><strong>Guided practice</strong><p>${esc(m.guidedPractice)}</p></article><article><strong>Independent practice</strong>${list(m.independentPractice)}</article></div><div class="presentation-callout"><strong>Stretch</strong><p>${esc(m.stretch)}</p></div>`});

    slides.push({type:'spec',label:'AQA coverage',html:`<div class="presentation-slide-heading"><span>S</span><div><small>Complete lesson checklist</small><h2>AQA ${esc(m.ref)} · ${esc(m.section)}</h2></div></div>${list(m.objectives,'presentation-spec-list')}${m.equations.length?`<div class="presentation-equations"><strong>Equations / quantitative relationships</strong>${m.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}${m.practical?`<div class="presentation-practical"><strong>Required practical connection</strong><p>${esc(m.practical)}</p></div>`:''}${m.keyIdeas.length?`<div class="presentation-callout"><strong>AQA key ideas</strong>${list(m.keyIdeas)}</div>`:''}${m.skills.length?`<div class="presentation-skills-list">${m.skills.map(s=>`<article><strong>${esc(s.type)}</strong><p>${esc(s.text)}</p></article>`).join('')}</div>`:''}`});

    slides.push({type:'exam',label:'Exam skill',html:`<div class="presentation-slide-heading"><span>E</span><div><small>Exam technique</small><h2>Turn knowledge into marks</h2></div></div><div class="presentation-exam-grid"><article><strong>How to answer</strong><p>${esc(m.examTip)}</p></article><article class="presentation-warning"><strong>Common misconception</strong><p>${esc(m.misconception)}</p></article></div><div class="presentation-callout"><strong>Exam challenge</strong><p>${esc(m.stretch)}</p></div>`});

    slides.push({type:'plenary',label:'Plenary',html:`<div class="presentation-slide-heading"><span>✓</span><div><small>Finish the lesson</small><h2>Plenary & self-check</h2></div></div>${list(m.plenary)}<div class="presentation-finish-grid"><article><strong>Specification</strong><p>Can you explain every AQA point from this lesson without looking back?</p></article><article><strong>Application</strong><p>${esc(m.application)}</p></article><article><strong>Next step</strong><p>Use the confidence checkpoint below, then continue to the next lesson.</p></article></div>`});
    return slides;
  }

  function savePosition(key,index){positions[key]=index;localStorage.setItem(POS_KEY,JSON.stringify(positions));}
  function showSlide(deck,index){
    const slides=[...deck.querySelectorAll('.presentation-slide')];if(!slides.length)return;
    const next=Math.max(0,Math.min(index,slides.length-1));
    slides.forEach((slide,i)=>{slide.hidden=i!==next;slide.classList.toggle('active',i===next);});
    deck.dataset.slide=String(next);
    deck.querySelector('.presentation-count').textContent=`${next+1} / ${slides.length}`;
    deck.querySelector('.presentation-progress i').style.width=`${Math.round((next+1)/slides.length*100)}%`;
    deck.querySelector('[data-slide-prev]').disabled=next===0;deck.querySelector('[data-slide-next]').disabled=next===slides.length-1;
    deck.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.slideJump)===next));
    const key=deck.dataset.lessonKey;if(key)savePosition(key,next);
  }

  function bindDeck(deck,fullNotes){
    deck.querySelector('[data-slide-prev]').addEventListener('click',()=>showSlide(deck,Number(deck.dataset.slide)-1));
    deck.querySelector('[data-slide-next]').addEventListener('click',()=>showSlide(deck,Number(deck.dataset.slide)+1));
    deck.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.addEventListener('click',()=>showSlide(deck,Number(btn.dataset.slideJump))));
    deck.querySelector('[data-presentation-fullscreen]').addEventListener('click',()=>deck.requestFullscreen?.());
    deck.querySelector('[data-presentation-notes]').addEventListener('click',()=>{fullNotes.open=!fullNotes.open;if(fullNotes.open)fullNotes.scrollIntoView({behavior:'smooth',block:'start'});});
    deck.querySelector('[data-presentation-save]').addEventListener('click',()=>{const current=deck.querySelector('.presentation-slide.active');const text=current?.innerText?.replace(/\n{3,}/g,'\n\n').trim();if(text)window.GCSE_COURSE_POLISH?.addNote?.(text,`${deck.dataset.lessonTitle} · presentation slide`,'presentation');});
  }

  function enhanceOpenLesson(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    const topic=activeTopic(),lessons=visibleLessons(topic);if(!topic||!lessons.length)return;
    const index=Math.min(state.activeLessonIndex,lessons.length-1),title=lessons[index]?.[0],card=document.querySelectorAll('#topicContent .lesson-card')[index];
    if(!title||!card||card.querySelector('.lesson-presentation'))return;
    const expanded=card.querySelector('.lesson-expanded');if(!expanded)return;
    const lesson=lessonData(topic,title,index);if(!lesson)return;
    const slides=slideDeck(topic,title,index,lesson),key=stableKey(topic,title);if(!slides.length)return;
    const deck=document.createElement('section');deck.className=`lesson-presentation ${topic.subject}`;deck.dataset.lessonKey=key;deck.dataset.lessonTitle=title;deck.dataset.slide='0';deck.dataset.presentationId=window.GCSE_LESSON_PRESENTATION_CATALOG?.stableId?.(topic,title)||key;
    deck.innerHTML=`<div class="presentation-toolbar"><div><span class="eyebrow">Individual lesson presentation</span><strong>${esc(title)}</strong></div><div class="presentation-toolbar-actions"><button type="button" data-presentation-save>＋ Notebook</button><button type="button" data-presentation-notes>Full notes</button><button type="button" data-presentation-fullscreen>Present ⛶</button></div></div><div class="presentation-progress"><i></i></div><div class="presentation-stage">${slides.map((slide,i)=>`<article class="presentation-slide slide-${slide.type}" data-slide-index="${i}" ${i?'hidden':''}>${slide.html}</article>`).join('')}</div><div class="presentation-bottom"><button type="button" data-slide-prev>← Previous</button><div class="presentation-dots">${slides.map((slide,i)=>`<button type="button" data-slide-jump="${i}" aria-label="Go to ${esc(slide.label)}" title="${esc(slide.label)}"><span></span></button>`).join('')}</div><span class="presentation-count">1 / ${slides.length}</span><button type="button" data-slide-next>Next →</button></div><div class="presentation-keyboard-hint">Use ← → keys to move between slides · Alt + ←/→ still changes lesson</div>`;
    const notes=document.createElement('details');notes.className='presentation-full-notes';notes.innerHTML='<summary>Full lesson notes & all learning activities</summary>';
    expanded.parentNode.insertBefore(deck,expanded);expanded.parentNode.insertBefore(notes,expanded);notes.appendChild(expanded);bindDeck(deck,notes);showSlide(deck,Number(positions[key]||0));
  }

  const baseRenderTopic=renderTopic;renderTopic=function(){baseRenderTopic();requestAnimationFrame(enhanceOpenLesson);};
  document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;const deck=document.querySelector('#topicContent .lesson-presentation');if(!deck||state.activeTab!=='lessons'||state.activeLessonIndex<0)return;if(e.key==='ArrowRight'){e.preventDefault();showSlide(deck,Number(deck.dataset.slide)+1);}if(e.key==='ArrowLeft'){e.preventDefault();showSlide(deck,Number(deck.dataset.slide)-1);}});
  if(!document.getElementById('topicView')?.hidden)requestAnimationFrame(enhanceOpenLesson);
  window.GCSE_PRESENTATION_LESSONS={enhanceOpenLesson,showSlide,slideDeck};
})();
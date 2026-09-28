(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;

  const MODE_KEY='gcse-science-presentation-mode-v1';
  let presentationMode=localStorage.getItem(MODE_KEY)==='teacher'?'teacher':'student';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const lessonFor=(topic,title,index)=>window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
  const metaFor=lesson=>lesson?.biologyMeta||lesson?.chemistryMeta||lesson?.physicsMeta||null;
  const coverageFor=(topic,title,lesson)=>window.GCSE_SPECIFICATION_COMPLETENESS?.buildCoverage?.(topic,title,lesson)||null;

  function setMode(mode){
    presentationMode=mode==='teacher'?'teacher':'student';
    localStorage.setItem(MODE_KEY,presentationMode);
    document.querySelectorAll('.lesson-presentation').forEach(deck=>{
      deck.classList.toggle('teacher-mode',presentationMode==='teacher');
      deck.classList.toggle('student-mode',presentationMode==='student');
      deck.querySelectorAll('[data-presentation-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.presentationMode===presentationMode));
    });
  }

  function diagramPanel(topic){
    const diagram=window.GCSE_SCIENCE_DIAGRAMS?.get?.(topic.id);if(!diagram)return '';
    return `<div class="interactive-diagram-card" data-interactive-diagram>
      <div class="interactive-diagram-main">
        <div class="interactive-diagram-canvas">${diagram.svg}</div>
        <aside class="diagram-hotspot-info" data-diagram-info><span class="eyebrow">Interactive diagram</span><h3>${esc(diagram.title)}</h3><p>Select a numbered hotspot to identify the structure or idea.</p></aside>
      </div>
      <div class="diagram-controls"><button type="button" data-diagram-reset>Test me</button><button type="button" data-diagram-show>Show all labels</button></div>
      <div class="diagram-label-bank" data-diagram-label-bank>${diagram.labels.map((item,i)=>`<button type="button" data-label-id="${esc(item.id)}"><span>${i+1}</span><div><strong>${esc(item.name)}</strong><small>${esc(item.detail)}</small></div></button>`).join('')}</div>
    </div>`;
  }

  function bindDiagram(deck,topic){
    const diagram=window.GCSE_SCIENCE_DIAGRAMS?.get?.(topic.id);if(!diagram)return;
    const teach=deck.querySelector('.slide-teach');
    if(teach){
      const old=teach.querySelector('.presentation-diagram,.presentation-fallback-visual');
      if(old)old.outerHTML=diagramPanel(topic);else teach.insertAdjacentHTML('beforeend',diagramPanel(topic));
    }
    const titleVisual=deck.querySelector('.slide-title .presentation-diagram,.slide-title .presentation-fallback-visual');
    if(titleVisual) titleVisual.innerHTML=`${diagram.svg}<small>${esc(diagram.title)}</small>`;
    const card=deck.querySelector('[data-interactive-diagram]');if(!card)return;
    const info=card.querySelector('[data-diagram-info]'),bank=card.querySelector('[data-diagram-label-bank]');
    const showItem=id=>{
      const item=diagram.labels.find(x=>x.id===id);if(!item)return;
      info.innerHTML=`<span class="eyebrow">Diagram label</span><h3>${esc(item.name)}</h3><p>${esc(item.detail)}</p>`;
      card.querySelectorAll('[data-label-id]').forEach(btn=>btn.classList.toggle('active',btn.dataset.labelId===id));
      card.querySelectorAll('[data-diagram-hotspot]').forEach(h=>h.classList.toggle('active',h.dataset.diagramHotspot===id));
    };
    card.querySelectorAll('[data-diagram-hotspot]').forEach(h=>{
      const open=()=>showItem(h.dataset.diagramHotspot);
      h.addEventListener('click',open);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
    card.querySelectorAll('[data-label-id]').forEach(btn=>btn.addEventListener('click',()=>showItem(btn.dataset.labelId)));
    card.querySelector('[data-diagram-reset]')?.addEventListener('click',()=>{
      info.innerHTML=`<span class="eyebrow">Test mode</span><h3>Name the numbered features</h3><p>Try to identify each hotspot before selecting it.</p>`;
      card.classList.add('test-mode');card.classList.remove('show-all');
      card.querySelectorAll('.active').forEach(x=>x.classList.remove('active'));
    });
    card.querySelector('[data-diagram-show]')?.addEventListener('click',()=>{card.classList.add('show-all');card.classList.remove('test-mode');bank.querySelectorAll('button').forEach(btn=>btn.classList.add('revealed'));});
    if(presentationMode==='student')card.classList.add('test-mode');else card.classList.add('show-all');
  }

  function buildKnowledgeCheck(lesson){
    const terms=(lesson?.terms||[]).filter(x=>x?.[0]&&x?.[1]);
    if(terms.length>=3){
      const correct=terms[0],options=[terms[1][1],correct[1],terms[2][1]];
      return {question:`Which definition best matches “${correct[0]}”?`,options,answer:1,explanation:correct[1]};
    }
    const check=lesson?.check;
    if(Array.isArray(check)&&check.length>=2)return {question:check[0],options:['Not enough information','Reveal the model answer','Skip this check'],answer:1,explanation:check[1]};
    return null;
  }

  function addKnowledgeCheck(deck,lesson){
    const slide=deck.querySelector('.slide-practice');if(!slide||slide.querySelector('.presentation-knowledge-check'))return;
    const q=buildKnowledgeCheck(lesson);if(!q)return;
    const html=`<section class="presentation-knowledge-check"><span class="eyebrow">Quick check</span><h3>${esc(q.question)}</h3><div class="knowledge-options">${q.options.map((opt,i)=>`<button type="button" data-knowledge-option="${i}">${esc(opt)}</button>`).join('')}</div><div class="knowledge-feedback" data-knowledge-feedback hidden></div></section>`;
    slide.insertAdjacentHTML('beforeend',html);
    const panel=slide.querySelector('.presentation-knowledge-check'),feedback=panel.querySelector('[data-knowledge-feedback]');
    panel.querySelectorAll('[data-knowledge-option]').forEach(btn=>btn.addEventListener('click',()=>{
      const chosen=Number(btn.dataset.knowledgeOption),correct=chosen===q.answer;
      panel.querySelectorAll('[data-knowledge-option]').forEach(b=>{b.classList.toggle('correct',Number(b.dataset.knowledgeOption)===q.answer);b.classList.toggle('wrong',b===btn&&!correct);});
      feedback.hidden=false;feedback.innerHTML=`<strong>${correct?'Correct':'Check it again'}</strong><p>${esc(q.explanation)}</p>`;
    }));
  }

  function makeTermsInteractive(deck){
    deck.querySelectorAll('.slide-terms .presentation-term-grid article').forEach((card,index)=>{
      if(card.dataset.interactiveTerm)return;card.dataset.interactiveTerm='true';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-expanded','false');
      const strong=card.querySelector('strong'),p=card.querySelector('p');if(!strong||!p)return;
      p.dataset.termDefinition='';
      const toggle=()=>{const on=card.classList.toggle('revealed');card.setAttribute('aria-expanded',String(on));};
      card.addEventListener('click',toggle);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
      card.title=`Reveal definition for ${strong.textContent}`;
      if(index===0)card.classList.add('term-featured');
    });
  }

  function makeWorkedInteractive(deck,lesson){
    const slide=deck.querySelector('.slide-worked'),list=slide?.querySelector('.presentation-worked ol');if(!slide||!list||slide.querySelector('.worked-interactive-controls'))return;
    const items=[...list.querySelectorAll('li')];if(!items.length)return;
    items.forEach((li,i)=>{li.dataset.workedStep=String(i);if(presentationMode==='student')li.classList.add('step-hidden');});
    const controls=document.createElement('div');controls.className='worked-interactive-controls';controls.innerHTML='<button type="button" data-reveal-next>Reveal next step</button><button type="button" data-reveal-all>Reveal all</button><button type="button" data-reset-worked>Reset</button>';
    list.after(controls);
    const revealNext=()=>{const hidden=items.find(li=>li.classList.contains('step-hidden'));hidden?.classList.remove('step-hidden');};
    controls.querySelector('[data-reveal-next]').addEventListener('click',revealNext);
    controls.querySelector('[data-reveal-all]').addEventListener('click',()=>items.forEach(li=>li.classList.remove('step-hidden')));
    controls.querySelector('[data-reset-worked]').addEventListener('click',()=>items.forEach(li=>li.classList.toggle('step-hidden',presentationMode==='student')));
    if(items.length>=3)addSequenceChallenge(slide,items.map(li=>li.textContent.trim()));
  }

  function addSequenceChallenge(slide,steps){
    if(slide.querySelector('.sequence-challenge'))return;
    const order=steps.map((text,index)=>({text,index}));
    const mixed=[...order.slice(1),order[0]];
    const panel=document.createElement('section');panel.className='sequence-challenge';
    panel.innerHTML=`<span class="eyebrow">Sequence challenge</span><h3>Put the method in the correct order</h3><p>Drag the cards, or use the arrow buttons.</p><div class="sequence-list">${mixed.map(item=>`<div class="sequence-item" draggable="true" data-original-index="${item.index}"><span class="drag-handle">⋮⋮</span><p>${esc(item.text)}</p><div><button type="button" data-move="up" aria-label="Move up">↑</button><button type="button" data-move="down" aria-label="Move down">↓</button></div></div>`).join('')}</div><button type="button" class="sequence-check">Check order</button><div class="sequence-feedback" hidden></div>`;
    slide.appendChild(panel);
    const list=panel.querySelector('.sequence-list');let dragged=null;
    list.addEventListener('dragstart',e=>{dragged=e.target.closest('.sequence-item');dragged?.classList.add('dragging');});
    list.addEventListener('dragend',()=>{dragged?.classList.remove('dragging');dragged=null;});
    list.addEventListener('dragover',e=>{e.preventDefault();const target=e.target.closest('.sequence-item');if(target&&dragged&&target!==dragged){const rect=target.getBoundingClientRect();list.insertBefore(dragged,e.clientY<rect.top+rect.height/2?target:target.nextSibling);}});
    panel.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.sequence-item');if(btn.dataset.move==='up'&&item.previousElementSibling)list.insertBefore(item,item.previousElementSibling);if(btn.dataset.move==='down'&&item.nextElementSibling)list.insertBefore(item.nextElementSibling,item);}));
    panel.querySelector('.sequence-check').addEventListener('click',()=>{const current=[...list.children].map(x=>Number(x.dataset.originalIndex));const correct=current.every((v,i)=>v===i);const fb=panel.querySelector('.sequence-feedback');fb.hidden=false;fb.textContent=correct?'Correct sequence.':'Not quite — use the worked example to check the order.';fb.classList.toggle('correct',correct);});
  }

  function addMiniWhiteboard(deck,lesson){
    const slide=deck.querySelector('.slide-exam');if(!slide||slide.querySelector('.mini-whiteboard'))return;
    const prompt=lesson?.sequence?.stretch||lesson?.depth?.application||`Explain ${lesson?.title||'this idea'} in an unfamiliar GCSE context.`;
    const model=lesson?.examTip||lesson?.sequence?.teach?.[2]?.[1]||'Use precise scientific terminology, link ideas with cause and effect, and answer the command word directly.';
    slide.insertAdjacentHTML('beforeend',`<section class="mini-whiteboard"><span class="eyebrow">Mini whiteboard</span><h3>${esc(prompt)}</h3><textarea rows="4" placeholder="Write your answer before revealing the guidance…"></textarea><div class="mini-whiteboard-actions"><button type="button" data-whiteboard-reveal>Compare with guidance</button><button type="button" data-whiteboard-save>Save answer to notebook</button></div><div class="whiteboard-model" data-whiteboard-model hidden><strong>Model guidance</strong><p>${esc(model)}</p></div></section>`);
    const board=slide.querySelector('.mini-whiteboard');
    board.querySelector('[data-whiteboard-reveal]').addEventListener('click',()=>board.querySelector('[data-whiteboard-model]').hidden=false);
    board.querySelector('[data-whiteboard-save]').addEventListener('click',()=>{const text=board.querySelector('textarea').value.trim();if(text)window.GCSE_COURSE_POLISH?.addNote?.(`${prompt}\n\nMy answer:\n${text}`,`${lesson.title} · mini whiteboard`,'presentation-response');});
  }

  function upgradeSpecificationSlide(deck,topic,title,lesson){
    const slide=deck.querySelector('.slide-spec');if(!slide)return;
    const c=coverageFor(topic,title,lesson);if(!c)return;
    slide.innerHTML=`<div class="presentation-slide-heading"><span>06</span><div><small>Complete AQA coverage</small><h2>AQA ${esc(c.ref)} · ${esc(c.section)}</h2></div></div><div class="complete-coverage-layout"><section><h3>Every mapped specification point</h3><div class="coverage-check-list">${c.points.map(p=>`<label><input type="checkbox" data-coverage-check><span><strong>${esc(p.text)}</strong><small>${esc(p.guidance)}</small></span></label>`).join('')}</div></section><aside><article><strong>Key ideas</strong><ul>${c.keyIdeas.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article><strong>Skills to practise</strong><ul>${c.skills.map(x=>`<li><b>${esc(x.type)}:</b> ${esc(x.text)}</li>`).join('')}</ul></article>${c.equations.length?`<article><strong>Equations / relationships</strong><div class="presentation-equations">${c.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div></article>`:''}${c.practical?`<article class="presentation-practical"><strong>Required practical connection</strong><p>${esc(c.practical)}</p></article>`:''}</aside></div>`;
  }

  function addTeacherControls(deck,lesson){
    const actions=deck.querySelector('.presentation-toolbar-actions');if(!actions||actions.querySelector('[data-presentation-mode]'))return;
    const wrap=document.createElement('div');wrap.className='presentation-mode-toggle';wrap.innerHTML='<button type="button" data-presentation-mode="student">Student</button><button type="button" data-presentation-mode="teacher">Teacher</button>';
    actions.prepend(wrap);
    wrap.querySelectorAll('[data-presentation-mode]').forEach(btn=>btn.addEventListener('click',()=>{setMode(btn.dataset.presentationMode);if(btn.dataset.presentationMode==='teacher')deck.querySelectorAll('.step-hidden').forEach(x=>x.classList.remove('step-hidden'));}));
    const notes=document.createElement('div');notes.className='teacher-prompt';notes.innerHTML=`<strong>Teacher prompt</strong><span>${esc(lesson?.sequence?.guided||lesson?.depth?.application||'Ask students to explain the idea, then apply it to an unfamiliar context.')}</span>`;
    deck.querySelector('.presentation-stage')?.appendChild(notes);
  }

  function addPlenaryInteraction(deck,lesson){
    const slide=deck.querySelector('.slide-plenary');if(!slide||slide.querySelector('.plenary-confidence'))return;
    slide.insertAdjacentHTML('beforeend',`<section class="plenary-confidence"><span class="eyebrow">Exit confidence</span><h3>How ready are you to use this without notes?</h3><div><button type="button" data-plenary-confidence="1">Needs review</button><button type="button" data-plenary-confidence="2">Developing</button><button type="button" data-plenary-confidence="3">Secure</button></div><p data-plenary-message>Select a confidence level, then use the lesson checkpoint below to save it permanently.</p></section>`);
    slide.querySelectorAll('[data-plenary-confidence]').forEach(btn=>btn.addEventListener('click',()=>{slide.querySelectorAll('[data-plenary-confidence]').forEach(x=>x.classList.toggle('active',x===btn));slide.querySelector('[data-plenary-message]').textContent=Number(btn.dataset.plenaryConfidence)===3?'Good — now prove it by explaining one specification point from memory.':Number(btn.dataset.plenaryConfidence)===2?'Revisit the diagram or worked example before moving on.':'Use Full notes and the key-term cards, then try the quick check again.';}));
  }

  function enhanceDeck(){
    if(state.activeTab!=='lessons'||state.activeLessonIndex<0)return;
    const topic=activeTopic(),lessons=visibleLessons(topic);if(!topic||!lessons.length)return;
    const index=Math.min(state.activeLessonIndex,lessons.length-1),title=lessons[index]?.[0];if(!title)return;
    const deck=document.querySelector('#topicContent .lesson-presentation');if(!deck||deck.dataset.interactiveEnhanced==='true')return;
    const lesson=lessonFor(topic,title,index);if(!lesson)return;
    deck.dataset.interactiveEnhanced='true';deck.classList.toggle('teacher-mode',presentationMode==='teacher');deck.classList.toggle('student-mode',presentationMode==='student');
    addTeacherControls(deck,lesson);bindDiagram(deck,topic);makeTermsInteractive(deck);makeWorkedInteractive(deck,lesson);addKnowledgeCheck(deck,lesson);addMiniWhiteboard(deck,lesson);upgradeSpecificationSlide(deck,topic,title,lesson);addPlenaryInteraction(deck,lesson);setMode(presentationMode);
  }

  const baseRenderTopic=renderTopic;
  renderTopic=function(){baseRenderTopic();requestAnimationFrame(()=>requestAnimationFrame(enhanceDeck));};
  if(!document.getElementById('topicView')?.hidden)requestAnimationFrame(()=>requestAnimationFrame(enhanceDeck));
  window.GCSE_INTERACTIVE_PRESENTATIONS={enhanceDeck,setMode,getMode:()=>presentationMode,diagramPanel,buildKnowledgeCheck};
})();
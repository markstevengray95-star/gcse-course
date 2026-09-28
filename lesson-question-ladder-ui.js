(() => {
  if(typeof topics==='undefined'||typeof state==='undefined') return;
  const KEY='gcse-science-question-pulse-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};let saved=parse(localStorage.getItem(KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  function contextFor(deck){
    const topic=activeTopic();if(!topic)return null;const title=deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    model.subject=topic.subject;const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,title,model)||null;const questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[];
    const key=window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title)}`;return{topic,title,index,lesson,model,practical,questions,key};
  }
  function card(q,ctx){
    const stateFor=saved[`${ctx.key}:${q.id}`]||{};
    return `<section class="question-pulse ${stateFor.answer?'answered':''}" data-question-pulse="${esc(q.id)}"><header><span class="question-command">${esc(q.command)}</span><span class="question-marks">${q.marks} mark${q.marks===1?'':'s'}</span></header><h3>${esc(q.prompt)}</h3><textarea rows="3" data-question-answer placeholder="Write your answer before revealing the mark points…">${esc(stateFor.answer||'')}</textarea><div class="question-pulse-actions"><button type="button" data-question-reveal>Reveal mark points</button><button type="button" data-question-save>Save to notebook</button></div><div class="question-mark-points" data-question-mark-points hidden><strong>Indicative mark points</strong><ul>${q.marking.map(m=>`<li>${esc(m.text)}</li>`).join('')}</ul><div class="question-self-mark"><span>Self-mark:</span>${Array.from({length:q.marks+1},(_,i)=>`<button type="button" data-self-score="${i}" class="${Number(stateFor.score)===i?'active':''}">${i}</button>`).join('')}<span>/ ${q.marks}</span></div></div></section>`;
  }
  function saveState(ctx,q,card){
    const answer=card.querySelector('[data-question-answer]')?.value?.trim()||'';const active=card.querySelector('[data-self-score].active');saved[`${ctx.key}:${q.id}`]={answer,score:active?Number(active.dataset.selfScore):null,updated:Date.now()};localStorage.setItem(KEY,JSON.stringify(saved));card.classList.toggle('answered',Boolean(answer));
  }
  function bind(card,q,ctx){
    const answer=card.querySelector('[data-question-answer]');let timer=null;answer?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>saveState(ctx,q,card),250);});
    card.querySelector('[data-question-reveal]')?.addEventListener('click',()=>{card.querySelector('[data-question-mark-points]').hidden=false;});
    card.querySelectorAll('[data-self-score]').forEach(btn=>btn.addEventListener('click',()=>{card.querySelectorAll('[data-self-score]').forEach(x=>x.classList.toggle('active',x===btn));saveState(ctx,q,card);}));
    card.querySelector('[data-question-save]')?.addEventListener('click',()=>{const text=answer?.value?.trim();if(text)window.GCSE_COURSE_POLISH?.addNote?.(`${q.command} · ${q.marks} marks\n${q.prompt}\n\nMy answer:\n${text}`,`${ctx.title} · question practice`,'question-pulse');});
  }
  function targets(deck){
    const list=[];const add=el=>{if(el&&!list.includes(el))list.push(el)};
    add(deck.querySelector('.slide-teach'));
    [...deck.querySelectorAll('.slide-specapply')].forEach(add);
    add(deck.querySelector('.slide-terms'));
    add(deck.querySelector('.slide-worked'));
    add(deck.querySelector('.slide-practice'));
    add(deck.querySelector('.slide-exam'));
    add(deck.querySelector('.slide-plenary'));
    return list;
  }
  function upgrade(deck){
    if(deck.dataset.phase8Questions==='done')return;deck.dataset.phase8Questions='done';const ctx=contextFor(deck);if(!ctx||!ctx.questions.length)return;
    const slots=targets(deck);if(!slots.length)return;
    ctx.questions.forEach((q,i)=>{const slot=slots[Math.min(i,slots.length-1)];slot.insertAdjacentHTML('beforeend',card(q,ctx));const el=slot.querySelector(`[data-question-pulse="${q.id}"]`);if(el)bind(el,q,ctx);});
    const toolbar=deck.querySelector('.presentation-toolbar-actions');if(toolbar&&!toolbar.querySelector('[data-question-progress]')){const answered=ctx.questions.filter(q=>saved[`${ctx.key}:${q.id}`]?.answer).length;const chip=document.createElement('span');chip.className='question-progress-chip';chip.dataset.questionProgress='';chip.textContent=`Questions ${answered}/${ctx.questions.length}`;toolbar.prepend(chip);deck.addEventListener('input',()=>{const count=[...deck.querySelectorAll('.question-pulse textarea')].filter(x=>x.value.trim()).length;chip.textContent=`Questions ${count}/${ctx.questions.length}`;});}
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_QUESTION_LADDER_UI={scan};
})();
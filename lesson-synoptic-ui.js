(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  function ctx(deck){
    const topic=activeTopic();if(!topic)return null;const title=deck.dataset.lessonTitle||'';const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const index=lessons.findIndex(([name])=>name===title);if(index<0)return null;const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);const plan=window.GCSE_LESSON_SYNOPTIC?.build?.(model,topic,topics);return{topic,title,index,lesson,model,plan};
  }
  function rebuild(deck){
    if(window.GCSE_EQUATION_COACH_UI?.rebuildNav)return window.GCSE_EQUATION_COACH_UI.rebuildNav(deck);
    const slides=[...deck.querySelectorAll('.presentation-slide')];slides.forEach((s,i)=>s.dataset.slideIndex=String(i));const dots=deck.querySelector('.presentation-dots');if(!dots)return;
    dots.innerHTML=slides.map((s,i)=>`<button type="button" data-slide-jump="${i}" aria-label="Go to slide ${i+1}"><span></span></button>`).join('');dots.querySelectorAll('[data-slide-jump]').forEach(b=>b.addEventListener('click',()=>window.GCSE_PRESENTATION_LESSONS?.showSlide?.(deck,Number(b.dataset.slideJump))));
  }
  function card(link,i){return `<article class="synoptic-connection-card"><header><span>${i+1}</span><div><small>${link.sameSubject?'Within-subject connection':'Cross-science connection'}</small><h3>${esc(link.targetCode)} · ${esc(link.targetTitle)}</h3></div></header><p>${esc(link.reason)}</p><div class="synoptic-transfer"><strong>What transfers?</strong><p>${esc(link.transfer)}</p></div><label>Explain the connection<textarea rows="3" data-synoptic-answer="${i}" placeholder="Write the scientific link before revealing the guidance…"></textarea></label><div class="synoptic-actions"><button type="button" data-synoptic-reveal="${i}">Reveal connection guidance</button><button type="button" data-synoptic-open="${esc(link.targetId)}">Open ${esc(link.targetCode)}</button><button type="button" data-synoptic-save="${i}">＋ Notebook</button></div><div class="synoptic-guidance" data-synoptic-guidance="${i}" hidden><strong>Transfer question</strong><p>${esc(link.question)}</p><strong>Exam challenge</strong><p>${esc(link.examChallenge)}</p></div></article>`;}
  function add(deck,context){
    if(deck.dataset.synopticEnhanced==='true'||!context.plan?.links?.length)return;deck.dataset.synopticEnhanced='true';
    const slide=document.createElement('article');slide.className='presentation-slide slide-synoptic';slide.hidden=true;slide.dataset.slideLabel='Connect your science';
    slide.innerHTML=`<div class="presentation-slide-heading"><span>↔</span><div><small>Synoptic science</small><h2>Connect your science</h2></div></div><div class="synoptic-intro"><p>GCSE questions can combine ideas from different parts of science. Use these links to practise transferring the same scientific reasoning into a new context.</p></div><div class="synoptic-connection-grid">${context.plan.links.map(card).join('')}</div>`;
    const before=deck.querySelector('.slide-exam,.slide-plenary');if(before)before.parentNode.insertBefore(slide,before);else deck.querySelector('.presentation-stage')?.appendChild(slide);
    slide.querySelectorAll('[data-synoptic-reveal]').forEach(btn=>btn.addEventListener('click',()=>{const g=slide.querySelector(`[data-synoptic-guidance="${btn.dataset.synopticReveal}"]`);if(g)g.hidden=!g.hidden;}));
    slide.querySelectorAll('[data-synoptic-open]').forEach(btn=>btn.addEventListener('click',()=>{if(typeof openTopic==='function')openTopic(btn.dataset.synopticOpen);}));
    slide.querySelectorAll('[data-synoptic-save]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.synopticSave),link=context.plan.links[i],answer=slide.querySelector(`[data-synoptic-answer="${i}"]`)?.value.trim()||'';window.GCSE_COURSE_POLISH?.addNote?.(`${context.title} ↔ ${link.targetCode} ${link.targetTitle}\n${link.reason}\n\n${link.question}${answer?`\n\nMy connection:\n${answer}`:''}`,`${context.title} · synoptic connection`,'synoptic-review');}));
    rebuild(deck);
  }
  function scan(){if(state.activeTab!=='lessons')return;document.querySelectorAll('.lesson-presentation').forEach(deck=>{const c=ctx(deck);if(c)add(deck,c);});}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_SYNOPTIC_UI={scan,add,ctx};
})();
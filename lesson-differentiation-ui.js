(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const KEY='gcse-science-differentiation-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let saved=parse(localStorage.getItem(KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  function ctxFor(deck){
    const topic=activeTopic();if(!topic)return null;
    const title=deck.dataset.lessonTitle||deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    const plan=window.GCSE_LESSON_DIFFERENTIATION?.build?.(model,topic,topics);if(!plan)return null;
    const key=window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title)}`;
    return{topic,title,index,lesson,model,plan,key};
  }
  function supportHtml(plan){return `<div class="diff-mode-content diff-support-content"><div><span class="eyebrow">Support mode</span><h3>Build the answer in smaller steps</h3><p>${esc(plan.support.prompt)}</p></div><div class="diff-support-grid"><article><strong>Sentence starters</strong><ul>${plan.support.sentenceStarters.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article><strong>Step-by-step</strong><ol>${plan.support.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article>${plan.support.vocabulary.length?`<article><strong>Vocabulary focus</strong><ul>${plan.support.vocabulary.map(x=>`<li><b>${esc(x.term)}</b> — ${esc(x.definition)}</li>`).join('')}</ul></article>`:''}${plan.support.calculation.length?`<article><strong>Calculation scaffold</strong><ol>${plan.support.calculation.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article>`:''}</div></div>`;}
  function coreHtml(plan){return `<div class="diff-mode-content diff-core-content"><div><span class="eyebrow">Core mode</span><h3>Standard GCSE independence</h3><p>${esc(plan.core.prompt)}</p></div><ul class="diff-core-checklist">${plan.core.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;}
  function stretchHtml(plan){return `<div class="diff-mode-content diff-stretch-content"><div><span class="eyebrow">Stretch mode</span><h3>Transfer the science to unfamiliar contexts</h3><p>${esc(plan.stretch.tierNote)}</p></div><div class="diff-stretch-grid"><article><strong>Challenge</strong><p>${esc(plan.stretch.challenge)}</p></article><article><strong>Unfamiliar context</strong><p>${esc(plan.stretch.unfamiliar)}</p></article><article><strong>Synoptic link</strong><p>${esc(plan.stretch.synopticQuestion)}</p>${plan.stretch.synoptic.length?`<small>Useful links: ${plan.stretch.synoptic.map(esc).join(' · ')}</small>`:''}</article><article><strong>Evaluate</strong><p>${esc(plan.stretch.evaluation)}</p></article></div></div>`;}
  function modeFor(ctx){return saved[ctx.key]?.mode||'core';}
  function saveMode(ctx,mode){saved[ctx.key]={mode,updated:Date.now()};localStorage.setItem(KEY,JSON.stringify(saved));}
  function addInlineScaffolds(deck,ctx){
    deck.querySelectorAll('.question-pulse,.exam-studio-question').forEach(card=>{
      if(card.querySelector('.diff-inline-support'))return;
      const hint=document.createElement('aside');hint.className='diff-inline-support';hint.innerHTML=`<strong>Support prompt</strong><p>${esc(ctx.plan.support.sentenceStarters[2]||'This happens because…')}</p>`;card.insertBefore(hint,card.querySelector('textarea')||card.firstChild);
    });
    const practice=deck.querySelector('.slide-practice');if(practice&&!practice.querySelector('.diff-inline-stretch')){const challenge=document.createElement('aside');challenge.className='diff-inline-stretch';challenge.innerHTML=`<strong>Stretch challenge</strong><p>${esc(ctx.plan.stretch.synopticQuestion)}</p>`;practice.appendChild(challenge);}
  }
  function applyMode(deck,ctx,mode){
    const valid=['support','core','stretch'].includes(mode)?mode:'core';deck.dataset.differentiation=valid;saveMode(ctx,valid);
    deck.querySelectorAll('[data-diff-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.diffMode===valid));
    deck.querySelectorAll('.diff-mode-content').forEach(el=>el.hidden=!el.classList.contains(`diff-${valid}-content`));
    deck.querySelectorAll('.question-pulse textarea,.exam-studio-question textarea').forEach(area=>{
      area.placeholder=valid==='support'?'Use the sentence starters and write one scientific idea at a time…':valid==='stretch'?'Give a fully justified answer and connect the science to an unfamiliar context…':'Write a precise GCSE Science answer…';
    });
  }
  function upgrade(deck){
    if(deck.dataset.phase10Differentiation==='done')return;const ctx=ctxFor(deck);if(!ctx)return;deck.dataset.phase10Differentiation='done';
    const toolbar=deck.querySelector('.presentation-toolbar-actions');if(!toolbar)return;
    const control=document.createElement('div');control.className='differentiation-switch';control.setAttribute('aria-label','Lesson support level');control.innerHTML=`<button type="button" data-diff-mode="support">Support</button><button type="button" data-diff-mode="core">Core</button><button type="button" data-diff-mode="stretch">Stretch</button>`;toolbar.prepend(control);
    const panel=document.createElement('section');panel.className='lesson-differentiation-panel';panel.dataset.differentiationPanel='';panel.innerHTML=`${supportHtml(ctx.plan)}${coreHtml(ctx.plan)}${stretchHtml(ctx.plan)}`;
    const progress=deck.querySelector('.presentation-progress');progress?.insertAdjacentElement('afterend',panel);
    addInlineScaffolds(deck,ctx);
    control.querySelectorAll('[data-diff-mode]').forEach(btn=>btn.addEventListener('click',()=>applyMode(deck,ctx,btn.dataset.diffMode)));
    applyMode(deck,ctx,modeFor(ctx));
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_DIFFERENTIATION_UI={scan,upgrade,applyMode};
})();
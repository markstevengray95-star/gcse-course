(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const KEY='gcse-science-deep-understanding-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let saved=parse(localStorage.getItem(KEY),{});
  const persist=()=>localStorage.setItem(KEY,JSON.stringify(saved));
  function context(deck){
    const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return null;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const title=deck.dataset.lessonTitle||'';const index=lessons.findIndex(([name])=>name===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model?.enrichment)return null;
    return {topic,title,index,lesson,model,key:model.id};
  }
  function panelHtml(ctx){
    const e=ctx.model.enrichment;const response=saved[ctx.key]?.cer||'';
    return `<section class="deep-understanding-panel" data-deep-understanding><div class="deep-understanding-head"><div><span class="eyebrow">Deepen understanding</span><h3>Reason it through, don’t just recall it</h3></div><span class="deep-version">Evidence pass</span></div><div class="reasoning-chain">${e.reasoning.map((step,i)=>`<button type="button" data-reason-step="${i}" aria-expanded="${i===0?'true':'false'}"><span>${i+1}</span><strong>${esc(step.label)}</strong><p ${i===0?'':'hidden'}>${esc(step.text)}</p></button>`).join('')}</div><div class="dual-representation"><span class="eyebrow">Two ways to represent the same science</span><div>${e.representations.map(r=>`<article><strong>${esc(r.label)}</strong><p>${esc(r.text)}</p></article>`).join('')}</div></div><article class="cer-challenge"><span class="eyebrow">Claim → evidence → reasoning</span><p>${esc(e.evidenceChallenge)}</p><textarea rows="3" data-cer-response placeholder="Write a claim, evidence and reasoning…">${esc(response)}</textarea><div class="deep-actions"><button type="button" data-save-cer>Save response</button><button type="button" data-note-cer>＋ Notebook</button></div></article><details class="misconception-repair"><summary>Repair a misconception</summary><p><strong>Incorrect / incomplete:</strong> ${esc(e.misconceptionRepair.incorrect)}</p><p><strong>Your task:</strong> ${esc(e.misconceptionRepair.prompt)}</p><details><summary>Reveal scientific correction</summary><p>${esc(e.misconceptionRepair.model)}</p></details></details><div class="transfer-challenge"><strong>Transfer challenge</strong><p>${esc(e.transferChallenge)}</p></div></section>`;
  }
  function inject(deck){
    if(deck.dataset.deepUnderstanding==='true')return;const ctx=context(deck);if(!ctx)return;
    const slide=deck.querySelector('.slide-teach');if(!slide)return;slide.insertAdjacentHTML('beforeend',panelHtml(ctx));deck.dataset.deepUnderstanding='true';
    const panel=slide.querySelector('[data-deep-understanding]');
    panel?.querySelectorAll('[data-reason-step]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.querySelector('p'),open=p?.hidden===false;panel.querySelectorAll('[data-reason-step] p').forEach(x=>x.hidden=true);panel.querySelectorAll('[data-reason-step]').forEach(x=>x.setAttribute('aria-expanded','false'));if(p){p.hidden=open;btn.setAttribute('aria-expanded',String(!open));}}));
    const area=panel?.querySelector('[data-cer-response]');
    panel?.querySelector('[data-save-cer]')?.addEventListener('click',()=>{saved[ctx.key]={...(saved[ctx.key]||{}),cer:area?.value||'',updatedAt:Date.now()};persist();});
    panel?.querySelector('[data-note-cer]')?.addEventListener('click',()=>{const text=(area?.value||'').trim();if(text)window.GCSE_COURSE_POLISH?.addNote?.(`Deep understanding · ${ctx.title}\n${text}`,`${ctx.title} · reasoning`,'presentation-response');});
    const terms=deck.querySelector('.slide-terms');if(terms&&!terms.querySelector('.precision-language-strip')&&ctx.model.enrichment.languageFocus.length){terms.insertAdjacentHTML('beforeend',`<div class="precision-language-strip"><strong>Precision language</strong>${ctx.model.enrichment.languageFocus.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`);}
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(inject);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_QUALITY_ENRICHMENT_UI={scan,inject};
})();
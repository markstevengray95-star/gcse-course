(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const KEY='gcse-science-explanation-mastery-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let saved=parse(localStorage.getItem(KEY),{});
  const persist=()=>localStorage.setItem(KEY,JSON.stringify(saved));

  function context(deck){
    const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return null;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const title=deck.dataset.lessonTitle||'';const index=lessons.findIndex(([name])=>name===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);
    if(!model?.overhaul21||!model?.overhaul22)return null;
    return {topic,title,index,lesson,model,key:model.id};
  }

  function phase21Html(ctx){
    const p=ctx.model.overhaul21;const response=saved[ctx.key]?.explanation||'';
    return `<section class="phase21-explanation-panel" data-phase21><div class="phase2122-head"><div><span class="eyebrow">Phase 21 · Scientific explanation mastery</span><h3>Build the explanation as a reasoning chain</h3></div><span class="phase2122-chip">Cause → mechanism → outcome</span></div><p class="phase2122-prompt">${esc(p.explanationFrame.prompt)}</p><div class="phase21-chain">${p.explanationFrame.steps.map((step,i)=>`<details ${i===0?'open':''}><summary><span>${i+1}</span>${esc(step.label.replace(/^\d+\s*·\s*/,''))}</summary><p>${esc(step.text)}</p></details>`).join('')}</div><div class="phase21-language"><strong>Precision language</strong>${p.precisionTerms.map(term=>`<span>${esc(term)}</span>`).join('')}</div><article class="phase21-write"><strong>Extended-response rehearsal</strong><p>${esc(p.extendedResponsePrompt)}</p><textarea rows="4" data-phase21-response placeholder="Write your scientific explanation…">${esc(response)}</textarea><div class="phase2122-actions"><button type="button" data-phase21-save>Save response</button><button type="button" data-phase21-note>＋ Notebook</button></div></article><details class="phase21-check"><summary>Self-check before moving on</summary><ul>${p.selfCheck.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details></section>`;
  }

  function phase22Html(ctx){
    const p=ctx.model.overhaul22;
    return `<section class="phase22-variety-panel" data-phase22><div class="phase2122-head"><div><span class="eyebrow">Phase 22 · Visual reasoning & question variety</span><h3>Predict, read, explain, transfer</h3></div><span class="phase2122-chip">Active science</span></div><div class="phase22-cycle">${p.visualReasoning.map((step,i)=>`<article><span>${i+1}</span><strong>${esc(step.label)}</strong><p>${esc(step.prompt)}</p></article>`).join('')}</div><div class="phase22-questions"><div class="phase22-section-head"><strong>Command-word workout</strong><span>6 different thinking moves</span></div>${p.questionSet.map((q,i)=>`<details><summary><span>${esc(q.command)}</span>${esc(q.prompt)}</summary><p>${esc(q.guidance)}</p></details>`).join('')}</div><article class="phase22-interleave"><span class="eyebrow">Interleave the learning</span><h4>${esc(p.interleave.linkLesson)}</h4><p>${esc(p.interleave.prompt)}</p><small>${esc(p.interleave.examLink)}</small></article><div class="phase22-mode-row">${p.interactionModes.map(mode=>`<span>${esc(mode)}</span>`).join('')}</div></section>`;
  }

  function bind21(panel,ctx){
    const area=panel.querySelector('[data-phase21-response]');
    panel.querySelector('[data-phase21-save]')?.addEventListener('click',()=>{
      saved[ctx.key]={...(saved[ctx.key]||{}),explanation:area?.value||'',updatedAt:Date.now()};persist();
    });
    panel.querySelector('[data-phase21-note]')?.addEventListener('click',()=>{
      const text=(area?.value||'').trim();if(!text)return;
      window.GCSE_COURSE_POLISH?.addNote?.(`Explanation mastery · ${ctx.title}\n${text}`,`${ctx.title} · explanation`,'presentation-response');
    });
  }

  function inject(deck){
    if(deck.dataset.phase2122==='true')return;const ctx=context(deck);if(!ctx)return;
    const teach=deck.querySelector('.slide-teach')||deck.querySelector('.presentation-slide');
    const practice=deck.querySelector('.slide-practice')||deck.querySelector('.slide-exam')||deck.querySelectorAll('.presentation-slide')[Math.max(0,deck.querySelectorAll('.presentation-slide').length-2)];
    if(teach&&!teach.querySelector('[data-phase21]')){teach.insertAdjacentHTML('beforeend',phase21Html(ctx));bind21(teach.querySelector('[data-phase21]'),ctx);}
    if(practice&&!practice.querySelector('[data-phase22]'))practice.insertAdjacentHTML('beforeend',phase22Html(ctx));
    deck.dataset.phase2122='true';
  }

  function scan(){document.querySelectorAll('.lesson-presentation').forEach(inject);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(scan);
  window.GCSE_LESSON_OVERHAUL_PHASE2122_UI={scan,inject};
})();

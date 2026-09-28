(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const KEY='gcse-science-presentation-mastery-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  function context(deck){
    const topic=activeTopic();if(!topic)return null;
    const title=deck?.dataset.lessonTitle||'';const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const index=Math.max(0,lessons.findIndex(([name])=>name===title));if(!title||index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    const saved=parse(localStorage.getItem(KEY),{}),stateMap=saved[model.id]||{};
    const plan=window.GCSE_LESSON_MASTERY_ACTIONS?.build?.(model,stateMap);return{topic,title,index,lesson,model,plan};
  }
  function jump(deck,target){
    let slide=null;
    if(target.startsWith('specpoint:'))slide=[...deck.querySelectorAll('.slide-specpoint')][Number(target.split(':')[1])];
    else if(target.startsWith('specapply:'))slide=[...deck.querySelectorAll('.slide-specapply')][Number(target.split(':')[1])];
    else if(target==='exam')slide=deck.querySelector('.slide-exam');
    else if(target==='equationcoach')slide=deck.querySelector('.slide-equationcoach');
    else if(target==='practical')slide=deck.querySelector('.slide-spec');
    if(!slide)return;
    const index=[...deck.querySelectorAll('.presentation-slide')].indexOf(slide);if(index>=0)window.GCSE_PRESENTATION_LESSONS?.showSlide?.(deck,index);
    deck.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function rowHtml(point){
    const stateLabel=point.state==='review'?'Review':point.state==='developing'?'Developing':point.state==='secure'?'Secure':'Not rated';
    return `<article class="mastery-action-row state-${esc(point.state)}" data-mastery-action-row="${point.index}"><div class="mastery-action-copy"><span>${point.index+1}</span><div><small>${stateLabel}</small><strong>${esc(point.text)}</strong><p>Recommended: ${esc(point.recommended?.label||'Review this point')}</p></div></div><div class="mastery-action-buttons">${point.actions.slice(0,5).map(a=>`<button type="button" data-mastery-target="${esc(a.target)}" title="${esc(a.detail)}">${esc(a.label)}</button>`).join('')}</div></article>`;
  }
  function render(deck,ctx){
    const existing=deck.parentElement?.querySelector('.targeted-mastery-plan');existing?.remove();
    const plan=ctx.plan;if(!plan)return;
    const panel=document.createElement('section');panel.className='targeted-mastery-plan';panel.dataset.targetedMastery='';
    panel.innerHTML=`<div class="targeted-mastery-head"><div><span class="eyebrow">Targeted AQA revision</span><h3>${plan.weak.length?`${plan.weak.length} specification point${plan.weak.length===1?'':'s'} to work on`:'All specification points secure'}</h3><p>${plan.weak.length?'Your next actions are based on the mastery states you saved above.':'Keep these secure with spaced retrieval and exam practice.'}</p></div><div class="mastery-summary-chips"><span>${plan.summary.review} Review</span><span>${plan.summary.developing} Developing</span><span>${plan.summary.secure} Secure</span></div></div>${plan.weak.length?`<div class="mastery-action-list">${plan.weak.map(rowHtml).join('')}</div><div class="targeted-mastery-footer"><button type="button" data-save-target-plan>＋ Save targeted review plan</button>${plan.next?`<button type="button" class="primary" data-master-next="${esc(plan.next.target)}">Do next action → ${esc(plan.next.label)}</button>`:''}</div>`:`<div class="mastery-secure-message"><strong>✓ Lesson mastery complete</strong><p>Use Exam Studio or retrieval practice later to keep the learning secure.</p></div>`}`;
    const mastery=deck.parentElement?.querySelector('.lesson-presentation-mastery');if(mastery)mastery.insertAdjacentElement('afterend',panel);else deck.insertAdjacentElement('afterend',panel);
    panel.querySelectorAll('[data-mastery-target]').forEach(btn=>btn.addEventListener('click',()=>jump(deck,btn.dataset.masteryTarget)));
    panel.querySelector('[data-master-next]')?.addEventListener('click',e=>jump(deck,e.currentTarget.dataset.masterNext));
    panel.querySelector('[data-save-target-plan]')?.addEventListener('click',()=>{
      const text=plan.weak.map(p=>`• ${p.text}\n  ${p.recommended.label}: ${p.recommended.detail}`).join('\n\n');
      window.GCSE_COURSE_POLISH?.addNote?.(`AQA ${plan.ref} · ${plan.title}\n\n${text}`,`${plan.title} · targeted mastery plan`,'mastery-review');
    });
  }
  function upgrade(deck){
    if(!deck)return;const ctx=context(deck);if(!ctx)return;render(deck,ctx);
  }
  function scan(){if(state.activeTab!=='lessons')return;document.querySelectorAll('.lesson-presentation').forEach(upgrade);}
  const observer=new MutationObserver(()=>requestAnimationFrame(scan));observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',e=>{if(e.key===KEY)requestAnimationFrame(scan);});
  requestAnimationFrame(scan);
  window.GCSE_LESSON_MASTERY_ACTIONS_UI={scan,upgrade,jump};
})();
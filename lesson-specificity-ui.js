(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const teacher=()=>localStorage.getItem('gcse-science-presentation-mode-v1')==='teacher'||new URLSearchParams(location.search).get('qa')==='1';
  function inject(deck){
    if(!teacher()||deck.dataset.specificityReviewed==='true')return;const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons,title=deck.dataset.lessonTitle||'',index=lessons.findIndex(([name])=>name===title);if(index<0)return;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index),model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return;
    const practical=model.practical?window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,title,model):null,questions=window.GCSE_LESSON_QUESTION_LADDER?.build?.(model,practical)||[],review=window.GCSE_LESSON_SPECIFICITY_REVIEW?.evaluate?.(model,questions);if(!review)return;
    const toolbar=deck.querySelector('.presentation-toolbar-actions');if(!toolbar)return;const btn=document.createElement('button');btn.type='button';btn.className='lesson-specificity-badge';btn.textContent=`Specificity ${review.percent}%`;btn.title=review.warnings.length?`${review.warnings.length} specificity issue(s)`:'Lesson-specific wording and structure passed';toolbar.prepend(btn);deck.dataset.specificityReviewed='true';
    btn.addEventListener('click',()=>{let panel=deck.parentElement?.querySelector('.lesson-specificity-detail');if(panel){panel.remove();return;}panel=document.createElement('section');panel.className='lesson-specificity-detail';panel.innerHTML=`<span class="eyebrow">Independent specificity review</span><h3>${esc(title)} · ${review.percent}%</h3><p>${review.warnings.length?'Some wording or structure could still be made more lesson-specific.':'Reasoning, representations, questions and teaching chunks are lesson-specific with no generic fallback copy detected.'}</p>${review.warnings.length?`<ul>${review.warnings.map(w=>`<li><strong>${esc(w.label)}:</strong> ${esc(w.detail)}</li>`).join('')}</ul>`:''}`;deck.insertAdjacentElement('afterend',panel);});
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(inject);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_SPECIFICITY_UI={scan,inject};
})();
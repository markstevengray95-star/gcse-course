(() => {
  const spec=window.GCSE_CHEMISTRY_SPEC_DETAIL;
  if(!spec) return;
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const isChemistry=topic=>topic?.subject==='chemistry';
  const scopeLabel=meta=>meta.scope==='triple'?'Separate Chemistry only':'Combined + Separate Chemistry';
  const tierLabel=meta=>meta.tier==='higher'?'Higher Tier':'Foundation + Higher';

  function detailCard(meta){
    if(!meta) return '';
    return `<section class="chemistry-spec-card">
      <div class="chemistry-spec-card-head"><div><span class="eyebrow">AQA Chemistry specification</span><h3>${esc(meta.ref)} · ${esc(meta.section)}</h3></div><div class="chemistry-spec-badges"><span>${esc(scopeLabel(meta))}</span><span class="${meta.tier==='higher'?'higher-tier':''}">${esc(tierLabel(meta))}</span></div></div>
      <div class="chemistry-spec-focus"><strong>Specification mastery</strong><ul>${meta.focus.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
      ${meta.equations?.length?`<div class="chemistry-spec-equations"><strong>Maths / equations</strong>${meta.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}
      ${meta.practical?`<div class="chemistry-spec-practical"><strong>Required practical link</strong><span>${esc(meta.practical)}</span></div>`:''}
    </section>`;
  }

  if(typeof lessonExpandedHtml==='function'){
    const baseLessonExpandedHtml=lessonExpandedHtml;
    lessonExpandedHtml=function(lesson){
      const original=baseLessonExpandedHtml(lesson);
      const topicId=state?.activeTopicId;
      const topic=window.GCSE_COURSE_DATA?.topics?.find(t=>t.id===topicId);
      if(!isChemistry(topic)) return original;
      const meta=spec.getLesson(topicId,lesson?.title); if(!meta) return original;
      return original.replace(/<\/div><\/div>$/,`${detailCard(meta)}</div></div>`);
    };
  }

  function specificationMapHtml(topic){
    const topicSpec=spec.topics[topic.id]; if(!topicSpec) return '';
    const visibleCount=typeof visibleLessons==='function'?visibleLessons(topic).length:topic.lessons.length;
    const totalCount=topicSpec.sections.reduce((n,s)=>n+s.lessons.length,0);
    return `<section class="panel content-panel chemistry-spec-map"><div class="chemistry-map-heading"><div><span class="eyebrow">Official course structure</span><h2>AQA ${esc(topicSpec.spec)} · ${esc(topicSpec.title)}</h2><p>Paper ${topicSpec.paper} · ${visibleCount} lessons visible in the current course mode${visibleCount!==totalCount?` · ${totalCount} in Separate Chemistry`:''}</p></div><span class="chemistry-spec-code">${esc(topicSpec.spec)}</span></div>
    <div class="chemistry-section-list">${topicSpec.sections.map(section=>{const visible=section.lessons.filter(l=>state.mode==='triple'||l.scope!=='triple');if(!visible.length)return '';return `<article class="chemistry-section-card"><div class="chemistry-section-title"><span>${esc(section.ref)}</span><strong>${esc(section.title)}</strong></div><div class="chemistry-sublesson-list">${visible.map(l=>`<div><span>${esc(l.title)}</span><small>${esc(l.ref)}${l.tier==='higher'?' · Higher Tier':''}${l.scope==='triple'?' · Chemistry only':''}</small></div>`).join('')}</div></article>`;}).join('')}</div><p class="chemistry-spec-note">AQA 4.11 Key ideas are embedded throughout these lessons rather than shown as a separate exam topic. Higher Tier content is labelled; Chemistry-only lessons are hidden in Combined Science mode.</p></section>`;
  }

  function decorateLessonCards(topic){
    if(!isChemistry(topic)) return;
    els.topicContent.querySelectorAll('.lesson-card').forEach(card=>{
      const title=card.querySelector('.lesson-card-title')?.textContent?.trim();
      const meta=spec.getLesson(topic.id,title); const head=card.querySelector('.lesson-card-head');
      if(!meta||!head||head.querySelector('.chemistry-mini-badges')) return;
      const wrap=document.createElement('span');wrap.className='chemistry-mini-badges';
      wrap.innerHTML=`<span>${esc(meta.ref)}</span>${meta.tier==='higher'?'<span class="higher-tier">HT</span>':''}${meta.scope==='triple'?'<span>Chemistry only</span>':''}`;
      const open=head.querySelector('.lesson-open'); if(open) head.insertBefore(wrap,open); else head.appendChild(wrap);
    });
  }

  if(typeof renderTopicContent==='function'){
    const baseRenderTopicContent=renderTopicContent;
    renderTopicContent=function(topic){baseRenderTopicContent(topic);if(!isChemistry(topic))return;if(state.activeTab==='overview')els.topicContent.insertAdjacentHTML('beforeend',specificationMapHtml(topic));if(state.activeTab==='lessons')decorateLessonCards(topic);};
  }
  window.GCSE_CHEMISTRY_SPEC_UI={detailCard,specificationMapHtml};
})();
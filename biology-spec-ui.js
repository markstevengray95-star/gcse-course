(() => {
  const spec=window.GCSE_BIOLOGY_SPEC_DETAIL;
  if(!spec) return;
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const isBiologyTopic=topic=>topic?.subject==='biology';
  const scopeLabel=meta=>meta.scope==='triple'?'Separate Biology only':'Combined + Separate Biology';
  const tierLabel=meta=>meta.tier==='higher'?'Higher Tier':'Foundation + Higher';

  function detailCard(meta){
    if(!meta) return '';
    return `<section class="biology-spec-card">
      <div class="biology-spec-card-head">
        <div><span class="eyebrow">AQA Biology specification</span><h3>${esc(meta.ref)} · ${esc(meta.section)}</h3></div>
        <div class="biology-spec-badges"><span>${esc(scopeLabel(meta))}</span><span class="${meta.tier==='higher'?'higher-tier':''}">${esc(tierLabel(meta))}</span></div>
      </div>
      <div class="biology-spec-focus"><strong>Specification mastery</strong><ul>${meta.focus.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
      ${meta.practical?`<div class="biology-spec-practical"><strong>Required practical link</strong><span>${esc(meta.practical)}</span></div>`:''}
    </section>`;
  }

  if(typeof lessonExpandedHtml==='function'){
    const baseLessonExpandedHtml=lessonExpandedHtml;
    lessonExpandedHtml=function(lesson){
      const original=baseLessonExpandedHtml(lesson);
      const topicId=state?.activeTopicId;
      const topic=window.GCSE_COURSE_DATA?.topics?.find(t=>t.id===topicId);
      if(!isBiologyTopic(topic)) return original;
      const meta=spec.getLesson(topicId,lesson?.title);
      if(!meta) return original;
      return original.replace(/<\/div><\/div>$/,`${detailCard(meta)}</div></div>`);
    };
  }

  function specificationMapHtml(topic){
    const topicSpec=spec.topics[topic.id]; if(!topicSpec) return '';
    const visibleCount=typeof visibleLessons==='function'?visibleLessons(topic).length:topic.lessons.length;
    const totalCount=topicSpec.sections.reduce((n,s)=>n+s.lessons.length,0);
    return `<section class="panel content-panel biology-spec-map">
      <div class="biology-map-heading">
        <div><span class="eyebrow">Official course structure</span><h2>AQA ${esc(topicSpec.spec)} · ${esc(topicSpec.title)}</h2><p>Paper ${topicSpec.paper} · ${visibleCount} lessons visible in the current course mode${visibleCount!==totalCount?` · ${totalCount} in Separate Biology`:''}</p></div>
        <span class="biology-spec-code">${esc(topicSpec.spec)}</span>
      </div>
      <div class="biology-section-list">${topicSpec.sections.map(section=>{
        const visible=section.lessons.filter(l=>state.mode==='triple'||l.scope!=='triple'); if(!visible.length) return '';
        return `<article class="biology-section-card"><div class="biology-section-title"><span>${esc(section.ref)}</span><strong>${esc(section.title)}</strong></div><div class="biology-sublesson-list">${visible.map(l=>`<div><span>${esc(l.title)}</span><small>${esc(l.ref)}${l.tier==='higher'?' · Higher Tier':''}${l.scope==='triple'?' · Biology only':''}</small></div>`).join('')}</div></article>`;
      }).join('')}</div>
      <p class="biology-spec-note">AQA 4.8 Key ideas are embedded across these seven assessed topics. Higher Tier content is labelled rather than hidden; Biology-only content is hidden automatically in Combined Science mode.</p>
    </section>`;
  }

  function decorateLessonCards(topic){
    if(!isBiologyTopic(topic)) return;
    els.topicContent.querySelectorAll('.lesson-card').forEach(card=>{
      const title=card.querySelector('.lesson-card-title')?.textContent?.trim();
      const meta=spec.getLesson(topic.id,title);
      const head=card.querySelector('.lesson-card-head');
      if(!meta||!head||head.querySelector('.biology-mini-badges')) return;
      const wrap=document.createElement('span'); wrap.className='biology-mini-badges';
      wrap.innerHTML=`<span>${esc(meta.ref)}</span>${meta.tier==='higher'?'<span class="higher-tier">HT</span>':''}${meta.scope==='triple'?'<span>Biology only</span>':''}`;
      const open=head.querySelector('.lesson-open'); if(open) head.insertBefore(wrap,open); else head.appendChild(wrap);
    });
  }

  if(typeof renderTopicContent==='function'){
    const baseRenderTopicContent=renderTopicContent;
    renderTopicContent=function(topic){
      baseRenderTopicContent(topic);
      if(!isBiologyTopic(topic)) return;
      if(state.activeTab==='overview') els.topicContent.insertAdjacentHTML('beforeend',specificationMapHtml(topic));
      if(state.activeTab==='lessons') decorateLessonCards(topic);
    };
  }

  window.GCSE_BIOLOGY_SPEC_UI={detailCard,specificationMapHtml};
})();
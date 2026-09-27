(() => {
  const spec = window.GCSE_PHYSICS_SPEC_DETAIL;
  if (!spec) return;

  const esc = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const isPhysicsTopic = topic => topic?.subject === 'physics';

  function lessonMeta(topicId, title){
    return spec.getLesson(topicId, title);
  }

  function scopeLabel(meta){
    return meta.scope === 'triple' ? 'Separate Physics only' : 'Combined + Separate Physics';
  }

  function tierLabel(meta){
    return meta.tier === 'higher' ? 'Higher Tier' : 'Foundation + Higher';
  }

  function detailCard(meta){
    if(!meta) return '';
    return `<section class="physics-spec-card">
      <div class="physics-spec-card-head">
        <div><span class="eyebrow">AQA Physics specification</span><h3>${esc(meta.ref)} · ${esc(meta.section)}</h3></div>
        <div class="physics-spec-badges"><span>${esc(scopeLabel(meta))}</span><span class="${meta.tier==='higher'?'higher-tier':''}">${esc(tierLabel(meta))}</span></div>
      </div>
      <div class="physics-spec-focus">
        <strong>Specification mastery</strong>
        <ul>${meta.focus.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </div>
      ${meta.equations?.length?`<div class="physics-spec-equations"><strong>Equations used in this lesson</strong>${meta.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`:''}
      ${meta.practical?`<div class="physics-spec-practical"><strong>Required practical link</strong><span>${esc(meta.practical)}</span></div>`:''}
    </section>`;
  }

  if(typeof lessonExpandedHtml === 'function'){
    const baseLessonExpandedHtml = lessonExpandedHtml;
    lessonExpandedHtml = function(lesson){
      const original = baseLessonExpandedHtml(lesson);
      const topicId = state?.activeTopicId;
      const topic = window.GCSE_COURSE_DATA?.topics?.find(t=>t.id===topicId);
      if(!isPhysicsTopic(topic)) return original;
      const meta = lessonMeta(topicId, lesson?.title);
      if(!meta) return original;
      return original.replace(/<\/div><\/div>$/, `${detailCard(meta)}</div></div>`);
    };
  }

  function specificationMapHtml(topic){
    const topicSpec = spec.topics[topic.id];
    if(!topicSpec) return '';
    const visibleCount = typeof visibleLessons === 'function' ? visibleLessons(topic).length : topic.lessons.length;
    const totalCount = topicSpec.sections.reduce((n,s)=>n+s.lessons.length,0);
    return `<section class="panel content-panel physics-spec-map">
      <div class="physics-map-heading">
        <div><span class="eyebrow">Official course structure</span><h2>AQA ${esc(topicSpec.spec)} · ${esc(topicSpec.title)}</h2><p>Paper ${topicSpec.paper} · ${visibleCount} lessons visible in the current course mode${visibleCount!==totalCount?` · ${totalCount} in Separate Physics`:''}</p></div>
        <span class="physics-spec-code">${esc(topicSpec.spec)}</span>
      </div>
      <div class="physics-section-list">
        ${topicSpec.sections.map(section=>{
          const visible = section.lessons.filter(l=>state.mode==='triple'||l.scope!=='triple');
          if(!visible.length) return '';
          return `<article class="physics-section-card">
            <div class="physics-section-title"><span>${esc(section.ref)}</span><strong>${esc(section.title)}</strong></div>
            <div class="physics-sublesson-list">${visible.map(l=>`<div><span>${esc(l.title)}</span><small>${esc(l.ref)}${l.tier==='higher'?' · Higher Tier':''}${l.scope==='triple'?' · Physics only':''}</small></div>`).join('')}</div>
          </article>`;
        }).join('')}
      </div>
      <p class="physics-spec-note">Higher Tier material is labelled rather than removed. Physics-only material is hidden automatically when Combined Science mode is selected.</p>
    </section>`;
  }

  function decorateLessonCards(topic){
    if(!isPhysicsTopic(topic)) return;
    els.topicContent.querySelectorAll('.lesson-card').forEach(card=>{
      const title = card.querySelector('.lesson-card-title')?.textContent?.trim();
      const meta = lessonMeta(topic.id,title);
      const head = card.querySelector('.lesson-card-head');
      if(!meta||!head||head.querySelector('.physics-mini-badges')) return;
      const wrap=document.createElement('span');
      wrap.className='physics-mini-badges';
      wrap.innerHTML=`<span>${esc(meta.ref)}</span>${meta.tier==='higher'?'<span class="higher-tier">HT</span>':''}${meta.scope==='triple'?'<span>Physics only</span>':''}`;
      const open=head.querySelector('.lesson-open');
      if(open) head.insertBefore(wrap,open); else head.appendChild(wrap);
    });
  }

  if(typeof renderTopicContent === 'function'){
    const baseRenderTopicContent = renderTopicContent;
    renderTopicContent = function(topic){
      baseRenderTopicContent(topic);
      if(!isPhysicsTopic(topic)) return;
      if(state.activeTab==='overview'){
        els.topicContent.insertAdjacentHTML('beforeend', specificationMapHtml(topic));
      }
      if(state.activeTab==='lessons') decorateLessonCards(topic);
    };
  }

  window.GCSE_PHYSICS_SPEC_UI={detailCard,specificationMapHtml};
})();
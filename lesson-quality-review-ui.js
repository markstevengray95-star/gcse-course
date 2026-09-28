(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const qaVisible=()=>localStorage.getItem('gcse-science-presentation-mode-v1')==='teacher'||new URLSearchParams(location.search).get('qa')==='1';
  let cached=null;
  function report(){
    if(cached)return cached;const data=window.GCSE_COURSE_DATA,rich=window.GCSE_RICH_CONTENT,catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;if(!data||!rich||!catalog)return null;
    cached=window.GCSE_LESSON_QUALITY_REVIEW?.courseReview?.(data,rich,catalog)||null;return cached;
  }
  const subjectLabel=s=>s==='biology'?'Biology':s==='chemistry'?'Chemistry':'Physics';
  function topicRow(topic){
    return `<article class="qa-topic-row ${topic.ready===topic.total?'ready':'needs-work'}" data-qa-topic="${esc(topic.id)}"><div><span>${esc(topic.code)}</span><div><strong>${esc(topic.title)}</strong><small>${topic.ready}/${topic.total} lessons ready · minimum ${topic.min}%</small></div></div><div class="qa-score"><b>${topic.average}%</b><i style="width:${topic.average}%"></i></div><button type="button">Open topic</button></article>`;
  }
  function subjectCard(subject,index){return `<section class="qa-subject-card"><header><div><span class="eyebrow">Stage ${index+1}</span><h3>${subjectLabel(subject.subject)}</h3></div><div class="qa-subject-score"><strong>${subject.average}%</strong><small>${subject.ready}/${subject.total} ready</small></div></header><div class="qa-topic-list">${subject.topics.map(topicRow).join('')}</div></section>`;}
  function homeDashboard(){
    if(!qaVisible())return;const home=document.getElementById('homeView');if(!home||home.querySelector('.course-quality-dashboard'))return;const r=report();if(!r)return;
    const panel=document.createElement('section');panel.className='course-quality-dashboard panel';panel.innerHTML=`<div class="qa-dashboard-head"><div><span class="eyebrow">Teacher · course build QA</span><h2>Subject-by-subject lesson quality</h2><p>Internal development score only. A lesson is considered ready at ${r.readyScore}+; this is not a student grade.</p></div><div class="qa-overall"><strong>${r.average}%</strong><span>${r.ready}/${r.total} lessons ready</span></div></div><div class="qa-rebuild-order"><strong>Rebuild order</strong><span>Biology → Chemistry → Physics</span></div><div class="qa-subject-grid">${r.subjects.map(subjectCard).join('')}</div>`;
    const anchor=home.querySelector('.control-panel');anchor?.insertAdjacentElement('afterend',panel);
    panel.querySelectorAll('[data-qa-topic]').forEach(row=>row.querySelector('button')?.addEventListener('click',()=>{if(typeof openTopic==='function')openTopic(row.dataset.qaTopic);}));
  }
  function lessonBadge(deck){
    if(!qaVisible()||deck.dataset.qaBadged==='true')return;const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return;const title=deck.dataset.lessonTitle||'';const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;const index=lessons.findIndex(([name])=>name===title);if(index<0)return;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index),model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson),review=window.GCSE_LESSON_QUALITY_REVIEW?.review?.(model,topic,lesson,topics);if(!review)return;deck.dataset.qaBadged='true';
    const toolbar=deck.querySelector('.presentation-toolbar-actions');if(!toolbar)return;const btn=document.createElement('button');btn.type='button';btn.className='lesson-qa-badge';btn.textContent=`QA ${review.percent}%`;btn.title=review.ready?'Lesson meets the internal 90+ quality standard':`${review.gaps.length} quality gaps remain`;toolbar.prepend(btn);
    btn.addEventListener('click',()=>{let p=deck.parentElement?.querySelector('.lesson-qa-detail');if(p){p.remove();return;}p=document.createElement('section');p.className='lesson-qa-detail';p.innerHTML=`<div><span class="eyebrow">Internal lesson QA</span><h3>${esc(review.title)} · ${review.percent}%</h3><p>${review.ready?'Ready against the current quality standard.':'Needs further development before it reaches the 90+ standard.'}</p></div><div class="qa-category-grid">${review.categories.map(c=>`<article><strong>${esc(c.label)}</strong><span>${c.score}/${c.max}</span><i style="width:${Math.round(c.score/c.max*100)}%"></i></article>`).join('')}</div>${review.gaps.length?`<div class="qa-gap-list"><strong>Priority gaps</strong><ul>${review.gaps.map(g=>`<li><b>${esc(g.category)}:</b> ${esc(g.detail)}</li>`).join('')}</ul></div>`:''}`;deck.insertAdjacentElement('afterend',p);});
  }
  function topicQa(){
    if(!qaVisible()||state.activeTab!=='coach')return;const root=document.getElementById('topicContent'),topic=topics.find(t=>t.id===state.activeTopicId);if(!root||!topic||root.querySelector('.topic-quality-panel'))return;const r=report(),t=r?.subjects.flatMap(s=>s.topics).find(x=>x.id===topic.id);if(!t)return;
    const panel=document.createElement('section');panel.className='panel content-panel topic-quality-panel';panel.innerHTML=`<span class="eyebrow">Teacher · topic QA</span><h2>${esc(t.code)} ${esc(t.title)} · ${t.average}%</h2><p>${t.ready}/${t.total} lessons meet the ${r.readyScore}+ internal quality standard. Lowest lesson score: ${t.min}%.</p>${t.queue.length?`<div class="qa-lesson-queue">${t.queue.map(x=>`<button type="button" data-qa-lesson="${x.lessonId}"><span>${x.percent}%</span><strong>${esc(x.title)}</strong><small>${x.gaps[0]?esc(x.gaps[0].category):'Review lesson quality'}</small></button>`).join('')}</div>`:'<div class="qa-all-ready">✓ Every lesson in this topic currently meets the quality threshold.</div>'}`;root.prepend(panel);
    panel.querySelectorAll('[data-qa-lesson]').forEach(btn=>btn.addEventListener('click',()=>{const row=t.queue.find(x=>x.lessonId===btn.dataset.qaLesson);if(!row)return;state.activeTab='lessons';const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;state.activeLessonIndex=lessons.findIndex(([name])=>name===row.title);renderTopic();}));
  }
  function scan(){homeDashboard();topicQa();document.querySelectorAll('.lesson-presentation').forEach(lessonBadge);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_QUALITY_REVIEW_UI={scan,report,qaVisible};
})();
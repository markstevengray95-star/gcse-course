(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const teacher=()=>localStorage.getItem('gcse-science-presentation-mode-v1')==='teacher'||new URLSearchParams(location.search).get('qa')==='1';
  let cache=null;
  const subjectName=s=>s==='biology'?'Biology':s==='chemistry'?'Chemistry':'Physics';
  function report(){
    if(cache)return cache;
    const data=window.GCSE_COURSE_DATA,rich=window.GCSE_RICH_CONTENT,catalog=window.GCSE_LESSON_PRESENTATION_CATALOG;
    if(!data||!rich||!catalog)return null;
    cache=window.GCSE_LESSON_QUALITY_EVIDENCE?.courseEvidence?.(data,rich,catalog)||null;
    return cache;
  }
  function bandClass(b){return String(b||'').toLowerCase().replace(/\s+/g,'-');}
  function coursePanel(){
    if(!teacher())return;const home=document.getElementById('homeView');if(!home||home.querySelector('.qa-evidence-dashboard'))return;const r=report();if(!r)return;
    const panel=document.createElement('section');panel.className='qa-evidence-dashboard panel';
    panel.innerHTML=`<div class="qa-evidence-head"><div><span class="eyebrow">Teacher · evidence-strength QA</span><h2>Lesson quality evidence</h2><p>Hard gates show whether a lesson is structurally safe to release. Evidence strength shows how deeply the lesson meets the standard.</p></div><div class="qa-evidence-overall"><strong>${r.average}%</strong><span>${r.gatePassed}/${r.total} hard gates passed</span><small>Lowest evidence score ${r.min}%</small></div></div><div class="qa-band-strip">${Object.entries(r.bands).map(([name,count])=>`<span class="band-${bandClass(name)}"><b>${count}</b>${esc(name)}</span>`).join('')}</div><div class="qa-evidence-subjects">${r.subjects.map(s=>`<article><header><strong>${subjectName(s.subject)}</strong><span>${s.average}%</span></header><p>${s.gatePassed}/${s.total} lessons pass every hard gate · minimum ${s.min}%</p><div class="qa-meter"><i style="width:${s.average}%"></i></div>${s.priority.length?`<small>${s.priority.length} lesson${s.priority.length===1?'':'s'} have evidence-strength improvements available.</small>`:'<small>No evidence-strength improvements currently flagged.</small>'}</article>`).join('')}</div>`;
    const old=home.querySelector('.course-quality-dashboard');old?.insertAdjacentElement('afterend',panel)||home.querySelector('.control-panel')?.insertAdjacentElement('afterend',panel);
  }
  function lessonContext(deck){
    const topic=topics.find(t=>t.id===state.activeTopicId);if(!topic)return null;const title=deck.dataset.lessonTitle||'';const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;const index=lessons.findIndex(([n])=>n===title);if(index<0)return null;const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index),model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;const evidence=window.GCSE_LESSON_QUALITY_EVIDENCE?.score?.(model,topic,topics),gate=window.GCSE_LESSON_QUALITY_GATES?.evaluate?.(model,topic,topics);return{topic,title,index,model,evidence,gate};
  }
  function lessonPanel(deck){
    if(!teacher()||deck.dataset.evidenceQa==='true')return;const ctx=lessonContext(deck);if(!ctx?.evidence)return;deck.dataset.evidenceQa='true';const toolbar=deck.querySelector('.presentation-toolbar-actions');if(!toolbar)return;
    const btn=document.createElement('button');btn.type='button';btn.className=`lesson-evidence-badge band-${bandClass(ctx.evidence.band)}`;btn.textContent=`Evidence ${ctx.evidence.percent}%`;btn.title=ctx.gate?.passed?'All hard quality gates pass':'One or more hard quality gates fail';toolbar.prepend(btn);
    btn.addEventListener('click',()=>{let panel=deck.parentElement?.querySelector('.lesson-evidence-detail');if(panel){panel.remove();return;}panel=document.createElement('section');panel.className='lesson-evidence-detail';
      const blockers=ctx.gate?.blockers||[],priorities=ctx.evidence.topPriorities||[];
      panel.innerHTML=`<div class="lesson-evidence-title"><div><span class="eyebrow">Phase 17/18 lesson QA</span><h3>${esc(ctx.title)}</h3><p><strong>${esc(ctx.evidence.band)}</strong> evidence · ${ctx.evidence.percent}% · ${ctx.gate?.passed?'hard gate passed':'hard gate failed'}</p></div><span class="qa-gate-pill ${ctx.gate?.passed?'pass':'fail'}">${ctx.gate?.passed?'✓ Release gate':'✕ Blocked'}</span></div><div class="evidence-category-grid">${ctx.evidence.categories.map(c=>`<article><header><strong>${esc(c.label)}</strong><span>${c.percent}%</span></header><div class="qa-meter"><i style="width:${c.percent}%"></i></div><small>${c.band}</small></article>`).join('')}</div>${blockers.length?`<section class="qa-blockers"><h4>Hard blockers</h4>${blockers.map(b=>`<article><strong>${esc(b.label)}</strong><p>${esc(b.detail)}</p></article>`).join('')}</section>`:''}<section class="qa-priorities"><h4>${priorities.length?'Priority improvements':'No priority improvements flagged'}</h4>${priorities.length?priorities.map(p=>`<article class="priority-${p.priority}"><span>${esc(p.priority)}</span><div><strong>${esc(p.category)} · ${esc(p.label)}</strong><p>${esc(p.evidence)}</p>${p.action?`<small>Next improvement: ${esc(p.action)}</small>`:''}</div></article>`).join(''):'<p>This lesson currently has full evidence against the automated development rubric. Continue to use classroom evidence and student outcomes for human review.</p>'}</section>`;
      deck.insertAdjacentElement('afterend',panel);
    });
  }
  function topicPanel(){
    if(!teacher()||state.activeTab!=='coach')return;const root=document.getElementById('topicContent'),topic=topics.find(t=>t.id===state.activeTopicId);if(!root||!topic||root.querySelector('.topic-evidence-panel'))return;const r=report();if(!r)return;const rows=r.lessons.filter(x=>x.topicId===topic.id),avg=rows.length?Math.round(rows.reduce((n,x)=>n+x.percent,0)/rows.length):0,min=rows.length?Math.min(...rows.map(x=>x.percent)):0,failed=rows.filter(x=>!x.gatePassed),priority=rows.filter(x=>x.topPriorities.length).sort((a,b)=>a.percent-b.percent);
    const panel=document.createElement('section');panel.className='panel content-panel topic-evidence-panel';panel.innerHTML=`<span class="eyebrow">Teacher · release gate & evidence</span><h2>${esc(topic.code)} ${esc(topic.title)}</h2><div class="topic-evidence-summary"><span><b>${avg}%</b> average evidence</span><span><b>${min}%</b> minimum</span><span><b>${rows.length-failed.length}/${rows.length}</b> gates passed</span></div>${failed.length?`<div class="qa-blocked-list"><strong>Blocked lessons</strong>${failed.map(x=>`<span>${esc(x.title)}</span>`).join('')}</div>`:''}${priority.length?`<div class="qa-topic-priority"><strong>Evidence priorities</strong>${priority.slice(0,8).map(x=>`<span><b>${x.percent}%</b>${esc(x.title)} · ${esc(x.topPriorities[0]?.label||'Improve evidence')}</span>`).join('')}</div>`:'<div class="qa-all-ready">✓ No automated evidence-strength priorities in this topic.</div>'}`;root.prepend(panel);
  }
  function scan(){coursePanel();topicPanel();document.querySelectorAll('.lesson-presentation').forEach(lessonPanel);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_QUALITY_EVIDENCE_UI={scan,report};
})();
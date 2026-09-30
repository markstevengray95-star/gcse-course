(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  const CATALOG=window.GCSE_LESSON_PRESENTATION_CATALOG;
  if(!DATA||!RICH||!CATALOG)return;

  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uniq=list=>[...new Set((list||[]).filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
  const scopeLabel=value=>({combined:'Combined Science',triple:'Separate Science',separate:'Separate Science',all:'Combined + Separate'}[String(value||'').toLowerCase()]||String(value||'Course content'));
  const tierLabel=value=>({all:'Foundation & Higher',foundation:'Foundation tier',higher:'Higher tier'}[String(value||'').toLowerCase()]||String(value||'All tiers'));

  function lessonModels(topic){
    return (topic.lessons||[]).map(([title],index)=>{
      const lesson=RICH.getLesson?.(topic,title,index);if(!lesson)return null;
      const model=CATALOG.build?.(topic,title,index,lesson);if(!model)return null;
      return {title,index,lesson,model};
    }).filter(Boolean);
  }

  function courseScope(topic){
    const models=lessonModels(topic);const scopes=uniq(models.map(x=>x.model.scope||'combined'));const tiers=uniq(models.map(x=>x.model.tier||'all'));
    return {models,scopes,tiers,scopeLabels:uniq(scopes.map(scopeLabel)),tierLabels:uniq(tiers.map(tierLabel)),separateCount:models.filter(x=>['triple','separate'].includes(String(x.model.scope).toLowerCase())).length,higherCount:models.filter(x=>String(x.model.tier).toLowerCase()==='higher').length};
  }

  function pageModel(scope,index,total){
    const list=scope.models||[];if(!list.length)return null;
    const target=Math.min(list.length-1,Math.floor(index*Math.max(1,list.length)/Math.max(1,total)));
    return list[target];
  }

  function addScopeBadges(reader,topic,scope){
    const cover=reader.querySelector('[data-textbook-page="contents"] .textbook-cover-hero > div:first-child');
    if(cover&&!cover.querySelector('.textbook-scope-strip')){
      const strip=document.createElement('div');strip.className='textbook-scope-strip';
      strip.innerHTML=`<span class="textbook-scope-heading">Course scope</span>${scope.scopeLabels.map(x=>`<b>${esc(x)}</b>`).join('')}${scope.tierLabels.map(x=>`<b>${esc(x)}</b>`).join('')}`;
      cover.appendChild(strip);
    }
    const pages=[...reader.querySelectorAll('.textbook-chapter-page')];
    pages.forEach((page,i)=>{
      if(page.querySelector('.textbook-page-scope'))return;const entry=pageModel(scope,i,pages.length);if(!entry)return;
      const bar=document.createElement('aside');bar.className='textbook-page-scope';
      bar.innerHTML=`<div><span class="eyebrow">AQA course scope</span><strong>${esc(scopeLabel(entry.model.scope))}</strong></div><div><small>Tier</small><b>${esc(tierLabel(entry.model.tier))}</b></div>${entry.model.ref?`<div><small>Specification reference</small><b>${esc(entry.model.ref)}</b></div>`:''}`;
      page.prepend(bar);
    });
  }

  function scienceSkills(topic,scope){
    const explicit=uniq(scope.models.flatMap(x=>x.model.skills||[])).slice(0,10);
    const practicals=scope.models.filter(x=>x.model.practical).map(x=>({title:x.title,reference:x.model.practical}));
    const context=scope.models[0]?.title||topic.title;
    return {
      explicit,practicals,
      planning:[`Identify the independent variable, dependent variable and the important control variables in a ${topic.title} investigation.`,`Choose a sensible range and intervals so the evidence can show a pattern rather than a single comparison.`,`Plan repeats where variation or random error could affect the conclusion.`],
      measuring:[`Choose measuring equipment with a resolution appropriate to ${topic.title}.`,`Record every measurement with a unit and consistent precision.`,`Keep anomalous values visible until there is evidence to justify repeating or excluding them.`],
      data:[`Choose a table layout before collecting data so the independent variable is clear.`,`Use an appropriate graph and scale; plot the independent variable on the x-axis.`,`Use a line or curve of best fit when the data justify one rather than joining points mechanically.`],
      uncertainty:[`Distinguish random variation from a systematic offset.`,`Use repeats, a mean and the spread of results when they help judge reliability.`,`Relate uncertainty to the measurement method instead of simply writing “human error”.`],
      conclusions:[`State the pattern shown by the evidence, then support it with data.`,`Link the pattern back to the scientific model or mechanism from ${context}.`,`Do not claim the data prove more than the investigation actually tested.`],
      evaluation:[`Identify a specific limitation in the method or evidence.`,`Give a specific improvement and explain what it improves: validity, reliability, precision or confidence.`,`Judge whether the evidence is strong enough for the conclusion, using the results rather than a generic statement.`]
    };
  }

  function skillBlock(number,title,kicker,items){return `<section class="textbook-ws-block"><div class="textbook-ws-label"><span>${number}</span><div><small>${esc(kicker)}</small><strong>${esc(title)}</strong></div></div><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;}

  function workingPage(topic,skills){
    const page=document.createElement('section');page.className='textbook-reader-page textbook-working-scientifically-page';page.dataset.textbookPage='working-scientifically';page.dataset.textbookPageType='Working Scientifically';page.hidden=true;
    page.innerHTML=`<header class="textbook-ws-head"><span class="eyebrow">Working Scientifically</span><h2>Use evidence like a scientist</h2><p>These skills are applied in AQA questions across the whole course. Use the examples below in the context of ${esc(topic.title)}.</p></header>
      ${skills.explicit.length?`<aside class="textbook-ws-explicit"><strong>Specification-linked skills in this topic</strong><div>${skills.explicit.map(x=>`<span>${esc(x)}</span>`).join('')}</div></aside>`:''}
      ${skillBlock('1','Plan','Variables, range and repeats',skills.planning)}
      ${skillBlock('2','Measure','Units, resolution and recording',skills.measuring)}
      ${skillBlock('3','Process data','Tables, graphs and patterns',skills.data)}
      ${skillBlock('4','Handle uncertainty','Variation, anomalies and reliability',skills.uncertainty)}
      ${skillBlock('5','Conclude','Evidence → pattern → science',skills.conclusions)}
      ${skillBlock('6','Evaluate','Limitation → improvement → impact',skills.evaluation)}
      ${skills.practicals.length?`<section class="textbook-ws-practical-links"><span class="eyebrow">Apply these skills</span><h3>Required practical links</h3>${skills.practicals.map(p=>`<article><strong>${esc(p.title)}</strong><p>${esc(p.reference)}</p></article>`).join('')}</section>`:`<aside class="textbook-ws-note"><strong>No required practical is mapped directly to this chapter.</strong><p>The Working Scientifically skills still apply to unfamiliar methods, graphs, data and evaluation questions.</p></aside>`}`;
    return page;
  }

  function addPage(reader,topic,scope){
    const pages=reader._textbookPages;if(!Array.isArray(pages)||!reader._textbookShow)return false;if(pages.some(p=>p.id==='working-scientifically'))return true;
    const page=workingPage(topic,scienceSkills(topic,scope));reader.querySelector('[data-textbook-pages]')?.appendChild(page);pages.push({id:'working-scientifically',label:'Working Scientifically',type:'Scientific skills',node:page});
    const jump=()=>reader._textbookShow(pages.findIndex(p=>p.id==='working-scientifically'),{focus:true});
    const nav=reader.querySelector('[data-textbook-page-nav]');if(nav){const b=document.createElement('button');b.type='button';b.dataset.textbookNav='working-scientifically';b.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Scientific skills</small><strong>Working Scientifically</strong></div><b data-textbook-check>○</b>`;b.addEventListener('click',jump);nav.appendChild(b);}
    const cover=reader.querySelector('[data-textbook-page="contents"] [data-textbook-contents-list]');if(cover){const b=document.createElement('button');b.type='button';b.dataset.textbookJump='working-scientifically';b.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Scientific skills</small><strong>Working Scientifically</strong></div><b>→</b>`;b.addEventListener('click',jump);cover.appendChild(b);}
    return true;
  }

  function enhance(reader){
    if(!reader||reader.dataset.phaseT8==='done')return false;const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);if(!topic)return false;
    const scope=courseScope(topic);addScopeBadges(reader,topic,scope);if(!addPage(reader,topic,scope))return false;reader.dataset.phaseT8='done';return true;
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);
  window.GCSE_TEXTBOOK_PHASE8={courseScope,scienceSkills,enhance,scopeLabel,tierLabel};
})();
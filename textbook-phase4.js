(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const COACH=window.GCSE_EQUATION_COACH;
  if(!DATA||!COACH)return;

  const STORAGE_KEY='gcse-science-textbook-phase4-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>COACH.norm?COACH.norm(v):String(v??'').toLowerCase().replace(/\s+/g,' ').trim();
  const specs={biology:window.GCSE_BIOLOGY_SPEC_DETAIL,chemistry:window.GCSE_CHEMISTRY_SPEC_DETAIL,physics:window.GCSE_PHYSICS_SPEC_DETAIL};

  const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}};
  const save=data=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

  function equationRecords(topic){
    const mapped=specs[topic.subject]?.topics?.[topic.id];
    const map=new Map();
    for(const section of mapped?.sections||[])for(const lesson of section.lessons||[])for(const equation of lesson.equations||[]){
      const key=norm(equation);if(!key)continue;
      if(!map.has(key))map.set(key,{equation,lessons:[]});
      const rec=map.get(key);if(lesson.title&&!rec.lessons.includes(lesson.title))rec.lessons.push(lesson.title);
    }
    return [...map.values()];
  }

  function modelFor(topic,record,index){
    const model=COACH.build(record.equation,topic.subject);
    return {...model,id:`${topic.id}-equation-${index+1}`,sourceLessons:record.lessons};
  }

  function symbolTable(model){
    const vars=model.vars||[];
    if(!vars.length)return `<p class="textbook-calc-empty">Use the equation exactly as written and identify each quantity from the question before substituting numbers.</p>`;
    return `<div class="textbook-calc-symbols">${vars.map(v=>`<div><code>${esc(v[0])}</code><span>${esc(v[1])}</span><b>${esc(v[2]||'')}</b></div>`).join('')}</div>`;
  }

  function workedRoute(model){
    const steps=(model.worked||[]).slice(0,6);
    const route=model.route||['Meaning','Symbols & units','Rearrange','Substitute','Calculate','Check'];
    return `<div class="textbook-calc-route">${route.map((label,i)=>`<span>${i+1}. ${esc(label)}</span>`).join('')}</div>
      <div class="textbook-calc-worked">${steps.map((step,i)=>`<article class="textbook-calc-step ${i===0?'revealed':''}" data-calc-worked-step="${i}"><span>${i+1}</span><div><small>${esc(route[Math.min(i,route.length-1)]||'Step')}</small><p>${esc(step)}</p></div></article>`).join('')}</div>
      <div class="textbook-calc-step-actions"><button type="button" data-calc-reveal-next>Reveal next step</button><button type="button" data-calc-reset>Reset worked example</button></div>`;
  }

  function practiceCard(kind,title,question,modelId){
    if(!question)return '';
    return `<article class="textbook-calc-practice ${kind}"><span class="eyebrow">${esc(title)}</span><p>${esc(question)}</p><textarea rows="4" data-calc-answer="${esc(modelId)}-${kind}" placeholder="Show your equation, rearrangement, substitution, calculation and final unit…"></textarea><button type="button" data-calc-guidance-toggle>Show solution guidance</button><div class="textbook-calc-guidance" hidden><ol><li>Write the correct equation.</li><li>Convert values into compatible units.</li><li>Rearrange before substituting if the required quantity is not already the subject.</li><li>Substitute values with units.</li><li>Calculate carefully and give a sensible number of significant figures.</li><li>Check the final unit and whether the value is physically reasonable.</li></ol></div></article>`;
  }

  function renderModule(host,topic,model,index,total){
    host.dataset.activeEquation=model.id;
    host.innerHTML=`
      <header class="textbook-calc-module-head">
        <div><span class="eyebrow">Calculation ${index+1} of ${total}</span><h3>${esc(model.equation)}</h3><p>${esc(model.meaning)}</p></div>
        ${model.sourceLessons?.length?`<small>Linked lesson${model.sourceLessons.length===1?'':'s'}: ${esc(model.sourceLessons.slice(0,3).join(' · '))}</small>`:''}
      </header>
      <section class="textbook-calc-block"><div class="textbook-calc-label"><span>1</span><div><small>Understand first</small><strong>Equation meaning</strong></div></div><p>${esc(model.meaning)}</p></section>
      <section class="textbook-calc-block"><div class="textbook-calc-label"><span>2</span><div><small>Know the quantities</small><strong>Symbols & units</strong></div></div>${symbolTable(model)}<p class="textbook-calc-unit-note">${esc(model.unitGuidance)}</p></section>
      <section class="textbook-calc-block"><div class="textbook-calc-label"><span>3</span><div><small>Make the unknown the subject</small><strong>Rearrangement</strong></div></div><div class="textbook-calc-rearrangements">${(model.rearrange||[]).map(x=>`<code>${esc(x)}</code>`).join('')||'<span>No rearrangement is needed for the standard form shown.</span>'}</div><details><summary>Rearrangement habit</summary><p>Rearrange using symbols before putting numbers into the equation. This reduces calculator mistakes and makes method marks easier to show.</p></details></section>
      <section class="textbook-calc-block worked"><div class="textbook-calc-label"><span>4</span><div><small>Follow the method</small><strong>Worked example</strong></div></div>${workedRoute(model)}</section>
      <section class="textbook-calc-block"><div class="textbook-calc-label"><span>5</span><div><small>Now practise</small><strong>Your turn</strong></div></div><div class="textbook-calc-practice-grid">${practiceCard('scaffold','Scaffolded calculation',model.scaffold,model.id)}${practiceCard('independent','Independent calculation',model.independent,model.id)}</div></section>
      <section class="textbook-calc-block exam"><div class="textbook-calc-label"><span>6</span><div><small>Use it like an exam</small><strong>Check & apply</strong></div></div><p>${esc(model.exam)}</p><div class="textbook-calc-checklist"><span>□ correct equation</span><span>□ units converted</span><span>□ rearrangement shown</span><span>□ substitution shown</span><span>□ final unit included</span><span>□ answer checked</span></div></section>`;

    const stored=load();
    host.querySelectorAll('[data-calc-answer]').forEach(area=>{
      const key=area.dataset.calcAnswer;area.value=stored[key]||'';
      area.addEventListener('input',()=>{const all=load();all[key]=area.value;save(all);});
    });
    const worked=[...host.querySelectorAll('[data-calc-worked-step]')];
    host.querySelector('[data-calc-reveal-next]')?.addEventListener('click',()=>{
      const next=worked.find(x=>!x.classList.contains('revealed'));if(next)next.classList.add('revealed');
    });
    host.querySelector('[data-calc-reset]')?.addEventListener('click',()=>worked.forEach((x,i)=>x.classList.toggle('revealed',i===0)));
    host.querySelectorAll('[data-calc-guidance-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const panel=btn.nextElementSibling;panel.hidden=!panel.hidden;btn.textContent=panel.hidden?'Show solution guidance':'Hide solution guidance';}));
  }

  function enhance(reader){
    if(!reader||reader.dataset.phaseT4==='done')return false;
    const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);if(!topic)return false;
    const page=reader.querySelector('.textbook-worked-page');if(!page)return false;
    const records=equationRecords(topic);
    if(!records.length){page.classList.add('textbook-calc-no-equations');page.dataset.phaseT4='no-equations';reader.dataset.phaseT4='done';return true;}
    const models=records.map((r,i)=>modelFor(topic,r,i));
    page.classList.add('textbook-calculation-page');page.dataset.phaseT4='done';
    page.innerHTML=`
      <header class="textbook-calc-page-head"><span class="eyebrow">Maths & equations</span><h2>Calculation workshop</h2><p>Use the same six-step calculation method every time: understand the equation, check symbols and units, rearrange, substitute, calculate and check.</p></header>
      <nav class="textbook-calc-tabs" aria-label="Choose an equation">${models.map((m,i)=>`<button type="button" data-calc-model="${i}" class="${i===0?'active':''}"><small>${i+1}</small><strong>${esc(m.equation)}</strong></button>`).join('')}</nav>
      <div class="textbook-calc-active" data-calc-active></div>`;
    const host=page.querySelector('[data-calc-active]');
    const tabs=[...page.querySelectorAll('[data-calc-model]')];
    const select=index=>{tabs.forEach((b,i)=>b.classList.toggle('active',i===index));renderModule(host,topic,models[index],index,models.length);};
    tabs.forEach(btn=>btn.addEventListener('click',()=>select(Number(btn.dataset.calcModel))));
    select(0);reader.dataset.phaseT4='done';
    return true;
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);

  window.GCSE_TEXTBOOK_PHASE4={equationRecords,modelFor,enhance,storageKey:STORAGE_KEY};
})();
(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  const CATALOG=window.GCSE_LESSON_PRESENTATION_CATALOG;
  const ENGINE=window.GCSE_PRACTICAL_LESSON_ENGINE;
  if(!DATA||!RICH||!CATALOG||!ENGINE)return;

  const STORAGE_KEY='gcse-science-textbook-phase5-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}};
  const save=data=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

  function practicalModels(topic){
    const out=[];
    for(let index=0;index<(topic.lessons||[]).length;index++){
      const title=topic.lessons[index]?.[0];if(!title)continue;
      const lesson=RICH.getLesson?.(topic,title,index);if(!lesson)continue;
      const model=CATALOG.build?.(topic,title,index,lesson);if(!model?.practical)continue;
      model.subject=topic.subject;
      const practical=ENGINE.build(topic,title,model);if(!practical)continue;
      out.push({title,index,model,practical});
    }
    return out;
  }

  function apparatusDiagram(practical){
    const items=(practical.apparatus||[]).slice(0,6);
    const width=720,height=250,spacing=items.length?Math.floor(620/Math.max(1,items.length-1)):0;
    const nodes=items.map((item,i)=>{const x=50+i*spacing;return `<g transform="translate(${x},85)"><rect width="110" height="72" rx="14"/><text x="55" y="30" text-anchor="middle">${esc(String(item).slice(0,16))}</text><text x="55" y="49" text-anchor="middle">${esc(String(item).slice(16,31))}</text></g>`;}).join('');
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Apparatus overview for ${esc(practical.title)}"><title>Apparatus overview for ${esc(practical.title)}</title><line x1="55" y1="120" x2="665" y2="120" class="practical-flow-line"/>${nodes}</svg>`;
  }

  function resultsTable(practical,id){
    const headers=practical.during?.table||[];
    return `<div class="textbook-practical-table-wrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${[0,1,2,3].map(row=>`<tr>${headers.map((_,col)=>`<td><input type="text" data-practical-result="${esc(id)}-${row}-${col}" aria-label="Result row ${row+1} column ${col+1}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function sectionLabel(number,kicker,title){return `<div class="textbook-practical-label"><span>${esc(number)}</span><div><small>${esc(kicker)}</small><strong>${esc(title)}</strong></div></div>`;}

  function renderPractical(host,entry,index,total){
    const p=entry.practical;const id=p.id;
    host.dataset.activePractical=id;
    host.innerHTML=`
      <header class="textbook-practical-head"><div><span class="eyebrow">Required practical ${index+1} of ${total}</span><h3>${esc(entry.title)}</h3><p>${esc(p.reference)}</p></div><span class="textbook-practical-kind">${esc(p.kind)}</span></header>
      <section class="textbook-practical-block theory">${sectionLabel('1','Why it works','Theory & prediction')}<p><strong>Purpose:</strong> ${esc(p.before?.purpose)}</p><p>${esc(p.before?.theory)}</p><div class="textbook-practical-prediction"><strong>Predict before starting</strong><p>${esc(p.before?.prediction)}</p></div></section>
      <section class="textbook-practical-block apparatus">${sectionLabel('2','Set up correctly','Apparatus')}<div class="textbook-practical-apparatus">${apparatusDiagram(p)}</div><ul>${(p.apparatus||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><aside><strong>School practical safety</strong>${(p.during?.safety||[]).map(x=>`<p>${esc(x)}</p>`).join('')}</aside></section>
      <section class="textbook-practical-block variables">${sectionLabel('3','Design the investigation','Variables')}<div class="textbook-practical-variable-grid"><article><small>Independent variable</small><p>${esc(p.variables?.independent)}</p></article><article><small>Dependent variable</small><p>${esc(p.variables?.dependent)}</p></article><article><small>Control variables</small><ul>${(p.variables?.controls||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div></section>
      <section class="textbook-practical-block method">${sectionLabel('4','Collect reliable evidence','Method')}<ol class="textbook-practical-method">${(p.during?.method||[]).map((x,i)=>`<li><span>${i+1}</span><p>${esc(x)}</p></li>`).join('')}</ol></section>
      <section class="textbook-practical-block results">${sectionLabel('5','Record everything','Expected results & table')}<p>Use the table while revising the method or when practising how results should be organised. Record unusual values instead of hiding them.</p>${resultsTable(p,id)}</section>
      <section class="textbook-practical-block analysis">${sectionLabel('6','Turn data into evidence','Analysis')}<p><strong>Processing / graph:</strong> ${esc(p.after?.analysis)}</p><p><strong>Conclusion:</strong> ${esc(p.after?.conclusion)}</p><textarea rows="4" data-practical-conclusion="${esc(id)}" placeholder="Write a conclusion that states the pattern, quotes evidence and links back to the theory…"></textarea></section>
      <section class="textbook-practical-block evaluation">${sectionLabel('7','Judge the quality','Uncertainty & improvements')}<p><strong>Uncertainty:</strong> ${esc(p.after?.uncertainty)}</p><div class="textbook-practical-evaluation-grid">${(p.after?.evaluation||[]).map((x,i)=>`<article><span>${i+1}</span><p>${esc(x)}</p></article>`).join('')}</div><textarea rows="4" data-practical-evaluation="${esc(id)}" placeholder="Identify a limitation, give a specific improvement and explain how it improves the evidence…"></textarea></section>
      <section class="textbook-practical-block exam">${sectionLabel('8','Apply it in an exam','Exam question')}<p class="textbook-practical-exam-q">${esc(p.exam?.question)}</p><textarea rows="6" data-practical-exam-answer="${esc(id)}" placeholder="Write your exam answer here…"></textarea><button type="button" data-practical-markpoints-toggle>Reveal indicative mark points</button><div class="textbook-practical-markpoints" hidden><ul>${(p.exam?.marking||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><small>Indicative guidance for practice, not an official AQA mark scheme.</small></div></section>`;

    const stored=load();
    host.querySelectorAll('[data-practical-result],[data-practical-conclusion],[data-practical-evaluation],[data-practical-exam-answer]').forEach(input=>{
      const key=input.dataset.practicalResult||input.dataset.practicalConclusion||input.dataset.practicalEvaluation||input.dataset.practicalExamAnswer;
      if(key&&stored[key]!==undefined)input.value=stored[key];
      input.addEventListener('input',()=>{const all=load();all[key]=input.value;save(all);});
    });
    host.querySelector('[data-practical-markpoints-toggle]')?.addEventListener('click',event=>{const panel=event.currentTarget.nextElementSibling;panel.hidden=!panel.hidden;event.currentTarget.textContent=panel.hidden?'Reveal indicative mark points':'Hide indicative mark points';});
  }

  function addPageToReader(reader,topic,entries){
    if(!entries.length||reader.dataset.phaseT5==='done')return false;
    const pages=reader._textbookPages;if(!Array.isArray(pages)||!reader._textbookShow)return false;
    if(pages.some(p=>p.id==='required-practicals')){reader.dataset.phaseT5='done';return true;}

    const page=document.createElement('section');
    page.className='textbook-reader-page textbook-practical-page';
    page.dataset.textbookPage='required-practicals';page.dataset.textbookPageType='Required practicals';
    page.hidden=true;
    page.innerHTML=`<header class="textbook-practical-page-head"><span class="eyebrow">Required practicals</span><h2>Practical textbook</h2><p>Learn the science behind the investigation, how the method controls variables, how to analyse evidence and how AQA-style questions can assess the practical.</p></header><nav class="textbook-practical-tabs" aria-label="Choose a required practical">${entries.map((entry,i)=>`<button type="button" data-practical-choice="${i}" class="${i===0?'active':''}"><small>${i+1}</small><strong>${esc(entry.title)}</strong></button>`).join('')}</nav><div class="textbook-practical-active" data-practical-active></div>`;
    const pageHost=reader.querySelector('[data-textbook-pages]');pageHost?.appendChild(page);
    const meta={id:'required-practicals',label:'Required practicals',type:'Required practicals',node:page};pages.push(meta);

    const nav=reader.querySelector('[data-textbook-page-nav]');
    if(nav){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookNav='required-practicals';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Required practicals</small><strong>Required practicals</strong></div><b data-textbook-check>○</b>`;btn.addEventListener('click',()=>reader._textbookShow(pages.findIndex(p=>p.id==='required-practicals'),{focus:true}));nav.appendChild(btn);}
    const coverList=reader.querySelector('[data-textbook-page="contents"] [data-textbook-contents-list]');
    if(coverList){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookJump='required-practicals';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Required practicals</small><strong>Required practicals</strong></div><b>→</b>`;btn.addEventListener('click',()=>reader._textbookShow(pages.findIndex(p=>p.id==='required-practicals'),{focus:true}));coverList.appendChild(btn);}

    const host=page.querySelector('[data-practical-active]');const tabs=[...page.querySelectorAll('[data-practical-choice]')];
    const select=i=>{tabs.forEach((b,n)=>b.classList.toggle('active',n===i));renderPractical(host,entries[i],i,entries.length);};tabs.forEach(btn=>btn.addEventListener('click',()=>select(Number(btn.dataset.practicalChoice))));select(0);
    reader.dataset.phaseT5='done';return true;
  }

  function enhance(reader){
    if(!reader||reader.dataset.phaseT5==='done')return false;
    const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);if(!topic)return false;
    const entries=practicalModels(topic);if(!entries.length){reader.dataset.phaseT5='none';return true;}
    return addPageToReader(reader,topic,entries);
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);
  window.GCSE_TEXTBOOK_PHASE5={practicalModels,enhance,storageKey:STORAGE_KEY};
})();
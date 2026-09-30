(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  const CATALOG=window.GCSE_LESSON_PRESENTATION_CATALOG;
  const EXAM=window.GCSE_LESSON_EXAM_STUDIO;
  const PRACTICAL=window.GCSE_PRACTICAL_LESSON_ENGINE;
  if(!DATA||!RICH||!CATALOG||!EXAM)return;

  const STORAGE_KEY='gcse-science-textbook-phase6-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9α-ω+−-]+/g,' ').trim();
  const STOP=new Set('this that with from into about through which while where when then than have has had are was were will would should could can may might your their there these those each both more most some such using used use also only very what why how science scientific topic section lesson'.split(' '));
  const words=s=>norm(s).split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}};
  const save=data=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

  const strategy={
    Define:['Give the precise scientific meaning.','Avoid examples unless they help define the term.'],
    Describe:['State what happens or what the data show.','Use values or trends when they are provided.'],
    Explain:['Make a linked chain: point → because → consequence.','Use scientific vocabulary to show why the outcome happens.'],
    Calculate:['Write the equation first.','Rearrange if needed, substitute, calculate and include the unit.'],
    Analyse:['Quote or use evidence.','Identify the pattern, then connect it to the science.'],
    Evaluate:['Use evidence for strengths and limitations.','Finish with a justified judgement or specific improvement.'],
    Compare:['Use the same comparison point for both cases.','State a clear similarity and/or difference.'],
    Suggest:['Apply relevant science to the unfamiliar context.','Justify why the suggestion is sensible.']
  };

  function lessonEntries(topic){
    return (topic.lessons||[]).map(([title],index)=>{
      const lesson=RICH.getLesson?.(topic,title,index);if(!lesson)return null;
      const model=CATALOG.build?.(topic,title,index,lesson);if(!model)return null;
      model.subject=topic.subject;
      const practical=model.practical&&PRACTICAL?.build?PRACTICAL.build(topic,title,model):null;
      const pack=EXAM.build(model,practical);if(!pack)return null;
      return {title,index,lesson,model,practical,pack};
    }).filter(Boolean);
  }

  function scoreEntry(entry,text){
    const target=new Set(words(text));
    const hay=words([entry.title,entry.model.section,entry.model.coreExplanation,...(entry.model.objectives||[]),...(entry.model.keyTerms||[]).flat()].join(' '));
    return hay.reduce((n,w)=>n+(target.has(w)?1:0),0)+words(entry.title).reduce((n,w)=>n+(target.has(w)?2:0),0);
  }

  function questionFor(pack,index){
    const qs=pack.questions||[];
    if(index===0)return qs.find(q=>q.marks<=2)||qs[0];
    if(index===1)return qs.find(q=>q.section==='Application')||qs.find(q=>q.marks===4&&q.command!=='Calculate')||qs[1]||qs[0];
    return qs.find(q=>q.marks===6)||qs[qs.length-1]||qs[0];
  }

  function responseLevels(q){
    const points=(q.marking||[]).map(x=>x.text).filter(Boolean);
    const weak=points[0]||q.modelAnswer||'A relevant scientific point is stated.';
    const improved=points.slice(0,Math.min(points.length,Math.max(2,Math.ceil(q.marks/2)))).join(' ')||weak;
    return{
      weak,
      improved,
      model:q.modelAnswer||points.join(' '),
      weakWhy:'This touches a relevant idea, but it does not yet develop enough science or fully respond to the command word and question context.',
      improvedWhy:'This develops more relevant science and begins to link ideas, but it may still leave some indicative points, evidence or justification unstated.',
      modelWhy:'This response addresses the command word directly and covers the available indicative marking points with explicit scientific links.'
    };
  }

  function buildTopicCases(topic){
    const guide=RICH.guides?.[topic.id];const sections=guide?.textbook||[];const entries=lessonEntries(topic);const used=new Set();
    return sections.slice(0,3).map((section,i)=>{
      const text=Array.isArray(section)?section.join(' '):String(section||'');
      const ranked=entries.map(e=>({...e,score:scoreEntry(e,text)})).sort((a,b)=>b.score-a.score||a.index-b.index);
      const chosen=ranked.find(e=>!used.has(e.index))||ranked[0];if(chosen)used.add(chosen.index);
      const q=chosen?questionFor(chosen.pack,i):null;
      return chosen&&q?{
        id:`${topic.id}-exam-skill-${i+1}`,sectionIndex:i,sectionTitle:Array.isArray(section)?section[0]:`Section ${i+1}`,
        lessonTitle:chosen.title,ref:chosen.model.ref,question:q,packNote:chosen.pack.note,responses:responseLevels(q)
      }:null;
    }).filter(Boolean);
  }

  function commandCoach(command){
    const guide=EXAM.commandGuide?.[command]||'Answer the command word directly using precise scientific language.';
    const steps=strategy[command]||['Identify exactly what the question is asking.','Use precise science and link it to the context.'];
    return `<div class="textbook-command-coach"><div><span class="textbook-command-chip">${esc(command)}</span><p>${esc(guide)}</p></div><ol>${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`;
  }

  function annotateCorePages(reader,cases){
    const core=[...reader.querySelectorAll('.textbook-chapter-page')];
    core.forEach((page,i)=>{
      if(page.dataset.phaseT6==='done')return;const c=cases[i];if(!c)return;
      const box=document.createElement('aside');box.className='textbook-exam-inline';
      box.innerHTML=`<div><span class="eyebrow">Exam language</span><strong>${esc(c.question.command)} question</strong><p>${esc(EXAM.commandGuide?.[c.question.command]||'Answer the command word directly.')}</p></div><button type="button" data-open-exam-skills>Open Exam Skills →</button>`;
      box.querySelector('[data-open-exam-skills]')?.addEventListener('click',()=>{
        const pages=reader._textbookPages||[];const idx=pages.findIndex(p=>p.id==='exam-skills');if(idx>=0)reader._textbookShow(idx,{focus:true});
      });
      page.appendChild(box);page.dataset.phaseT6='done';
    });
  }

  function responseCard(kind,title,text,why,points=[]){
    return `<article class="textbook-response-card ${kind}"><header><span>${esc(title)}</span><button type="button" data-response-toggle>Reveal</button></header><div class="textbook-response-body" hidden><p class="textbook-response-copy">${esc(text)}</p><div class="textbook-response-why"><strong>Why this response is at this level</strong><p>${esc(why)}</p></div>${points.length?`<div class="textbook-response-points"><strong>Indicative points covered</strong>${points.map((p,i)=>`<span><b>${i+1}</b>${esc(p.text)}</span>`).join('')}</div>`:''}</div></article>`;
  }

  function renderCase(host,c,index,total){
    const q=c.question;const r=c.responses;const key=`${c.id}:answer`;const stored=load();
    host.dataset.examCase=c.id;
    host.innerHTML=`
      <header class="textbook-exam-case-head"><div><span class="eyebrow">Exam example ${index+1} of ${total}</span><h3>${esc(c.sectionTitle)}</h3><p>Linked lesson: ${esc(c.lessonTitle)}${c.ref?` · ${esc(c.ref)}`:''}</p></div><span class="textbook-marks-badge">${esc(q.marks)} marks</span></header>
      <section class="textbook-exam-question"><div><span class="textbook-command-chip">${esc(q.command)}</span><strong>${esc(q.section)}</strong></div><p>${esc(q.prompt)}</p></section>
      ${commandCoach(q.command)}
      <section class="textbook-exam-attempt"><div><span class="eyebrow">Try it first</span><strong>Write your answer before revealing the comparisons</strong></div><textarea rows="7" data-phase6-answer placeholder="Use the command word, relevant science and the question context…">${esc(stored[key]||'')}</textarea></section>
      <section class="textbook-response-ladder"><div class="textbook-response-ladder-head"><span class="eyebrow">Response ladder</span><h4>See how an answer becomes stronger</h4><p>These are teaching examples based on indicative marking guidance, not official AQA candidate responses or mark schemes.</p></div>
        ${responseCard('weak','Weak response',r.weak,r.weakWhy,(q.marking||[]).slice(0,1))}
        ${responseCard('improved','Improved response',r.improved,r.improvedWhy,(q.marking||[]).slice(0,Math.min(q.marking?.length||0,Math.max(2,Math.ceil(q.marks/2)))))}
        ${responseCard('model','Model response',r.model,r.modelWhy,q.marking||[])}
      </section>`;
    host.querySelector('[data-phase6-answer]')?.addEventListener('input',e=>{const all=load();all[key]=e.currentTarget.value;save(all);});
    host.querySelectorAll('[data-response-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const body=btn.closest('.textbook-response-card')?.querySelector('.textbook-response-body');if(!body)return;body.hidden=!body.hidden;btn.textContent=body.hidden?'Reveal':'Hide';}));
  }

  function addExamPage(reader,topic,cases){
    if(!cases.length)return false;const pages=reader._textbookPages;if(!Array.isArray(pages)||!reader._textbookShow)return false;
    if(pages.some(p=>p.id==='exam-skills'))return true;
    const page=document.createElement('section');page.className='textbook-reader-page textbook-exam-literacy-page';page.dataset.textbookPage='exam-skills';page.dataset.textbookPageType='Exam skills';page.hidden=true;
    const commands=Object.keys(EXAM.commandGuide||{});
    page.innerHTML=`<header class="textbook-exam-page-head"><span class="eyebrow">Exam literacy</span><h2>Exam Skills</h2><p>Learn what the command word requires, compare weak and stronger responses, then practise building your own answer using the science from this chapter.</p><small>Questions and marking guidance are original AQA-style practice, not official AQA material.</small></header>
      <section class="textbook-command-grid">${commands.map(cmd=>`<article><span>${esc(cmd)}</span><p>${esc(EXAM.commandGuide[cmd])}</p></article>`).join('')}</section>
      <nav class="textbook-exam-tabs" aria-label="Choose an exam literacy example">${cases.map((c,i)=>`<button type="button" data-exam-case-choice="${i}" class="${i===0?'active':''}"><small>${i+1}</small><strong>${esc(c.sectionTitle)}</strong><span>${esc(c.question.command)} · ${esc(c.question.marks)} marks</span></button>`).join('')}</nav><div class="textbook-exam-active" data-exam-active></div>`;
    reader.querySelector('[data-textbook-pages]')?.appendChild(page);
    pages.push({id:'exam-skills',label:'Exam Skills',type:'Exam literacy',node:page});
    const nav=reader.querySelector('[data-textbook-page-nav]');if(nav){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookNav='exam-skills';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Exam literacy</small><strong>Exam Skills</strong></div><b data-textbook-check>○</b>`;btn.addEventListener('click',()=>reader._textbookShow(pages.findIndex(p=>p.id==='exam-skills'),{focus:true}));nav.appendChild(btn);}
    const cover=reader.querySelector('[data-textbook-page="contents"] [data-textbook-contents-list]');if(cover){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookJump='exam-skills';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>Exam literacy</small><strong>Exam Skills</strong></div><b>→</b>`;btn.addEventListener('click',()=>reader._textbookShow(pages.findIndex(p=>p.id==='exam-skills'),{focus:true}));cover.appendChild(btn);}
    const host=page.querySelector('[data-exam-active]');const tabs=[...page.querySelectorAll('[data-exam-case-choice]')];const select=i=>{tabs.forEach((b,n)=>b.classList.toggle('active',n===i));renderCase(host,cases[i],i,cases.length);};tabs.forEach(btn=>btn.addEventListener('click',()=>select(Number(btn.dataset.examCaseChoice))));select(0);return true;
  }

  function enhance(reader){
    if(!reader||reader.dataset.phaseT6==='done')return false;
    const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);if(!topic)return false;
    const cases=buildTopicCases(topic);if(!cases.length){reader.dataset.phaseT6='none';return true;}
    annotateCorePages(reader,cases);if(!addExamPage(reader,topic,cases))return false;reader.dataset.phaseT6='done';return true;
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});
  document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);
  window.GCSE_TEXTBOOK_PHASE6={buildTopicCases,responseLevels,enhance,commandStrategy:strategy,storageKey:STORAGE_KEY};
})();

(() => {
  if(document.querySelector('link[data-textbook-phase7]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='textbook-phase7.css';link.dataset.textbookPhase7='true';document.head.appendChild(link);
  if(document.querySelector('script[data-textbook-phase7]'))return;
  const script=document.createElement('script');script.src='textbook-phase7.js';script.dataset.textbookPhase7='true';script.addEventListener('error',()=>console.error('Could not load textbook Phase 7.'));document.head.appendChild(script);
})();
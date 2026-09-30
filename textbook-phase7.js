(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  const CATALOG=window.GCSE_LESSON_PRESENTATION_CATALOG;
  const PHASE6=window.GCSE_TEXTBOOK_PHASE6;
  if(!DATA||!RICH||!CATALOG)return;

  const STORAGE_KEY='gcse-science-textbook-phase7-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9α-ω+−-]+/g,' ').replace(/\s+/g,' ').trim();
  const uniq=list=>{const seen=new Set();return list.filter(Boolean).filter(x=>{const k=norm(typeof x==='string'?x:JSON.stringify(x));if(!k||seen.has(k))return false;seen.add(k);return true;});};
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}};
  const save=data=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

  function entries(topic){
    return (topic.lessons||[]).map(([title],index)=>{
      const lesson=RICH.getLesson?.(topic,title,index);if(!lesson)return null;
      const model=CATALOG.build?.(topic,title,index,lesson);if(!model)return null;
      model.subject=topic.subject;
      return {title,index,lesson,model};
    }).filter(Boolean);
  }

  function keyIdeas(list){
    const candidates=[];
    for(const e of list){
      for(const unit of e.model.teachingUnits||[]) candidates.push(unit.explanation||unit.text);
      if(e.model.coreExplanation)candidates.push(e.model.coreExplanation);
    }
    return uniq(candidates).slice(0,8);
  }

  function keyTerms(list){
    return uniq(list.flatMap(e=>(e.model.keyTerms||[]).map(t=>Array.isArray(t)?{term:t[0],definition:t[1]}:null)).filter(x=>x?.term&&x?.definition)).slice(0,16);
  }

  function equations(list){return uniq(list.flatMap(e=>e.model.equations||[])).slice(0,12);}
  function practicals(list){return uniq(list.filter(e=>e.model.practical).map(e=>({title:e.title,reference:e.model.practical}))).slice(0,12);}
  function misconceptions(list){return uniq(list.map(e=>e.model.misconception).filter(Boolean)).slice(0,6);}

  function retrievalQuestions(list,terms,topic){
    const qs=[];
    for(const e of list){
      for(const s of e.model.starter||[]){
        if(s?.question&&s?.answer)qs.push({type:'Retrieval',question:s.question,answer:s.answer,source:e.title});
        if(qs.length>=10)break;
      }
      if(qs.length>=10)break;
    }
    for(const t of terms){
      if(qs.length>=10)break;
      qs.push({type:'Key term',question:`Define ${t.term}.`,answer:t.definition,source:topic.title});
    }
    for(const e of list){
      if(qs.length>=10)break;
      const point=e.model.teachingUnits?.[0];
      if(point?.question&&point?.explanation)qs.push({type:'Explain',question:point.question,answer:point.explanation,source:e.title});
    }
    return uniq(qs).slice(0,10);
  }

  function examQuestions(topic,list){
    const cases=PHASE6?.buildTopicCases?.(topic)||[];
    if(cases.length>=3)return cases.slice(0,3).map(c=>({question:c.question.prompt,command:c.question.command,marks:c.question.marks,answer:c.question.modelAnswer,source:c.lessonTitle}));
    const out=[];
    for(const e of list){
      const pack=window.GCSE_LESSON_EXAM_STUDIO?.build?.(e.model,null);if(!pack)continue;
      for(const q of pack.questions||[]){out.push({question:q.prompt,command:q.command,marks:q.marks,answer:q.modelAnswer,source:e.title});if(out.length>=3)break;}
      if(out.length>=3)break;
    }
    return out.slice(0,3);
  }

  function topicMap(topic,guide,pack){
    const nodes=(guide?.textbook||[]).map((s,i)=>({label:Array.isArray(s)?s[0]:`Section ${i+1}`,type:'Core'}));
    if(pack.equations.length)nodes.push({label:'Calculations',type:'Maths'});
    if(pack.practicals.length)nodes.push({label:'Required practicals',type:'Practical'});
    nodes.push({label:'Exam Skills',type:'Exam'});nodes.push({label:'Revision',type:'Review'});
    return nodes;
  }

  function buildRevisionPack(topic){
    const list=entries(topic);const guide=RICH.guides?.[topic.id]||{};
    const terms=keyTerms(list);
    const pack={topicId:topic.id,title:topic.title,code:topic.code,subject:topic.subject,ideas:keyIdeas(list),terms,equations:equations(list),practicals:practicals(list),misconceptions:misconceptions(list)};
    pack.retrieval=retrievalQuestions(list,terms,topic);
    pack.exam=examQuestions(topic,list);
    pack.map=topicMap(topic,guide,pack);
    return pack;
  }

  function section(title,kicker,body,cls=''){
    return `<section class="textbook-revision-block ${cls}"><div class="textbook-revision-label"><span class="eyebrow">${esc(kicker)}</span><h3>${esc(title)}</h3></div>${body}</section>`;
  }

  function renderRevisionPage(page,topic,pack){
    const state=load();const savedAnswers=state.answers||{};
    page.innerHTML=`
      <header class="textbook-revision-head"><div><span class="eyebrow">End-of-topic revision</span><h2>${esc(topic.code)} · ${esc(topic.title)}</h2><p>Use this page after learning the chapter: scan the summary, test retrieval without notes, then finish with exam practice.</p></div><button type="button" data-revision-bookmark-page>☆ Bookmark revision page</button></header>
      ${section('Topic map','See the whole chapter',`<div class="textbook-topic-map">${pack.map.map((n,i)=>`<div><span>${i+1}</span><small>${esc(n.type)}</small><strong>${esc(n.label)}</strong></div>`).join('<b>→</b>')}</div>`,'map')}
      ${section('One-page summary','Remember the big ideas',`<div class="textbook-summary-grid">${pack.ideas.map((x,i)=>`<article><span>${i+1}</span><p>${esc(x)}</p></article>`).join('')}</div>`,'summary')}
      ${section('Key vocabulary','Say it scientifically',`<div class="textbook-revision-terms">${pack.terms.map(t=>`<details><summary>${esc(t.term)}</summary><p>${esc(t.definition)}</p></details>`).join('')}</div>`,'terms')}
      ${pack.equations.length?section('Equations to know','Maths check',`<div class="textbook-revision-equations">${pack.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div>`,'equations'):''}
      ${pack.practicals.length?section('Required practical links','Practical check',`<div class="textbook-revision-practicals">${pack.practicals.map(p=>`<article><strong>${esc(p.title)}</strong><p>${esc(p.reference)}</p></article>`).join('')}</div>`,'practicals'):''}
      ${section('Common misconceptions','Avoid these exam traps',`<div class="textbook-revision-misconceptions">${pack.misconceptions.map((m,i)=>`<article><span>!</span><p>${esc(m)}</p></article>`).join('')}</div>`,'misconceptions')}
      ${section('10-question retrieval','Close the textbook first',`<div class="textbook-retrieval-set">${pack.retrieval.map((q,i)=>`<article><header><span>${i+1}</span><div><small>${esc(q.type)} · ${esc(q.source)}</small><strong>${esc(q.question)}</strong></div></header><textarea rows="3" data-revision-answer="retrieval-${i}" placeholder="Answer from memory…">${esc(savedAnswers[`${topic.id}:retrieval-${i}`]||'')}</textarea><button type="button" data-revision-reveal>Reveal answer</button><div class="textbook-revision-answer" hidden><p>${esc(q.answer)}</p></div></article>`).join('')}</div>`,'retrieval')}
      ${section('3 exam questions','Finish with application',`<div class="textbook-revision-exam">${pack.exam.map((q,i)=>`<article><header><span class="textbook-command-chip">${esc(q.command)}</span><b>${esc(q.marks)} marks</b></header><p>${esc(q.question)}</p><textarea rows="5" data-revision-answer="exam-${i}" placeholder="Write your exam answer…">${esc(savedAnswers[`${topic.id}:exam-${i}`]||'')}</textarea><button type="button" data-revision-reveal>Reveal model guidance</button><div class="textbook-revision-answer" hidden><p>${esc(q.answer)}</p><small>Indicative teaching guidance, not an official AQA mark scheme.</small></div></article>`).join('')}</div>`,'exam')}`;

    page.querySelectorAll('[data-revision-answer]').forEach(area=>area.addEventListener('input',()=>{const all=load();all.answers=all.answers||{};all.answers[`${topic.id}:${area.dataset.revisionAnswer}`]=area.value;save(all);}));
    page.querySelectorAll('[data-revision-reveal]').forEach(btn=>btn.addEventListener('click',()=>{const ans=btn.nextElementSibling;ans.hidden=!ans.hidden;btn.textContent=ans.hidden?(btn.closest('.textbook-revision-exam')?'Reveal model guidance':'Reveal answer'):'Hide answer';}));
  }

  function bookmarkRecord(topicId){const all=load();all.bookmarks=all.bookmarks||{};all.bookmarks[topicId]=all.bookmarks[topicId]||[];return{all,list:all.bookmarks[topicId]};}
  function toggleBookmark(reader,pageId){
    const topicId=reader.dataset.textbookTopic;const {all,list}=bookmarkRecord(topicId);const at=list.indexOf(pageId);if(at>=0)list.splice(at,1);else list.push(pageId);save(all);refreshBookmarks(reader);
  }
  function activePageId(reader){return (reader._textbookPages||[]).find(p=>p.node.classList.contains('active'))?.id||'contents';}
  function refreshBookmarks(reader){
    const topicId=reader.dataset.textbookTopic;const {list}=bookmarkRecord(topicId);const current=activePageId(reader);const btn=reader.querySelector('[data-textbook-bookmark-current]');if(btn){const on=list.includes(current);btn.textContent=on?'★ Bookmarked':'☆ Bookmark';btn.classList.toggle('active',on);}
    const box=reader.querySelector('[data-textbook-bookmark-list]');if(box){const pages=reader._textbookPages||[];box.innerHTML=list.length?list.map(id=>{const p=pages.find(x=>x.id===id);return p?`<button type="button" data-bookmark-jump="${esc(id)}">★ ${esc(p.label)}</button>`:'';}).join(''):'<span>No bookmarks yet.</span>';box.querySelectorAll('[data-bookmark-jump]').forEach(b=>b.addEventListener('click',()=>{const i=pages.findIndex(p=>p.id===b.dataset.bookmarkJump);if(i>=0)reader._textbookShow(i,{focus:true});}));}
  }

  function addBookmarkTools(reader){
    if(reader.dataset.phaseT7Bookmarks==='done')return;
    const top=reader.querySelector('.textbook-reader-topbar');if(top&&!top.querySelector('[data-textbook-bookmark-current]')){const btn=document.createElement('button');btn.type='button';btn.className='textbook-bookmark-current';btn.dataset.textbookBookmarkCurrent='';btn.textContent='☆ Bookmark';btn.addEventListener('click',()=>toggleBookmark(reader,activePageId(reader)));top.appendChild(btn);}
    const side=reader.querySelector('.textbook-reader-sidebar');if(side&&!side.querySelector('[data-textbook-bookmarks]')){const wrap=document.createElement('section');wrap.className='textbook-bookmarks';wrap.dataset.textbookBookmarks='';wrap.innerHTML='<strong>Bookmarks</strong><div data-textbook-bookmark-list></div>';side.appendChild(wrap);}
    reader.querySelectorAll('[data-textbook-nav], [data-textbook-prev], [data-textbook-next], [data-textbook-jump]').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(()=>refreshBookmarks(reader))));
    reader.dataset.phaseT7Bookmarks='done';refreshBookmarks(reader);
  }

  function addRevisionPage(reader,topic,pack){
    const pages=reader._textbookPages;if(!Array.isArray(pages)||!reader._textbookShow)return false;if(pages.some(p=>p.id==='revision'))return true;
    const page=document.createElement('section');page.className='textbook-reader-page textbook-revision-page';page.dataset.textbookPage='revision';page.dataset.textbookPageType='Revision';page.hidden=true;renderRevisionPage(page,topic,pack);
    reader.querySelector('[data-textbook-pages]')?.appendChild(page);pages.push({id:'revision',label:'Revision',type:'End-of-topic review',node:page});
    const nav=reader.querySelector('[data-textbook-page-nav]');if(nav){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookNav='revision';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>End-of-topic review</small><strong>Revision</strong></div><b data-textbook-check>○</b>`;btn.addEventListener('click',()=>{reader._textbookShow(pages.findIndex(p=>p.id==='revision'),{focus:true});requestAnimationFrame(()=>refreshBookmarks(reader));});nav.appendChild(btn);}
    const cover=reader.querySelector('[data-textbook-page="contents"] [data-textbook-contents-list]');if(cover){const btn=document.createElement('button');btn.type='button';btn.dataset.textbookJump='revision';btn.innerHTML=`<span>${String(pages.length-1).padStart(2,'0')}</span><div><small>End-of-topic review</small><strong>Revision</strong></div><b>→</b>`;btn.addEventListener('click',()=>{reader._textbookShow(pages.findIndex(p=>p.id==='revision'),{focus:true});requestAnimationFrame(()=>refreshBookmarks(reader));});cover.appendChild(btn);}
    page.querySelector('[data-revision-bookmark-page]')?.addEventListener('click',()=>toggleBookmark(reader,'revision'));
    return true;
  }

  function enhance(reader){
    if(!reader||reader.dataset.phaseT7==='done')return false;const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);if(!topic)return false;
    const pack=buildRevisionPack(topic);if(pack.retrieval.length<10||pack.exam.length<3)return false;
    if(!addRevisionPage(reader,topic,pack))return false;addBookmarkTools(reader);reader.dataset.phaseT7='done';return true;
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);
  window.GCSE_TEXTBOOK_PHASE7={buildRevisionPack,retrievalQuestions,enhance,storageKey:STORAGE_KEY};
})();
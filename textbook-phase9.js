(() => {
  const DATA=window.GCSE_COURSE_DATA;
  if(!DATA)return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9α-ω+−-]+/g,' ').replace(/\s+/g,' ').trim();
  const words=v=>norm(v).split(' ').filter(x=>x.length>3);

  function pageText(page){return [page.label,page.type,page.node?.textContent||''].join(' ');}
  function indexPages(reader){return (reader._textbookPages||[]).map((p,i)=>({id:p.id,label:p.label,type:p.type,index:i,text:pageText(p)}));}
  function searchPages(reader,query){
    const q=words(query);if(!q.length)return [];
    return indexPages(reader).map(p=>{const hay=norm(p.text);let score=0;q.forEach(w=>{if(norm(p.label).includes(w))score+=5;if(norm(p.type).includes(w))score+=2;score+=(hay.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;});return {...p,score};}).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,12);
  }

  function installSearch(reader){
    if(reader.dataset.phaseT9Search==='done')return;
    const top=reader.querySelector('.textbook-reader-topbar');if(!top)return;
    const wrap=document.createElement('div');wrap.className='textbook-search';wrap.innerHTML=`<label><span class="sr-only">Search this textbook chapter</span><input type="search" data-textbook-search placeholder="Search this chapter…" autocomplete="off"></label><div class="textbook-search-results" data-textbook-search-results hidden></div>`;
    top.appendChild(wrap);const input=wrap.querySelector('[data-textbook-search]'),results=wrap.querySelector('[data-textbook-search-results]');
    const render=()=>{const hits=searchPages(reader,input.value);if(!input.value.trim()){results.hidden=true;results.innerHTML='';return;}results.innerHTML=hits.length?hits.map(h=>`<button type="button" data-search-page="${esc(h.id)}"><small>${esc(h.type)}</small><strong>${esc(h.label)}</strong></button>`).join(''):'<span>No matching textbook page.</span>';results.hidden=false;results.querySelectorAll('[data-search-page]').forEach(btn=>btn.addEventListener('click',()=>{const pages=reader._textbookPages||[];const i=pages.findIndex(p=>p.id===btn.dataset.searchPage);if(i>=0)reader._textbookShow(i,{focus:true});input.value='';results.hidden=true;}));};
    input.addEventListener('input',render);input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';results.hidden=true;input.blur();}});document.addEventListener('click',e=>{if(!wrap.contains(e.target))results.hidden=true;});
    reader._textbookSearchFocus=()=>{input.focus();input.select();};reader.dataset.phaseT9Search='done';
  }

  function similarity(a,b){const A=new Set(words(a.node?.textContent||a.label));const B=new Set(words(b.node?.textContent||b.label));let n=0;A.forEach(w=>{if(B.has(w))n++;});return n;}
  function relatedPages(reader,current){
    const pages=reader._textbookPages||[];return pages.filter(p=>p!==current&&p.id!=='contents').map(p=>({p,score:similarity(current,p)})).sort((a,b)=>b.score-a.score).filter(x=>x.score>0).slice(0,3).map(x=>x.p);
  }
  function addCrossLinks(reader){
    const pages=reader._textbookPages||[];
    pages.filter(p=>p.id!=='contents').forEach(page=>{
      if(page.node.querySelector(':scope > .textbook-related-pages'))return;const related=relatedPages(reader,page);if(!related.length)return;
      const aside=document.createElement('aside');aside.className='textbook-related-pages';aside.innerHTML=`<div><span class="eyebrow">Keep connecting ideas</span><strong>Related pages</strong></div><nav>${related.map(p=>`<button type="button" data-related-page="${esc(p.id)}"><small>${esc(p.type)}</small><span>${esc(p.label)}</span><b>→</b></button>`).join('')}</nav>`;
      aside.querySelectorAll('[data-related-page]').forEach(btn=>btn.addEventListener('click',()=>{const i=pages.findIndex(p=>p.id===btn.dataset.relatedPage);if(i>=0)reader._textbookShow(i,{focus:true});}));page.node.appendChild(aside);
    });
  }

  function addQuickLinks(reader){
    const side=reader.querySelector('.textbook-reader-sidebar');if(!side||side.querySelector('[data-textbook-quicklinks]'))return;
    const preferred=['glossary','worked-example','visual-summary','working-scientifically','exam-skills','revision'];const pages=reader._textbookPages||[];const present=preferred.map(id=>pages.find(p=>p.id===id)).filter(Boolean);if(!present.length)return;
    const box=document.createElement('section');box.className='textbook-quicklinks';box.dataset.textbookQuicklinks='';box.innerHTML=`<strong>Quick links</strong>${present.map(p=>`<button type="button" data-quick-page="${esc(p.id)}">${esc(p.label)}</button>`).join('')}`;box.querySelectorAll('[data-quick-page]').forEach(btn=>btn.addEventListener('click',()=>{const i=pages.findIndex(p=>p.id===btn.dataset.quickPage);if(i>=0)reader._textbookShow(i,{focus:true});}));side.appendChild(box);
  }

  function enhance(reader){if(!reader||reader.dataset.phaseT9==='done')return false;installSearch(reader);addCrossLinks(reader);addQuickLinks(reader);reader.dataset.phaseT9='done';return true;}
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){const r=document.querySelector('#topicContent .textbook-reader');if(r?._textbookSearchFocus){e.preventDefault();r._textbookSearchFocus();}}});
  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});document.querySelectorAll('#topicContent .textbook-reader').forEach(enhance);
  window.GCSE_TEXTBOOK_PHASE9={indexPages,searchPages,relatedPages,enhance};
})();
(() => {
  if(typeof renderTextbook!=='function'||typeof state==='undefined')return;

  const STORAGE_KEY='gcse-science-textbook-reader-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
  let saved=parse(localStorage.getItem(STORAGE_KEY),{});
  const persist=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
  const subjectName=topic=>window.GCSE_COURSE_DATA?.subjects?.find(s=>s.id===topic.subject)?.name||topic.subject;

  function recordFor(topicId){
    if(!saved[topicId]||typeof saved[topicId]!=='object')saved[topicId]={current:'contents',visited:[]};
    if(!Array.isArray(saved[topicId].visited))saved[topicId].visited=[];
    return saved[topicId];
  }

  function pageMeta(id,label,type,node){return{id,label,type,node};}

  function buildContents(topic,guide,pages){
    const cover=document.createElement('section');
    cover.className='textbook-reader-page textbook-cover-page';
    cover.dataset.textbookPage='contents';
    cover.innerHTML=`
      <div class="textbook-cover-hero">
        <div>
          <span class="eyebrow">Digital textbook · ${esc(subjectName(topic))} Paper ${esc(topic.paper)}</span>
          <h2>${esc(topic.code)} · ${esc(topic.title)}</h2>
          <p>${esc(topic.summary||'Read this topic as a sequence of focused textbook pages.')}</p>
        </div>
        <div class="textbook-cover-mark"><strong>${esc(topic.code)}</strong><span>${esc(subjectName(topic))}</span></div>
      </div>
      <div class="textbook-cover-guide">
        <strong>How to use this chapter</strong>
        <span>Read one page at a time.</span><span>Open highlighted terminology when needed.</span><span>Use the worked example after the core sections.</span><span>Finish with diagrams and the glossary.</span>
      </div>
      <div class="textbook-contents-list" data-textbook-contents-list></div>`;
    const list=cover.querySelector('[data-textbook-contents-list]');
    pages.filter(p=>p.id!=='contents').forEach((page,index)=>{
      const button=document.createElement('button');button.type='button';button.dataset.textbookJump=page.id;
      button.innerHTML=`<span>${String(index+1).padStart(2,'0')}</span><div><small>${esc(page.type)}</small><strong>${esc(page.label)}</strong></div><b>→</b>`;
      list.appendChild(button);
    });
    return cover;
  }

  function upgradeTextbook(topic,guide){
    if(state.activeTab!=='textbook')return;
    const root=document.querySelector('#topicContent .enhanced-textbook');
    if(!root||root.dataset.phaseT1==='done')return;
    const main=root.querySelector('.enhanced-textbook-main');
    if(!main)return;
    const chapters=[...main.querySelectorAll(':scope > .enhanced-chapter')];
    const worked=main.querySelector(':scope > .worked-example');
    const diagrams=root.querySelector(':scope > .textbook-diagram-gallery');
    const glossary=root.querySelector(':scope > .terminology-section');
    if(!chapters.length||!worked||!diagrams||!glossary)return;

    const pages=[];
    chapters.forEach((node,index)=>{
      const title=node.querySelector('h2')?.textContent?.trim()||`Section ${index+1}`;
      node.classList.add('textbook-reader-page','textbook-chapter-page');
      node.dataset.textbookPage=`chapter-${index+1}`;
      node.dataset.textbookPageType='Core section';
      node.querySelector('.eyebrow')?.replaceChildren(document.createTextNode(`${topic.code} · Chapter ${index+1}`));
      pages.push(pageMeta(`chapter-${index+1}`,title,'Core section',node));
    });

    worked.classList.add('textbook-reader-page','textbook-worked-page');
    worked.dataset.textbookPage='worked-example';worked.dataset.textbookPageType='Worked example';
    pages.push(pageMeta('worked-example',worked.querySelector('h2')?.textContent?.trim()||'Worked example','Worked example',worked));

    diagrams.classList.add('textbook-reader-page','textbook-visual-page');
    diagrams.dataset.textbookPage='visual-summary';diagrams.dataset.textbookPageType='Visual summary';
    pages.push(pageMeta('visual-summary',`Key diagrams for ${topic.title}`,'Visual summary',diagrams));

    glossary.classList.add('textbook-reader-page','textbook-glossary-page');
    glossary.dataset.textbookPage='glossary';glossary.dataset.textbookPageType='Key terminology';
    pages.push(pageMeta('glossary','Key terminology','Key terminology',glossary));

    const cover=buildContents(topic,guide,[pageMeta('contents','Contents','Chapter contents',null),...pages]);
    const allPages=[pageMeta('contents','Contents','Chapter contents',cover),...pages];

    const shell=document.createElement('div');shell.className=`textbook-reader ${topic.subject}`;shell.dataset.textbookTopic=topic.id;
    shell.innerHTML=`
      <aside class="textbook-reader-sidebar" aria-label="Textbook chapter contents">
        <div class="textbook-reader-sidebar-head"><span class="eyebrow">${esc(topic.code)}</span><strong>${esc(topic.title)}</strong><small data-textbook-progress-copy></small></div>
        <div class="textbook-reader-progress" aria-hidden="true"><i data-textbook-progress-bar></i></div>
        <nav data-textbook-page-nav></nav>
      </aside>
      <section class="textbook-reader-main">
        <header class="textbook-reader-topbar">
          <button type="button" data-textbook-contents-toggle>☰ Contents</button>
          <div><small data-textbook-type></small><strong data-textbook-title></strong></div>
          <span data-textbook-count></span>
        </header>
        <main class="textbook-reader-pages" data-textbook-pages></main>
        <footer class="textbook-reader-footer">
          <button type="button" data-textbook-prev>← Previous page</button>
          <div><span data-textbook-footer-progress></span><div class="textbook-reader-footer-track"><i data-textbook-footer-bar></i></div></div>
          <button type="button" data-textbook-next>Next page →</button>
        </footer>
      </section>`;

    const pageHost=shell.querySelector('[data-textbook-pages]');
    pageHost.appendChild(cover);pages.forEach(page=>pageHost.appendChild(page.node));
    const nav=shell.querySelector('[data-textbook-page-nav]');
    allPages.forEach((page,index)=>{
      const btn=document.createElement('button');btn.type='button';btn.dataset.textbookNav=page.id;
      btn.innerHTML=`<span>${index===0?'⌂':String(index).padStart(2,'0')}</span><div><small>${esc(page.type)}</small><strong>${esc(page.label)}</strong></div><b data-textbook-check>○</b>`;
      nav.appendChild(btn);
    });

    root.replaceChildren(shell);root.dataset.phaseT1='done';
    const rec=recordFor(topic.id);
    let current=Math.max(0,allPages.findIndex(p=>p.id===rec.current));if(current<0)current=0;

    function updateProgress(){
      const viewed=new Set(rec.visited);const percent=Math.round(viewed.size/allPages.length*100);
      shell.querySelector('[data-textbook-progress-copy]').textContent=`${viewed.size} of ${allPages.length} pages viewed`;
      shell.querySelector('[data-textbook-progress-bar]').style.width=`${percent}%`;
      shell.querySelector('[data-textbook-footer-progress]').textContent=`Reading progress ${percent}%`;
      shell.querySelector('[data-textbook-footer-bar]').style.width=`${percent}%`;
      shell.querySelectorAll('[data-textbook-nav]').forEach(btn=>{btn.querySelector('[data-textbook-check]').textContent=viewed.has(btn.dataset.textbookNav)?'✓':'○';});
    }

    function show(index,{focus=false}={}){
      current=Math.max(0,Math.min(index,allPages.length-1));const page=allPages[current];
      allPages.forEach((item,i)=>{item.node.hidden=i!==current;item.node.classList.toggle('active',i===current);});
      shell.querySelectorAll('[data-textbook-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.textbookNav===page.id));
      shell.querySelector('[data-textbook-type]').textContent=page.type;
      shell.querySelector('[data-textbook-title]').textContent=page.label;
      shell.querySelector('[data-textbook-count]').textContent=`Page ${current+1} of ${allPages.length}`;
      shell.querySelector('[data-textbook-prev]').disabled=current===0;
      shell.querySelector('[data-textbook-next]').disabled=current===allPages.length-1;
      rec.current=page.id;if(!rec.visited.includes(page.id))rec.visited.push(page.id);persist();updateProgress();
      shell.classList.remove('contents-open');
      if(focus)shell.querySelector('.textbook-reader-topbar')?.scrollIntoView({behavior:'smooth',block:'start'});
    }

    nav.querySelectorAll('[data-textbook-nav]').forEach(btn=>btn.addEventListener('click',()=>show(allPages.findIndex(p=>p.id===btn.dataset.textbookNav),{focus:true})));
    cover.querySelectorAll('[data-textbook-jump]').forEach(btn=>btn.addEventListener('click',()=>show(allPages.findIndex(p=>p.id===btn.dataset.textbookJump),{focus:true})));
    shell.querySelector('[data-textbook-prev]').addEventListener('click',()=>show(current-1,{focus:true}));
    shell.querySelector('[data-textbook-next]').addEventListener('click',()=>show(current+1,{focus:true}));
    shell.querySelector('[data-textbook-contents-toggle]').addEventListener('click',()=>shell.classList.toggle('contents-open'));
    show(current);

    shell._textbookShow=show;shell._textbookPages=allPages;
  }

  const baseRenderTextbook=renderTextbook;
  renderTextbook=function(topic,guide){baseRenderTextbook(topic,guide);requestAnimationFrame(()=>upgradeTextbook(topic,guide));};

  document.addEventListener('keydown',event=>{
    if(state.activeTab!=='textbook'||event.altKey||event.ctrlKey||event.metaKey)return;
    if(document.querySelector('.term-modal:not([hidden]),.diagram-modal:not([hidden])'))return;
    const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    const shell=document.querySelector('#topicContent .textbook-reader');if(!shell?._textbookShow)return;
    const pages=shell._textbookPages||[],active=pages.findIndex(p=>p.node.classList.contains('active'));
    if(event.key==='ArrowRight'&&active<pages.length-1){event.preventDefault();shell._textbookShow(active+1,{focus:true});}
    if(event.key==='ArrowLeft'&&active>0){event.preventDefault();shell._textbookShow(active-1,{focus:true});}
  });

  window.GCSE_TEXTBOOK_PHASE1={upgradeTextbook,storageKey:STORAGE_KEY};
})();
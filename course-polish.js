(() => {
  const TAB_GROUPS={
    learn:['overview','lessons','textbook','activities'],
    practical:['practicals','simulation'],
    practice:['exam','quiz'],
    revise:['equations','coach']
  };
  const GROUP_LABELS={learn:'Learn',practical:'Practicals',practice:'Practice',revise:'Revise'};
  const noteSearchState={query:'',topicOnly:false};
  let selectionButton=null;

  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const groupForTab=tab=>Object.entries(TAB_GROUPS).find(([,tabs])=>tabs.includes(tab))?.[0]||'learn';
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'');

  function simplifyTopicTabs(){
    const tabs=document.getElementById('contentTabs');
    const quick=document.getElementById('topicQuickNav');
    if(!tabs) return;
    const group=groupForTab(state.activeTab);
    tabs.dataset.group=group;
    tabs.setAttribute('aria-label',`${GROUP_LABELS[group]} sections`);
    tabs.querySelectorAll('[data-tab]').forEach(btn=>{
      const visible=TAB_GROUPS[group].includes(btn.dataset.tab);
      btn.hidden=!visible;
      btn.classList.toggle('active',btn.dataset.tab===state.activeTab);
    });
    quick?.querySelectorAll('[data-topic-quick]').forEach(btn=>{
      const targetGroup=groupForTab(btn.dataset.topicQuick);
      btn.classList.toggle('active',targetGroup===group);
      btn.setAttribute('aria-pressed',targetGroup===group?'true':'false');
    });
    let label=document.getElementById('contextTabLabel');
    if(!label){
      label=document.createElement('div');
      label.id='contextTabLabel';
      label.className='context-tab-label';
      tabs.parentNode.insertBefore(label,tabs);
    }
    label.innerHTML=`<span>${GROUP_LABELS[group]}</span><small>Choose a section</small>`;
  }

  function tidyHome(){
    const paper=document.querySelector('.paper-map');
    if(paper&&!paper.closest('details.course-extra-map')){
      const details=document.createElement('details');
      details.className='course-extra-map';
      const summary=document.createElement('summary');
      summary.innerHTML='<span>Exam paper map</span><small>Show Biology, Chemistry and Physics Paper 1 / Paper 2 coverage</small>';
      paper.parentNode.insertBefore(details,paper);
      details.append(summary,paper);
    }
    const hero=document.querySelector('#homeView .hero');
    if(hero&&!hero.querySelector('.home-route-hint')){
      const hint=document.createElement('div');
      hint.className='home-route-hint';
      hint.innerHTML='<span>1</span> Choose a subject <b>→</b><span>2</span> Open a topic <b>→</b><span>3</span> Learn · practise · revise';
      hero.appendChild(hint);
    }
  }

  function specMetaFor(lesson){
    return lesson?.biologyMeta||lesson?.chemistryMeta||lesson?.physicsMeta||null;
  }
  function subjectReason(subject){
    if(subject==='biology') return 'Build explanations as structure → function → biological process → consequence.';
    if(subject==='chemistry') return 'Build explanations as particles/bonding → chemical change → observation → equation or evidence.';
    return 'Build explanations as system → physical quantity → relationship/equation → predicted behaviour.';
  }
  function detailedLessonHtml(lesson){
    const topic=activeTopic(); if(!topic) return '';
    const meta=specMetaFor(lesson);
    const focus=meta?.focus||lesson.objectives||[];
    const terms=(lesson.terms||[]).slice(0,6);
    const explanation=lesson.depth?.explanation||lesson.section?.[1]||topic.summary;
    const application=lesson.depth?.application||lesson.sequence?.application||`Apply ${lesson.title.toLowerCase()} to an unfamiliar GCSE context.`;
    const misconception=lesson.depth?.misconception||lesson.sequence?.misconception||'Use precise scientific language rather than a vague everyday description.';
    return `<section class="lesson-detail-plus" data-note-block data-note-title="${esc(lesson.title)} · Detailed notes">
      <div class="lesson-detail-head"><div><span class="eyebrow">Detailed lesson notes</span><h3>Understand it in depth</h3></div>${meta?.ref?`<span class="spec-chip">AQA ${esc(meta.ref)}</span>`:''}</div>
      <div class="detail-reading"><h4>Core explanation</h4><p>${esc(explanation)}</p></div>
      <div class="detail-focus-grid">
        ${focus.map((point,i)=>`<article><span>${i+1}</span><div><strong>${i===0?'Know this':i===1?'Understand this':'Apply this'}</strong><p>${esc(point)}</p></div></article>`).join('')}
      </div>
      <div class="detail-connection"><strong>How to build a strong explanation</strong><p>${esc(subjectReason(topic.subject))}</p></div>
      ${terms.length?`<div class="detail-language"><strong>Terminology to use accurately</strong><div>${terms.map(([t,d])=>`<button type="button" class="detail-term" title="${esc(d)}">${esc(t)}</button>`).join('')}</div></div>`:''}
      <div class="detail-exam-grid">
        <article><span class="eyebrow">Apply it</span><p>${esc(application)}</p></article>
        <article><span class="eyebrow">Avoid this mistake</span><p>${esc(misconception)}</p></article>
        <article><span class="eyebrow">Check yourself</span><p>Can you explain the idea without notes, use at least two key terms accurately, and apply it to a new example?</p></article>
      </div>
    </section>`;
  }

  if(typeof lessonExpandedHtml==='function'){
    const previousLessonExpanded=lessonExpandedHtml;
    lessonExpandedHtml=function(lesson){return `${previousLessonExpanded(lesson)}${detailedLessonHtml(lesson)}`;};
  }

  function noteTextFromBlock(block){
    const clone=block.cloneNode(true);
    clone.querySelectorAll('button,.save-note-chip,.phase-number,.eyebrow').forEach(el=>el.remove());
    return clone.innerText.replace(/\n{3,}/g,'\n\n').trim().slice(0,3000);
  }
  function addNote(text,title='Saved course note',source='course'){
    const clean=String(text||'').trim(); if(!clean) return false;
    const topic=activeTopic();
    notes.push({id:Date.now()+Math.random(),topic:els.topicView.hidden?null:topic?.id||null,text:clean,title,source,created:new Date().toISOString()});
    saveNotes();
    showNoteToast('Saved to notebook');
    return true;
  }
  function showNoteToast(message){
    let toast=document.getElementById('noteSaveToast');
    if(!toast){toast=document.createElement('div');toast.id='noteSaveToast';toast.className='note-save-toast';document.body.appendChild(toast);}
    toast.textContent=message;toast.classList.add('show');clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.classList.remove('show'),1700);
  }

  function injectSaveButtons(){
    const root=document.getElementById('topicContent'); if(!root) return;
    const selectors=['.learn-card','.journey-card','.textbook-chapter','.worked-example','.diagram-study-card','.term-explorer','.lesson-detail-plus','.practical-list article','.exam-card','.activity-card'];
    root.querySelectorAll(selectors.join(',')).forEach(block=>{
      if(block.querySelector(':scope > .save-note-chip')) return;
      block.setAttribute('data-note-block','');
      const heading=block.querySelector('h2,h3,h4,strong')?.textContent?.trim()||'Course note';
      if(!block.dataset.noteTitle) block.dataset.noteTitle=heading;
      const btn=document.createElement('button');
      btn.type='button';btn.className='save-note-chip';btn.innerHTML='＋ Save to notebook';
      btn.addEventListener('click',e=>{e.stopPropagation();addNote(noteTextFromBlock(block),block.dataset.noteTitle||heading,'block');});
      block.appendChild(btn);
    });
  }

  function ensureSelectionButton(){
    if(selectionButton) return selectionButton;
    selectionButton=document.createElement('button');
    selectionButton.type='button';selectionButton.className='selection-save-button';selectionButton.textContent='＋ Save selection';selectionButton.hidden=true;
    document.body.appendChild(selectionButton);
    selectionButton.addEventListener('mousedown',e=>e.preventDefault());
    selectionButton.addEventListener('click',()=>{
      const sel=window.getSelection();const text=sel?.toString().trim();
      if(text) addNote(text,'Selected course text','selection');
      sel?.removeAllRanges();selectionButton.hidden=true;
    });
    return selectionButton;
  }
  function positionSelectionButton(){
    const btn=ensureSelectionButton();const sel=window.getSelection();
    if(!sel||sel.isCollapsed||!sel.rangeCount){btn.hidden=true;return;}
    const text=sel.toString().trim(); if(text.length<3||text.length>1500){btn.hidden=true;return;}
    const range=sel.getRangeAt(0);const root=document.getElementById('topicContent');
    if(!root||!root.contains(range.commonAncestorContainer)){btn.hidden=true;return;}
    const rect=range.getBoundingClientRect(); if(!rect.width&&!rect.height){btn.hidden=true;return;}
    btn.hidden=false;btn.style.left=`${Math.min(window.innerWidth-155,Math.max(8,rect.left+rect.width/2-65))}px`;btn.style.top=`${Math.max(8,rect.top+window.scrollY-42)}px`;
  }

  function enhanceNotebookShell(){
    const notebook=document.getElementById('notebook'); if(!notebook||notebook.querySelector('.notebook-tools')) return;
    const tools=document.createElement('div');tools.className='notebook-tools';
    tools.innerHTML=`<input id="notebookSearch" type="search" placeholder="Search saved notes…" aria-label="Search notebook"><label><input id="notebookTopicOnly" type="checkbox"> Current topic only</label><div class="notebook-help">Tip: highlight any textbook or lesson text and press <strong>Save selection</strong>.</div>`;
    notebook.insertBefore(tools,els.notebookInput);
    tools.querySelector('#notebookSearch').addEventListener('input',e=>{noteSearchState.query=e.target.value.toLowerCase();renderNotes();});
    tools.querySelector('#notebookTopicOnly').addEventListener('change',e=>{noteSearchState.topicOnly=e.target.checked;renderNotes();});
  }

  if(typeof renderNotes==='function'){
    const baseRenderNotes=renderNotes;
    renderNotes=function(){
      const query=noteSearchState.query;
      const current=activeTopic()?.id;
      const filtered=notes.filter(note=>(!noteSearchState.topicOnly||note.topic===current)&&(!query||`${note.title||''} ${note.text||''}`.toLowerCase().includes(query)));
      if(!filtered.length){els.notesList.innerHTML='<div class="empty-notes">No matching notes yet.</div>';return;}
      els.notesList.innerHTML=[...filtered].reverse().map(note=>{const topic=topics.find(t=>t.id===note.topic);return `<article class="note enhanced-note"><div><span><strong>${esc(note.title||'Saved note')}</strong><small>${topic?`${topic.code} · ${esc(topic.title)}`:'General Science'}</small></span><button type="button" data-delete-note="${note.id}" aria-label="Delete note">×</button></div><p>${esc(note.text).replace(/\n/g,'<br>')}</p><footer><span>${note.source==='selection'?'Highlighted text':note.source==='block'?'Saved section':'Manual note'}</span><small>${new Date(note.created).toLocaleString()}</small></footer></article>`;}).join('');
      els.notesList.querySelectorAll('[data-delete-note]').forEach(btn=>btn.addEventListener('click',()=>{notes=notes.filter(n=>String(n.id)!==btn.dataset.deleteNote);saveNotes();renderNotes();}));
    };
  }

  if(typeof renderTopic==='function'){
    const baseRenderTopic=renderTopic;
    renderTopic=function(){baseRenderTopic();simplifyTopicTabs();requestAnimationFrame(injectSaveButtons);};
  }
  if(typeof renderHome==='function'){
    const baseRenderHome=renderHome;
    renderHome=function(){baseRenderHome();tidyHome();};
  }

  document.addEventListener('mouseup',()=>setTimeout(positionSelectionButton,0));
  document.addEventListener('keyup',e=>{if(e.key==='Shift'||e.key.startsWith('Arrow'))setTimeout(positionSelectionButton,0);});
  document.addEventListener('scroll',()=>{if(selectionButton&&!selectionButton.hidden)positionSelectionButton();},{passive:true});
  document.addEventListener('mousedown',e=>{if(selectionButton&&!selectionButton.contains(e.target))selectionButton.hidden=true;});

  enhanceNotebookShell();tidyHome();simplifyTopicTabs();requestAnimationFrame(injectSaveButtons);
  window.GCSE_COURSE_POLISH={TAB_GROUPS,addNote,detailedLessonHtml,simplifyTopicTabs};
})();
(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof notes==='undefined'||!window.GCSE_COURSE_POLISH) return;
  const META_KEY='gcse-science-notebook-meta-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let meta=parse(localStorage.getItem(META_KEY),{});
  const filters={query:'',subject:'all',topic:'all',type:'all',reviewOnly:false};
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const saveMeta=()=>localStorage.setItem(META_KEY,JSON.stringify(meta));
  const sourceType=source=>{
    const s=String(source||'').toLowerCase();
    if(s.includes('diagram')||s.includes('visual'))return'diagram';
    if(s.includes('equation')||s.includes('calculation'))return'equation';
    if(s.includes('practical'))return'practical';
    if(s.includes('exam')||s.includes('question')||s.includes('whiteboard'))return'question';
    if(s.includes('mastery')||s.includes('review'))return'review';
    if(s.includes('presentation'))return'slide';
    if(s.includes('selection'))return'selection';
    if(s.includes('block'))return'section';
    return'manual';
  };
  const typeLabel=t=>({diagram:'Diagram',equation:'Equation',practical:'Practical',question:'Question',review:'Review plan',slide:'Slide',selection:'Selection',section:'Saved section',manual:'Manual note'}[t]||'Note');
  function inferLesson(topic,note){
    if(!topic)return'';
    const hay=`${note.title||''} ${note.text||''}`.toLowerCase();
    const matches=topic.lessons.map((x,i)=>({title:x?.[0]||'',i})).filter(x=>x.title&&hay.includes(x.title.toLowerCase()));
    if(matches.length)return matches.sort((a,b)=>b.title.length-a.title.length)[0].title;
    const deck=document.querySelector?.('.lesson-presentation');
    if(deck&&topic.id===state.activeTopicId)return deck.dataset.lessonTitle||'';
    return'';
  }
  function normalize(note){
    const id=String(note.id);const existing=meta[id]||{};
    const topic=topics.find(t=>t.id===(existing.topicId||note.topic))||null;
    const lessonTitle=existing.lessonTitle||inferLesson(topic,note);
    const out={
      subject:existing.subject||topic?.subject||'general',topicId:existing.topicId||topic?.id||null,lessonTitle,
      type:existing.type||sourceType(note.source),review:Boolean(existing.review),pinned:Boolean(existing.pinned),updated:existing.updated||note.created||new Date().toISOString()
    };
    meta[id]=out;return out;
  }
  function captureContext(source){
    const topic=activeTopic();const deck=document.querySelector?.('.lesson-presentation');
    return{subject:topic?.subject||'general',topicId:topic?.id||null,lessonTitle:deck?.dataset.lessonTitle||'',type:sourceType(source),review:sourceType(source)==='review',pinned:false,updated:new Date().toISOString()};
  }
  const baseAdd=window.GCSE_COURSE_POLISH.addNote;
  window.GCSE_COURSE_POLISH.addNote=function(text,title='Saved course note',source='course'){
    const before=notes.length;const ok=baseAdd(text,title,source);
    if(ok&&notes.length>before){const note=notes[notes.length-1];meta[String(note.id)]=captureContext(source);saveMeta();if(typeof renderNotes==='function')renderNotes();}
    return ok;
  };
  function ensureMetadata(){notes.forEach(normalize);saveMeta();}
  function availableTypes(){return [...new Set(notes.map(n=>normalize(n).type))].sort();}
  function filteredNotes(){
    const q=filters.query.toLowerCase();
    return notes.filter(note=>{
      const m=normalize(note),topic=topics.find(t=>t.id===m.topicId);
      if(filters.subject!=='all'&&m.subject!==filters.subject)return false;
      if(filters.topic!=='all'&&m.topicId!==filters.topic)return false;
      if(filters.type!=='all'&&m.type!==filters.type)return false;
      if(filters.reviewOnly&&!m.review)return false;
      if(q&&!`${note.title||''} ${note.text||''} ${topic?.title||''} ${m.lessonTitle||''} ${m.type}`.toLowerCase().includes(q))return false;
      return true;
    }).sort((a,b)=>{
      const ma=normalize(a),mb=normalize(b);if(ma.pinned!==mb.pinned)return ma.pinned?-1:1;return new Date(b.created||0)-new Date(a.created||0);
    });
  }
  function groupNotes(list){
    const groups={};
    list.forEach(note=>{
      const m=normalize(note),topic=topics.find(t=>t.id===m.topicId);const subject=m.subject||'general';const topicKey=topic?.id||'general';const lesson=m.lessonTitle||'General notes';
      groups[subject]||={};groups[subject][topicKey]||={topic,lessons:{}};groups[subject][topicKey].lessons[lesson]||=[];groups[subject][topicKey].lessons[lesson].push(note);
    });return groups;
  }
  function noteCard(note){
    const m=normalize(note);return `<article class="notebook-entry-card ${m.pinned?'pinned':''} ${m.review?'review':''}" data-note-id="${esc(note.id)}"><header><span class="notebook-type-chip">${esc(typeLabel(m.type))}</span><div class="notebook-entry-actions"><button type="button" data-note-review title="${m.review?'Remove from review':'Add to review'}">${m.review?'✓ Review':'＋ Review'}</button><button type="button" data-note-pin title="${m.pinned?'Unpin':'Pin note'}">${m.pinned?'★':'☆'}</button><button type="button" data-delete-note="${esc(note.id)}" aria-label="Delete note">×</button></div></header><strong>${esc(note.title||'Saved note')}</strong><p>${esc(note.text||'').replace(/\n/g,'<br>')}</p><footer>${m.lessonTitle?`<span>${esc(m.lessonTitle)}</span>`:'<span>Topic note</span>'}<small>${new Date(note.created||Date.now()).toLocaleString()}</small></footer></article>`;}
  function renderStructured(){
    if(typeof els==='undefined'||!els.notesList)return;
    ensureMetadata();const list=filteredNotes();
    const stats=document.querySelector('[data-notebook-stats]');if(stats){const review=list.filter(n=>normalize(n).review).length;stats.innerHTML=`<strong>${list.length}</strong><span>notes shown</span><strong>${review}</strong><span>for review</span>`;}
    if(!list.length){els.notesList.innerHTML='<div class="empty-notes">No matching notes yet.</div>';return;}
    const groups=groupNotes(list);const subjectNames={biology:'Biology',chemistry:'Chemistry',physics:'Physics',general:'General Science'};
    els.notesList.innerHTML=Object.entries(groups).map(([subject,topicGroups])=>`<section class="notebook-subject-group"><div class="notebook-group-heading"><span>${subject==='biology'?'🧬':subject==='chemistry'?'⚗️':subject==='physics'?'⚡':'📝'}</span><h3>${subjectNames[subject]||subject}</h3></div>${Object.values(topicGroups).map(group=>`<details class="notebook-topic-group" open><summary><strong>${group.topic?`${esc(group.topic.code)} · ${esc(group.topic.title)}`:'General notes'}</strong><span>${Object.values(group.lessons).reduce((n,a)=>n+a.length,0)} notes</span></summary>${Object.entries(group.lessons).map(([lesson,items])=>`<section class="notebook-lesson-group"><h4>${esc(lesson)}</h4>${items.map(noteCard).join('')}</section>`).join('')}</details>`).join('')}</section>`).join('');
    els.notesList.querySelectorAll('[data-note-review]').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('[data-note-id]'),id=card.dataset.noteId;meta[id]||=normalize(notes.find(n=>String(n.id)===id)||{});meta[id].review=!meta[id].review;meta[id].updated=new Date().toISOString();saveMeta();renderStructured();}));
    els.notesList.querySelectorAll('[data-note-pin]').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('[data-note-id]'),id=card.dataset.noteId;meta[id]||=normalize(notes.find(n=>String(n.id)===id)||{});meta[id].pinned=!meta[id].pinned;meta[id].updated=new Date().toISOString();saveMeta();renderStructured();}));
    els.notesList.querySelectorAll('[data-delete-note]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.deleteNote;notes=notes.filter(n=>String(n.id)!==id);delete meta[id];saveMeta();if(typeof saveNotes==='function')saveNotes();renderStructured();}));
  }
  function buildShell(){
    const notebook=document.getElementById('notebook');if(!notebook||notebook.querySelector('.notebook-organizer'))return;
    const old=notebook.querySelector('.notebook-tools');if(old)old.hidden=true;
    const panel=document.createElement('section');panel.className='notebook-organizer';
    panel.innerHTML=`<div class="notebook-dashboard"><div><span class="eyebrow">Organised notebook</span><h3>Subject → topic → lesson</h3></div><div class="notebook-stats" data-notebook-stats></div></div><div class="notebook-filter-grid"><input type="search" data-notebook-query placeholder="Search notes, lessons or topics…"><select data-notebook-subject><option value="all">All subjects</option><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option><option value="general">General</option></select><select data-notebook-topic><option value="all">All topics</option>${topics.map(t=>`<option value="${esc(t.id)}">${esc(t.code)} · ${esc(t.title)}</option>`).join('')}</select><select data-notebook-type><option value="all">All note types</option>${['slide','diagram','equation','practical','question','review','section','selection','manual'].map(t=>`<option value="${t}">${typeLabel(t)}</option>`).join('')}</select><label><input type="checkbox" data-notebook-review> Review list only</label><button type="button" data-notebook-clear>Clear filters</button></div><div class="notebook-organizer-tip">Pin important notes with ★. Mark anything you want to revisit as <strong>Review</strong>.</div>`;
    const input=typeof els!=='undefined'?els.notebookInput:notebook.querySelector('textarea');notebook.insertBefore(panel,input);
    panel.querySelector('[data-notebook-query]').addEventListener('input',e=>{filters.query=e.target.value;renderStructured();});
    panel.querySelector('[data-notebook-subject]').addEventListener('change',e=>{filters.subject=e.target.value;renderStructured();});
    panel.querySelector('[data-notebook-topic]').addEventListener('change',e=>{filters.topic=e.target.value;renderStructured();});
    panel.querySelector('[data-notebook-type]').addEventListener('change',e=>{filters.type=e.target.value;renderStructured();});
    panel.querySelector('[data-notebook-review]').addEventListener('change',e=>{filters.reviewOnly=e.target.checked;renderStructured();});
    panel.querySelector('[data-notebook-clear]').addEventListener('click',()=>{Object.assign(filters,{query:'',subject:'all',topic:'all',type:'all',reviewOnly:false});panel.querySelector('[data-notebook-query]').value='';panel.querySelector('[data-notebook-subject]').value='all';panel.querySelector('[data-notebook-topic]').value='all';panel.querySelector('[data-notebook-type]').value='all';panel.querySelector('[data-notebook-review]').checked=false;renderStructured();});
  }
  const previousRender=typeof renderNotes==='function'?renderNotes:null;
  renderNotes=renderStructured;
  buildShell();renderStructured();
  window.GCSE_NOTEBOOK_ORGANIZER={normalize,filteredNotes,groupNotes,sourceType,typeLabel,render:renderStructured,meta:()=>meta,filters};
})();
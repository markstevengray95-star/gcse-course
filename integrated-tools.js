(() => {
  const TOOLS={
    arcade:{title:'Science Word Arcade',subtitle:'Command words · variables · scientific vocabulary',src:'tools/science-word-arcade.html'},
    physics:{title:'AQA Physics Interactive',subtitle:'Relationships · rearranging · SI units · calculations',src:'tools/aqa-physics-interactive-fixed.html'}
  };
  const HISTORY_KEY='gcse-science-integrated-tool-history-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let history=parse(localStorage.getItem(HISTORY_KEY),[]);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'');

  function saveHistory(entry){
    history.push({...entry,date:new Date().toISOString()});
    history=history.slice(-80);
    localStorage.setItem(HISTORY_KEY,JSON.stringify(history));
    refreshHistoryChips();
  }
  function lastFor(tool){return [...history].reverse().find(x=>x.tool===tool)||null;}
  function historyText(tool){
    const h=lastFor(tool);if(!h)return '';
    if(tool==='word-arcade')return `Last result: ${h.accuracy??0}% · ${h.score??0} points`;
    return `Last activity: ${h.equation||'Physics calculation'}${h.success?' · completed':''}`;
  }

  function ensureModal(){
    if(document.getElementById('integratedToolModal'))return;
    const modal=document.createElement('div');modal.id='integratedToolModal';modal.className='integrated-tool-modal';modal.hidden=true;
    modal.innerHTML=`<div class="integrated-tool-shell"><div class="integrated-tool-head"><div><strong id="integratedToolTitle">Course tool</strong><small id="integratedToolSubtitle"></small></div><div><a id="integratedToolOpen" target="_blank" rel="noopener">Open full screen ↗</a><button type="button" id="integratedToolClose">Close ×</button></div></div><iframe id="integratedToolFrame" class="integrated-tool-frame" title="GCSE Science course tool" loading="lazy"></iframe></div>`;
    document.body.appendChild(modal);
    document.getElementById('integratedToolClose').addEventListener('click',closeTool);
    modal.addEventListener('click',e=>{if(e.target===modal)closeTool();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeTool();});
  }
  function openTool(key){
    const t=TOOLS[key];if(!t)return;
    ensureModal();
    const modal=document.getElementById('integratedToolModal');
    const frame=document.getElementById('integratedToolFrame');
    document.getElementById('integratedToolTitle').textContent=t.title;
    document.getElementById('integratedToolSubtitle').textContent=t.subtitle;
    document.getElementById('integratedToolOpen').href=t.src;
    const current=frame.getAttribute('src')||'';
    if(current!==t.src)frame.setAttribute('src',t.src);
    frame.title=t.title;
    modal.hidden=false;document.body.style.overflow='hidden';
  }
  function closeTool(){
    const modal=document.getElementById('integratedToolModal');if(modal)modal.hidden=true;
    document.body.style.overflow='';
  }
  function bindLaunchers(root=document){root.querySelectorAll('[data-integrated-tool]').forEach(btn=>{if(btn.dataset.boundTool)return;btn.dataset.boundTool='1';btn.addEventListener('click',()=>openTool(btn.dataset.integratedTool));});}

  function arcadeCard(compact=false){return `<article class="integrated-tool-card arcade-card"><div class="tool-icon">🎮</div><div><h3>Science Word Arcade</h3><p>${compact?'Train command words, variables and scientific vocabulary before exam practice.':'Your uploaded exam-skills game: Command Cracker, Describe vs Explain, Variable Vault and Vocab Target, with scores, lives, streaks and error review.'}</p><span class="tool-history-chip" data-tool-history="word-arcade" ${lastFor('word-arcade')?'':'hidden'}>${esc(historyText('word-arcade'))}</span></div><div class="integrated-tool-actions"><button class="button primary" type="button" data-integrated-tool="arcade">Play arcade</button></div></article>`;}
  function physicsCard(compact=false){return `<article class="integrated-tool-card physics-card"><div class="tool-icon">⚡</div><div><h3>AQA Physics Interactive</h3><p>${compact?'Practise Physics equations through relationships, rearranging, SI conversions and calculations.':'Your uploaded staged Physics simulator rebuilt inside the course: manipulate relationships, choose the rearrangement, catch unit traps and complete an AQA-style calculation.'}</p><span class="tool-history-chip" data-tool-history="physics-interactive" ${lastFor('physics-interactive')?'':'hidden'}>${esc(historyText('physics-interactive'))}</span></div><div class="integrated-tool-actions"><button class="button primary" type="button" data-integrated-tool="physics">Open Physics tool</button></div></article>`;}

  function injectExamHub(){
    const hub=document.getElementById('examHubView');if(!hub||hub.querySelector('.arcade-tool-section'))return;
    const section=document.createElement('section');section.className='tool-launch-section arcade-tool-section';
    section.innerHTML=`<div class="section-head"><div><span class="eyebrow">Exam technique game</span><h2>Train the language of science exams</h2></div></div>${arcadeCard(false)}`;
    const hero=hub.querySelector('.project-hero');hero?.insertAdjacentElement('afterend',section);
    bindLaunchers(section);
  }
  function injectPracticalHub(){
    const hub=document.getElementById('practicalHubView');if(!hub||hub.querySelector('.physics-tool-section'))return;
    const section=document.createElement('section');section.className='tool-launch-section physics-tool-section';
    section.innerHTML=`<div class="section-head"><div><span class="eyebrow">Physics calculation simulator</span><h2>Interactive equation training</h2></div></div>${physicsCard(false)}`;
    const hero=hub.querySelector('.project-hero');hero?.insertAdjacentElement('afterend',section);
    bindLaunchers(section);
  }
  function injectTopicTools(){
    const topic=typeof topics!=='undefined'?topics.find(t=>t.id===state.activeTopicId):null;
    const root=document.getElementById('topicContent');if(!topic||!root)return;
    if((state.activeTab==='exam'||state.activeTab==='quiz')&&!root.querySelector('.arcade-tool-inline')){
      const box=document.createElement('section');box.className='arcade-tool-inline';box.innerHTML=arcadeCard(true);root.prepend(box);bindLaunchers(box);
    }
    if(topic.subject==='physics'&&(state.activeTab==='simulation'||state.activeTab==='equations')&&!root.querySelector('.physics-tool-inline')){
      const box=document.createElement('section');box.className='physics-tool-inline';box.innerHTML=physicsCard(true);root.prepend(box);bindLaunchers(box);
    }
  }
  function refreshHistoryChips(){
    document.querySelectorAll('[data-tool-history]').forEach(el=>{const key=el.dataset.toolHistory;const txt=historyText(key);el.textContent=txt;el.hidden=!txt;});
  }

  window.addEventListener('message',e=>{
    const d=e.data;if(!d||d.type!=='gcse-course-tool-result')return;
    saveHistory(d);
    if(typeof notes!=='undefined'&&Array.isArray(notes)){
      const topic=typeof state!=='undefined'?state.activeTopicId:null;
      const text=d.tool==='word-arcade'?`Science Word Arcade: ${d.mode||'module'} — ${d.accuracy??0}% accuracy, ${d.score??0} points.`:`AQA Physics Interactive: ${d.equation||'calculation'} completed${d.success?' successfully':''}.`;
      notes.push({id:Date.now()+Math.random(),topic,text,title:d.tool==='word-arcade'?'Arcade practice result':'Physics simulator result',source:'tool',created:new Date().toISOString()});
      if(typeof saveNotes==='function')saveNotes();
    }
  });

  if(typeof renderTopic==='function'){
    const base=renderTopic;
    renderTopic=function(){base();requestAnimationFrame(injectTopicTools);};
  }
  const observer=new MutationObserver(()=>{injectExamHub();injectPracticalHub();bindLaunchers();});
  observer.observe(document.body,{childList:true,subtree:true});
  ensureModal();injectExamHub();injectPracticalHub();injectTopicTools();bindLaunchers();
  window.GCSE_INTEGRATED_TOOLS={openTool,history};
})();
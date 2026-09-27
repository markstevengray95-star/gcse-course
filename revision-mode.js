(() => {
  const tierKey = 'gcse-science-practice-tier-v1';
  const attemptKey = 'gcse-science-exam-attempts-v1';
  const sessionKey = 'gcse-science-mixed-revision-history-v1';
  let practiceTier = localStorage.getItem(tierKey) || 'mixed';
  let revisionSession = null;

  const tierLabel = tier => tier === 'foundation' ? 'Foundation practice' : tier === 'higher' ? 'Higher practice' : 'Mixed practice';
  const qTier = q => Number(q?.[1] || 0) <= 2 ? 'foundation' : Number(q?.[1] || 0) >= 4 ? 'higher' : 'both';
  const matchesTier = q => {
    if(practiceTier === 'mixed') return true;
    const level = qTier(q);
    return level === 'both' || level === practiceTier;
  };
  const shuffle = list => {
    const copy = [...list];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  };
  const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9.\- ]/g,' ').replace(/\s+/g,' ').trim();
  const pointHit = (answer, point) => {
    if(typeof keywordHit === 'function') return keywordHit(answer, point);
    const a=normalise(answer), p=normalise(point);
    if(!a || !p) return false;
    if(/^[-+]?\d*\.?\d+$/.test(p)){
      const target=Number(p), nums=(a.match(/[-+]?\d*\.?\d+/g)||[]).map(Number);
      return nums.some(n=>Math.abs(n-target)<=Math.max(.02,Math.abs(target)*.01));
    }
    const words=p.split(' ').filter(w=>w.length>2);
    return words.length ? words.every(w=>a.includes(w)) : a.includes(p);
  };

  function injectTierControl(){
    if(document.getElementById('practiceTierControl')) return;
    const panel=document.querySelector('.control-panel');
    if(!panel) return;
    const group=document.createElement('div');
    group.className='control-group';
    group.id='practiceTierControl';
    group.innerHTML=`<span class="control-label">Practice tier</span><div class="segmented compact-tier"><button type="button" data-practice-tier="foundation">Foundation</button><button type="button" data-practice-tier="mixed">Mixed</button><button type="button" data-practice-tier="higher">Higher</button></div><small class="tier-note">Changes practice demand only; it does not hide specification content.</small>`;
    panel.insertBefore(group,panel.querySelector('.grow'));
    group.querySelectorAll('[data-practice-tier]').forEach(btn=>btn.addEventListener('click',()=>setTier(btn.dataset.practiceTier)));
    syncTierButtons();
  }

  function injectRevisionButton(){
    if(document.getElementById('mixedRevisionButton')) return;
    const actions=document.querySelector('.hero-actions');
    if(!actions) return;
    const btn=document.createElement('button');
    btn.className='button';
    btn.id='mixedRevisionButton';
    btn.type='button';
    btn.textContent='Mixed revision';
    btn.addEventListener('click',openRevisionSetup);
    actions.insertBefore(btn,document.getElementById('notebookButton'));
  }

  function setTier(tier){
    practiceTier=['foundation','higher'].includes(tier)?tier:'mixed';
    localStorage.setItem(tierKey,practiceTier);
    syncTierButtons();
    if(typeof renderHome==='function') renderHome();
    if(typeof els!=='undefined' && !els.topicView.hidden && state.activeTab==='exam') renderTopic();
  }

  function syncTierButtons(){
    document.querySelectorAll('[data-practice-tier]').forEach(btn=>btn.classList.toggle('active',btn.dataset.practiceTier===practiceTier));
  }

  function filteredQuestionPool(subject='all',paper='all'){
    const topicList=availableTopics().filter(t=>(subject==='all'||t.subject===subject)&&(paper==='all'||String(t.paper)===String(paper)));
    return topicList.flatMap(topic=>{
      const guide=window.GCSE_RICH_CONTENT?.guides?.[topic.id];
      return (guide?.exam||[]).filter(matchesTier).map((q,index)=>({topic,q,index}));
    });
  }

  function ensureRevisionModal(){
    if(document.getElementById('mixedRevisionModal')) return;
    const modal=document.createElement('div');
    modal.id='mixedRevisionModal';
    modal.className='mixed-revision-modal';
    modal.hidden=true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML=`<div class="mixed-revision-card panel"><div class="mixed-revision-head"><div><span class="eyebrow">Adaptive practice</span><h2 id="mixedRevisionTitle">Mixed revision</h2></div><button class="icon-button" id="closeMixedRevision" type="button" aria-label="Close mixed revision">×</button></div><div id="mixedRevisionBody"></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('closeMixedRevision').addEventListener('click',closeRevision);
    modal.addEventListener('click',e=>{if(e.target===modal)closeRevision();});
  }

  function openRevisionSetup(){
    ensureRevisionModal();
    revisionSession=null;
    const modal=document.getElementById('mixedRevisionModal');
    const body=document.getElementById('mixedRevisionBody');
    const subjectValue=state.subject || 'all';
    const paperValue=state.paper || 'all';
    body.innerHTML=`<div class="revision-setup"><p class="muted">Build a short mixed session from the course. The practice tier controls question demand; all specification teaching remains available in the course.</p><div class="revision-setup-grid"><label><span>Subject</span><select id="revisionSubject"><option value="all">All Science</option><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label><label><span>Paper</span><select id="revisionPaper"><option value="all">All papers</option><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label><label><span>Practice tier</span><select id="revisionTier"><option value="mixed">Mixed</option><option value="foundation">Foundation</option><option value="higher">Higher</option></select></label><label><span>Questions</span><select id="revisionLength"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="15">15 questions</option></select></label></div><div id="revisionPoolInfo" class="revision-pool-info"></div><button class="button primary full" id="startMixedRevision" type="button">Start revision session</button></div>`;
    document.getElementById('revisionSubject').value=subjectValue;
    document.getElementById('revisionPaper').value=paperValue;
    document.getElementById('revisionTier').value=practiceTier;
    const updatePool=()=>{
      const saved=practiceTier;
      practiceTier=document.getElementById('revisionTier').value;
      const count=filteredQuestionPool(document.getElementById('revisionSubject').value,document.getElementById('revisionPaper').value).length;
      practiceTier=saved;
      document.getElementById('revisionPoolInfo').textContent=`${count} questions available for this selection.`;
    };
    ['revisionSubject','revisionPaper','revisionTier'].forEach(id=>document.getElementById(id).addEventListener('change',updatePool));
    document.getElementById('startMixedRevision').addEventListener('click',startRevisionSession);
    updatePool();
    modal.hidden=false;
  }

  function startRevisionSession(){
    const subject=document.getElementById('revisionSubject').value;
    const paper=document.getElementById('revisionPaper').value;
    const tier=document.getElementById('revisionTier').value;
    const length=Number(document.getElementById('revisionLength').value)||10;
    practiceTier=tier;
    localStorage.setItem(tierKey,practiceTier);
    syncTierButtons();
    const pool=filteredQuestionPool(subject,paper);
    const selected=shuffle(pool).slice(0,Math.min(length,pool.length));
    if(!selected.length){document.getElementById('revisionPoolInfo').textContent='No questions match this combination. Try Mixed tier or a wider subject/paper selection.';return;}
    revisionSession={subject,paper,tier,items:selected.map(item=>({...item,answer:'',score:null,max:item.q[1]})),position:0,started:new Date().toISOString()};
    renderRevisionQuestion();
  }

  function renderRevisionQuestion(){
    const body=document.getElementById('mixedRevisionBody');
    const s=revisionSession;
    if(!s) return openRevisionSetup();
    if(s.position>=s.items.length) return renderRevisionSummary();
    const item=s.items[s.position], topic=item.topic, q=item.q;
    const level=qTier(q)==='both'?'Core / crossover':qTier(q)==='higher'?'Higher demand':'Foundation demand';
    body.innerHTML=`<div class="revision-progress"><div><strong>Question ${s.position+1} of ${s.items.length}</strong><span>${escapeHtml(topic.code)} · ${escapeHtml(topic.title)}</span></div><div class="revision-progress-track"><i style="width:${Math.round(s.position/s.items.length*100)}%"></i></div></div><article class="revision-question"><div class="revision-question-meta"><span class="badge ${topic.subject}">${escapeHtml(subjectFor(topic).name)}</span><span class="badge">Paper ${topic.paper}</span><span class="badge">${level}</span><span class="mark-badge">${q[1]} marks</span></div><h3>${escapeHtml(q[0])}</h3><textarea id="mixedRevisionAnswer" placeholder="Write your answer here…">${escapeHtml(item.answer||'')}</textarea><div id="mixedRevisionFeedback"></div><div class="revision-actions"><button class="button" id="revisionSkip" type="button">Skip</button><button class="button primary" id="revisionMark" type="button">Mark answer</button><button class="button" id="revisionNext" type="button" ${item.score===null?'disabled':''}>${s.position===s.items.length-1?'Finish session':'Next question'}</button></div></article>`;
    if(item.score!==null) showRevisionFeedback(item);
    document.getElementById('revisionMark').addEventListener('click',markRevisionAnswer);
    document.getElementById('revisionSkip').addEventListener('click',()=>{item.answer='';item.score=0;storeMixedAttempt(item);s.position++;renderRevisionQuestion();});
    document.getElementById('revisionNext').addEventListener('click',()=>{s.position++;renderRevisionQuestion();});
  }

  function markRevisionAnswer(){
    const item=revisionSession.items[revisionSession.position];
    item.answer=document.getElementById('mixedRevisionAnswer').value.trim();
    const points=item.q[2].map(p=>({p,hit:pointHit(item.answer,p)}));
    item.score=Math.min(item.q[1],points.filter(p=>p.hit).length);
    item.points=points;
    storeMixedAttempt(item);
    showRevisionFeedback(item);
    document.getElementById('revisionNext').disabled=false;
  }

  function showRevisionFeedback(item){
    const feedback=document.getElementById('mixedRevisionFeedback');
    if(!feedback) return;
    const points=item.points || item.q[2].map(p=>({p,hit:pointHit(item.answer,p)}));
    feedback.innerHTML=`<div class="mixed-feedback"><strong>Practice mark: ${item.score} / ${item.q[1]}</strong><div class="mark-points">${points.map(x=>`<span class="mark-point ${x.hit?'hit':''}">${x.hit?'✓':'○'} ${escapeHtml(String(x.p))}</span>`).join('')}</div><p>${item.score===item.q[1]?'Main marking ideas detected. Try to keep the answer concise and scientifically precise.':'Use the missing points to improve the answer before trying a similar question later.'}</p></div>`;
  }

  function storeMixedAttempt(item){
    if(item.stored) return;
    item.stored=true;
    const entry={id:Date.now()+Math.random(),topic:item.topic.id,question:`mixed-${item.index}`,score:item.score||0,max:item.q[1],created:new Date().toISOString(),source:'mixed-revision',tier:practiceTier};
    const live=window.GCSE_COURSE_ENHANCEMENTS?.getAttempts?.();
    let attempts=Array.isArray(live)?live:[];
    attempts.push(entry);
    if(attempts.length>150) attempts.splice(0,attempts.length-150);
    localStorage.setItem(attemptKey,JSON.stringify(attempts));
  }

  function renderRevisionSummary(){
    const body=document.getElementById('mixedRevisionBody');
    const items=revisionSession.items;
    const score=items.reduce((n,x)=>n+(x.score||0),0), max=items.reduce((n,x)=>n+x.max,0), pct=max?Math.round(score/max*100):0;
    const grouped={};
    items.forEach(item=>{
      const id=item.topic.id;
      grouped[id] ||= {topic:item.topic,score:0,max:0};
      grouped[id].score += item.score||0; grouped[id].max += item.max;
    });
    const breakdown=Object.values(grouped).map(x=>({...x,percent:x.max?Math.round(x.score/x.max*100):0})).sort((a,b)=>a.percent-b.percent);
    const history=JSON.parse(localStorage.getItem(sessionKey)||'[]');
    history.push({created:new Date().toISOString(),score,max,percent:pct,tier:revisionSession.tier,subject:revisionSession.subject,paper:revisionSession.paper});
    localStorage.setItem(sessionKey,JSON.stringify(history.slice(-30)));
    body.innerHTML=`<div class="revision-summary"><span class="eyebrow">Session complete</span><h2>${score} / ${max} marks · ${pct}%</h2><p class="muted">Use the breakdown to choose what to revisit. This is a practice score from the course marker, not an official AQA grade.</p><div class="revision-breakdown">${breakdown.map(x=>`<button type="button" data-summary-topic="${x.topic.id}"><span>${escapeHtml(x.topic.code)} · ${escapeHtml(x.topic.title)}</span><strong>${x.percent}%</strong></button>`).join('')}</div><div class="revision-summary-actions"><button class="button primary" id="revisionAgain" type="button">New mixed session</button><button class="button" id="revisionCloseSummary" type="button">Return to course</button></div></div>`;
    body.querySelectorAll('[data-summary-topic]').forEach(btn=>btn.addEventListener('click',()=>{closeRevision();openTopic(btn.dataset.summaryTopic);}));
    document.getElementById('revisionAgain').addEventListener('click',openRevisionSetup);
    document.getElementById('revisionCloseSummary').addEventListener('click',closeRevision);
  }

  function closeRevision(){
    const modal=document.getElementById('mixedRevisionModal');
    if(modal) modal.hidden=true;
  }

  function topicAttemptStat(topicId){
    const list=window.GCSE_COURSE_ENHANCEMENTS?.getAttempts?.()?.filter(a=>a.topic===topicId) || [];
    const score=list.reduce((n,a)=>n+(a.score||0),0), max=list.reduce((n,a)=>n+(a.max||0),0);
    return max ? Math.round(score/max*100) : null;
  }

  function decorateMastery(){
    document.querySelectorAll('.topic-card[data-topic]').forEach(card=>{
      card.querySelector('.mastery-pill')?.remove();
      const topic=topics.find(t=>t.id===card.dataset.topic); if(!topic) return;
      const lesson=topicLessonStats(topic), practice=topicAttemptStat(topic.id);
      const score=practice===null?lesson.percent:Math.round((lesson.percent+practice)/2);
      const label=practice===null?(lesson.percent?'Learning':'Not started'):score>=85?'Strong':score>=65?'Secure':score>=40?'Developing':'Revisit';
      const pill=document.createElement('span');
      pill.className=`mastery-pill mastery-${label.toLowerCase().replace(/ /g,'-')}`;
      pill.textContent=`Mastery: ${label}`;
      pill.title=practice===null?`Lesson completion ${lesson.percent}%; complete exam practice to add performance evidence.`:`Combined indicator from lesson completion (${lesson.percent}%) and practice accuracy (${practice}%).`;
      card.querySelector('.card-footer')?.before(pill);
    });
  }

  if(typeof renderExamPractice==='function'){
    const baseExam=renderExamPractice;
    renderExamPractice=function(topic,guide){
      const list=(guide.exam||[]).filter(matchesTier);
      const filtered={...guide,exam:list.length?list:guide.exam};
      baseExam(topic,filtered);
      const toolbar=els.topicContent.querySelector('.exam-toolbar');
      if(toolbar){
        const note=document.createElement('div');
        note.className='practice-tier-banner';
        note.innerHTML=`<strong>${tierLabel(practiceTier)}</strong><span>${practiceTier==='mixed'?'Showing the full practice bank.':'Showing questions selected by demand. Specification teaching is not hidden by this filter.'}</span>`;
        toolbar.appendChild(note);
      }
    };
  }

  if(typeof renderTopicGrid==='function'){
    const baseGrid=renderTopicGrid;
    renderTopicGrid=function(){baseGrid();decorateMastery();};
  }

  injectTierControl();
  injectRevisionButton();
  ensureRevisionModal();
  if(typeof renderHome==='function') renderHome();

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !document.getElementById('mixedRevisionModal')?.hidden) closeRevision();
  });

  window.GCSE_REVISION_MODE={getTier:()=>practiceTier,setTier,openRevision:openRevisionSetup};
})();
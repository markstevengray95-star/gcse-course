const DATA = window.GCSE_COURSE_DATA;
const RICH = window.GCSE_RICH_CONTENT;
const topics = DATA.topics;
const subjects = DATA.subjects;

const keys = {
  settings: 'gcse-science-settings-v2',
  progress: 'gcse-science-progress-v1',
  lessons: 'gcse-science-lessons-v1',
  notes: 'gcse-science-notes-v1',
  location: 'gcse-science-location-v2'
};

const safeParse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
const storedSettings = safeParse(localStorage.getItem(keys.settings), {mode:'combined'});
const storedLocation = safeParse(localStorage.getItem(keys.location), {topic:'b1'});
let state = {
  mode: storedSettings.mode === 'triple' ? 'triple' : 'combined',
  subject: 'all',
  paper: 'all',
  search: '',
  activeTopicId: storedLocation.topic || 'b1',
  activeTab: 'overview',
  activeLessonIndex: 0
};
let progress = safeParse(localStorage.getItem(keys.progress), {});
let lessonProgress = safeParse(localStorage.getItem(keys.lessons), {});
let notes = safeParse(localStorage.getItem(keys.notes), []);

const els = {
  homeView: document.getElementById('homeView'), topicView: document.getElementById('topicView'), topicGrid: document.getElementById('topicGrid'),
  resultCount: document.getElementById('resultCount'), mapTitle: document.getElementById('mapTitle'), courseSummary: document.getElementById('courseSummary'),
  progressText: document.getElementById('progressText'), progressFill: document.getElementById('progressFill'), search: document.getElementById('topicSearch'),
  paper: document.getElementById('paperFilter'), topicTitle: document.getElementById('topicTitle'), topicSummary: document.getElementById('topicSummary'),
  topicMeta: document.getElementById('topicMeta'), topicStat: document.getElementById('topicStat'), topicContent: document.getElementById('topicContent'),
  topicSelect: document.getElementById('topicSelect'), previousTopic: document.getElementById('previousTopic'), nextTopic: document.getElementById('nextTopic'),
  completeTopic: document.getElementById('completeTopicButton'), notebook: document.getElementById('notebook'), backdrop: document.getElementById('backdrop'),
  notesList: document.getElementById('notesList'), notebookInput: document.getElementById('notebookInput'), notebookContext: document.getElementById('notebookContext'),
  retrievalModal: document.getElementById('retrievalModal'), retrievalQuestion: document.getElementById('retrievalQuestion'), retrievalAnswer: document.getElementById('retrievalAnswer')
};

function saveSettings(){localStorage.setItem(keys.settings,JSON.stringify({mode:state.mode}));}
function saveProgress(){localStorage.setItem(keys.progress,JSON.stringify(progress));}
function saveLessons(){localStorage.setItem(keys.lessons,JSON.stringify(lessonProgress));}
function saveNotes(){localStorage.setItem(keys.notes,JSON.stringify(notes));}
function saveLocation(){localStorage.setItem(keys.location,JSON.stringify({topic:state.activeTopicId}));}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function subjectFor(topic){return subjects.find(s=>s.id===topic.subject);}
function guideFor(topic){return RICH?.guides?.[topic.id] || null;}
function availableTopics(){return topics.filter(t=>state.mode==='triple'||t.scope!=='triple');}
function visibleLessons(topic){return topic.lessons.filter(([,scope])=>state.mode==='triple'||scope!=='triple');}
function lessonKey(topicId,index){return `${state.mode}:${topicId}:${index}`;}
function subjectTopics(subject){return availableTopics().filter(t=>t.subject===subject);}

function topicLessonStats(topic){
  const lessons=visibleLessons(topic); const done=lessons.reduce((n,_,i)=>n+(lessonProgress[lessonKey(topic.id,i)]?1:0),0);
  return {done,total:lessons.length,percent:lessons.length?Math.round(done/lessons.length*100):0};
}
function courseStats(list=availableTopics()){
  const done=list.filter(t=>progress[t.id]).length; return {done,total:list.length,percent:list.length?Math.round(done/list.length*100):0};
}
function filteredTopics(){
  const q=state.search.trim().toLowerCase();
  return availableTopics().filter(topic=>{
    if(state.subject!=='all'&&topic.subject!==state.subject)return false;
    if(state.paper!=='all'&&String(topic.paper)!==state.paper)return false;
    if(!q)return true;
    const lessonText=visibleLessons(topic).map(([name])=>name).join(' ');
    const guide=guideFor(topic); const richText=guide?guide.textbook.flat().join(' '):'';
    return `${topic.code} ${topic.title} ${topic.summary} ${lessonText} ${richText}`.toLowerCase().includes(q);
  });
}

function renderGlobalProgress(){
  const stat=courseStats(); els.progressText.textContent=`${stat.done} / ${stat.total} topics complete`; els.progressFill.style.width=`${stat.percent}%`;
}
function renderCourseSummary(){
  const modeTitle=state.mode==='combined'?'Combined Science':'Separate / Triple Science';
  const cards=subjects.map(subject=>{const list=subjectTopics(subject.id),stat=courseStats(list);return `<article class="summary-card ${subject.id}"><span class="summary-icon">${subject.icon}</span><div><strong>${subject.name}</strong><span>${stat.done} / ${stat.total} topics complete</span></div><b>${stat.percent}%</b></article>`;}).join('');
  els.courseSummary.innerHTML=`<div class="summary-heading"><strong>${modeTitle}</strong><span>${availableTopics().length} specification topics</span></div><div class="summary-grid">${cards}</div>`;
}
function renderTopicGrid(){
  const list=filteredTopics(); els.resultCount.textContent=`${list.length} topic${list.length===1?'':'s'}`;
  const subjectName=state.subject==='all'?'All GCSE Science topics':`${subjectFor({subject:state.subject}).name} topics`;
  els.mapTitle.textContent=state.mode==='combined'?subjectName:`${subjectName} · Separate / Triple`;
  if(!list.length){els.topicGrid.innerHTML='<div class="empty-state panel"><strong>No topics found.</strong><p>Try a different subject, paper or search term.</p></div>';return;}
  els.topicGrid.innerHTML=list.map(topic=>{
    const subject=subjectFor(topic),stats=topicLessonStats(topic),extraCount=topic.lessons.filter(([,scope])=>scope==='triple').length;
    return `<article class="topic-card ${topic.subject} ${progress[topic.id]?'complete':''}" data-topic="${topic.id}" tabindex="0" role="button">
      <div class="card-top"><span class="topic-code">${topic.code}</span><div class="badges"><span class="badge">Paper ${topic.paper}</span>${topic.scope==='triple'?'<span class="badge triple">Physics only</span>':(state.mode==='triple'&&extraCount?`<span class="badge triple">+${extraCount} Separate</span>`:'')}</div></div>
      <span class="subject-label">${subject.icon} ${subject.name}</span><h3>${topic.title}</h3><p>${topic.summary}</p>
      <div class="mini-progress"><span><i style="width:${stats.percent}%"></i></span><b>${stats.done}/${stats.total} lessons</b></div>
      <div class="card-footer"><span>${topic.practicals.length} practical${topic.practicals.length===1?'':'s'} · textbook + simulation</span><strong>${progress[topic.id]?'Completed ✓':'Open topic →'}</strong></div>
    </article>`;
  }).join('');
  els.topicGrid.querySelectorAll('.topic-card').forEach(card=>{const open=()=>openTopic(card.dataset.topic);card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}
function renderHome(){
  document.querySelectorAll('#courseMode button').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===state.mode));
  document.querySelectorAll('#subjectTabs button').forEach(btn=>btn.classList.toggle('active',btn.dataset.subject===state.subject));
  els.paper.value=state.paper; els.search.value=state.search; renderGlobalProgress(); renderCourseSummary(); renderTopicGrid();
  const last=topics.find(t=>t.id===state.activeTopicId&&(state.mode==='triple'||t.scope!=='triple'))||availableTopics()[0];
  document.getElementById('continueButton').textContent=last?`Continue ${last.code}: ${last.title}`:'Continue learning';
}

function openTopic(id){
  const topic=topics.find(t=>t.id===id); if(!topic||(state.mode==='combined'&&topic.scope==='triple'))return;
  state.activeTopicId=topic.id; state.activeTab='overview'; state.activeLessonIndex=0; saveLocation();
  els.homeView.hidden=true; els.topicView.hidden=false; renderTopic(); window.scrollTo({top:0,behavior:'smooth'});
  const url=new URL(location.href);url.searchParams.set('topic',topic.id);history.replaceState({},'',url);
}
function closeTopic(){
  els.homeView.hidden=false;els.topicView.hidden=true;const url=new URL(location.href);url.searchParams.delete('topic');history.replaceState({},'',url);renderHome();window.scrollTo({top:0,behavior:'smooth'});
}
function renderTopic(){
  let topic=topics.find(t=>t.id===state.activeTopicId); if(!topic||(state.mode==='combined'&&topic.scope==='triple')){topic=availableTopics()[0];state.activeTopicId=topic.id;}
  const subject=subjectFor(topic),stats=topicLessonStats(topic),extraLessons=topic.lessons.filter(([,scope])=>scope==='triple').length;
  els.topicTitle.textContent=`${topic.code}: ${topic.title}`; els.topicSummary.textContent=topic.summary;
  els.topicMeta.innerHTML=`<span class="badge ${topic.subject}">${subject.icon} ${subject.name}</span><span class="badge">Paper ${topic.paper}</span>${topic.scope==='triple'?'<span class="badge triple">Separate Physics only</span>':(state.mode==='triple'&&extraLessons?'<span class="badge triple">Includes Separate Science extension</span>':'')}`;
  els.topicStat.innerHTML=`<strong>${stats.percent}%</strong><span>${stats.done} of ${stats.total} lessons checked off</span>`;
  els.completeTopic.textContent=progress[topic.id]?'Completed ✓':'Mark topic complete'; els.completeTopic.classList.toggle('completed',!!progress[topic.id]);
  const navTopics=availableTopics(),index=navTopics.findIndex(t=>t.id===topic.id);
  els.topicSelect.innerHTML=navTopics.map(t=>`<option value="${t.id}">${t.code} · ${t.title}</option>`).join('');els.topicSelect.value=topic.id;
  els.previousTopic.disabled=index<=0;els.nextTopic.disabled=index>=navTopics.length-1;
  document.querySelectorAll('#contentTabs button').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===state.activeTab));
  renderTopicContent(topic);renderGlobalProgress();
}

function renderTopicContent(topic){
  const subject=subjectFor(topic),lessons=visibleLessons(topic),guide=guideFor(topic);
  if(state.activeTab==='overview'){
    const combinedCount=topic.lessons.filter(([,scope])=>scope==='combined').length,separateCount=topic.lessons.filter(([,scope])=>scope==='triple').length;
    els.topicContent.innerHTML=`<div class="overview-grid">
      <article class="panel content-panel"><span class="eyebrow">What you will learn</span><h2>${topic.title}</h2><p>${topic.summary}</p><ul class="key-list">${lessons.slice(0,8).map(([name])=>`<li>${escapeHtml(name)}</li>`).join('')}${lessons.length>8?`<li>+ ${lessons.length-8} more lesson sections</li>`:''}</ul></article>
      <article class="panel content-panel"><span class="eyebrow">Specification coverage</span><h2>${subject.name} Paper ${topic.paper}</h2><div class="stat-row"><div><strong>${combinedCount}</strong><span>Combined lessons</span></div><div><strong>${state.mode==='triple'?separateCount:0}</strong><span>Separate-only lessons</span></div><div><strong>${topic.practicals.length}</strong><span>Practical links</span></div></div><p class="muted">Separate Science mode includes all Combined content plus the additional Biology-, Chemistry- or Physics-only material.</p></article>
      <article class="panel content-panel full-span"><span class="eyebrow">Full learning pathway</span><h2>Study the topic like a course, not a checklist</h2><div class="study-flow"><span>1. Open each lesson</span><span>2. Read textbook + worked example</span><span>3. Use activities and simulation</span><span>4. Complete exam practice</span></div></article>
    </div>`;
    return;
  }
  if(state.activeTab==='lessons'){renderLessons(topic,lessons);return;}
  if(state.activeTab==='textbook'){renderTextbook(topic,guide);return;}
  if(state.activeTab==='practicals'){renderPracticals(topic);return;}
  if(state.activeTab==='activities'){renderActivities(topic,guide);return;}
  if(state.activeTab==='simulation'){renderSimulation(topic,guide);return;}
  if(state.activeTab==='exam'){renderExamPractice(topic,guide);return;}
  if(state.activeTab==='quiz'){renderRetrievalQuiz(topic);return;}
}

function renderLessons(topic,lessons){
  const rows=lessons.map(([name,scope],index)=>{
    const checked=!!lessonProgress[lessonKey(topic.id,index)],open=index===state.activeLessonIndex,lesson=RICH?.getLesson?.(topic,name,index);
    return `<article class="lesson-card ${checked?'done':''}">
      <div class="lesson-card-head"><input type="checkbox" data-lesson="${index}" ${checked?'checked':''} aria-label="Mark ${escapeHtml(name)} complete"><span class="lesson-number">${String(index+1).padStart(2,'0')}</span><span class="lesson-card-title">${escapeHtml(name)}</span>${scope==='triple'?'<span class="badge triple">Separate only</span>':''}<button class="lesson-open" type="button" data-open-lesson="${index}">${open?'Close':'Open lesson'}</button></div>
      ${open&&lesson?lessonExpandedHtml(lesson):''}
    </article>`;
  }).join('');
  els.topicContent.innerHTML=`<div class="panel content-panel"><div class="content-heading"><div><span class="eyebrow">Structured lessons</span><h2>${lessons.length} lesson sections</h2><p class="muted">Open a lesson for objectives, teaching notes, vocabulary, a worked example and a retrieval check.</p></div></div><div class="lesson-list rich">${rows}</div></div>`;
  els.topicContent.querySelectorAll('[data-lesson]').forEach(input=>input.addEventListener('change',()=>{lessonProgress[lessonKey(topic.id,Number(input.dataset.lesson))]=input.checked;saveLessons();renderTopic();}));
  els.topicContent.querySelectorAll('[data-open-lesson]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.openLesson);state.activeLessonIndex=state.activeLessonIndex===i?-1:i;renderTopic();}));
}
function lessonExpandedHtml(lesson){
  return `<div class="lesson-expanded"><div class="lesson-expanded-grid">
    <div class="learn-card"><span class="eyebrow">Learning objectives</span><h3>${escapeHtml(lesson.title)}</h3><ul class="objective-list">${lesson.objectives.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    <div class="learn-card exam-tip"><span class="eyebrow">Exam technique</span><h3>How to answer</h3><p>${escapeHtml(lesson.examTip)}</p></div>
    <div class="learn-card"><span class="eyebrow">Learn it</span><h3>${escapeHtml(lesson.section[0])}</h3><p>${escapeHtml(lesson.section[1])}</p></div>
    <div class="learn-card"><span class="eyebrow">Key vocabulary</span><div class="key-term-grid">${lesson.terms.slice(0,4).map(([t,d])=>`<div class="key-term"><strong>${escapeHtml(t)}</strong><span>${escapeHtml(d)}</span></div>`).join('')}</div></div>
    <div class="learn-card worked-example"><span class="eyebrow">Worked example</span><h3>${escapeHtml(lesson.worked.title)}</h3><p>${escapeHtml(lesson.worked.question)}</p><ol>${lesson.worked.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></div>
    <div class="learn-card"><span class="eyebrow">Check your understanding</span><h3>${escapeHtml(lesson.check[0])}</h3><details class="lesson-check"><summary>Reveal model answer</summary><p>${escapeHtml(lesson.check[1])}</p></details></div>
  </div></div>`;
}

function renderTextbook(topic,guide){
  if(!guide){els.topicContent.innerHTML='<div class="panel content-panel">Rich textbook content is being prepared for this topic.</div>';return;}
  els.topicContent.innerHTML=`<div class="textbook-shell">
    <div class="textbook-main">${guide.textbook.map((section,i)=>`<article class="panel textbook-chapter"><span class="eyebrow">${topic.code} · Section ${i+1}</span><h2>${escapeHtml(section[0])}</h2><p>${escapeHtml(section[1])}</p></article>`).join('')}
      <article class="panel content-panel worked-example"><span class="eyebrow">Worked example</span><h2>${escapeHtml(guide.worked.title)}</h2><p>${escapeHtml(guide.worked.question)}</p><ol>${guide.worked.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></article>
    </div>
    <aside class="textbook-sidebar"><article class="panel content-panel diagram-card sticky-study-card"><span class="eyebrow">Visual model</span><h2>${topic.title}</h2><div class="science-diagram">${diagramSvg(guide.diagram,topic)}</div></article>
      <article class="panel content-panel"><span class="eyebrow">Key terms</span><div class="key-term-grid">${guide.terms.map(([t,d])=>`<div class="key-term"><strong>${escapeHtml(t)}</strong><span>${escapeHtml(d)}</span></div>`).join('')}</div></article></aside>
  </div>`;
}

function diagramSvg(type,topic){
  const flow={
    circulation:['Heart','Artery','Capillary','Vein'],pathogen:['Pathogen','Defence','Immune response','Memory cells'],photosynthesis:['Light + CO₂ + H₂O','Chloroplast','Glucose','O₂'],control:['Stimulus','Receptor','Coordinator','Effector'],dna:['DNA','Gene','Protein','Characteristic'],ecosystem:['Abiotic factors','Producers','Consumers','Decomposers'],
    bonding:['Atoms / ions','Bonding','Structure','Properties'],moles:['Mass','Moles','Ratio','Product'],electrolysis:['Ions','Electrolyte','Electrodes','Products'],collisions:['Particles','Collisions','Successful collisions','Reaction'],hydrocarbon:['Crude oil','Fractions','Cracking','Useful molecules'],chromatography:['Mixture','Stationary phase','Separation','Rf value'],atmosphere:['Sunlight','Earth surface','Infrared','Greenhouse gases'],lifecycle:['Raw materials','Manufacture','Use','Disposal'],energy:['Energy store','Transfer pathway','Useful output','Dissipation'],particles:['Particle arrangement','Heating','Internal energy','State change'],decay:['Unstable nucleus','Radiation','Half-life','Lower activity'],force:['Resultant force','Acceleration','Motion','Graph evidence'],magnet:['Current','Magnetic field','Force / induction','Device'],orbit:['Gravity','Orbit','Stellar evidence','Universe']
  };
  if(type==='cell')return `<svg viewBox="0 0 560 270" role="img" aria-label="Simplified cell diagram"><ellipse cx="280" cy="135" rx="220" ry="100" class="soft"/><circle cx="245" cy="130" r="45" class="bio"/><text x="220" y="135">Nucleus</text><ellipse cx="370" cy="95" rx="38" ry="18" class="warm"/><text x="330" y="75">Mitochondrion</text><text x="95" y="235">Cell membrane surrounds cytoplasm</text></svg>`;
  if(type==='atom')return `<svg viewBox="0 0 560 270" role="img" aria-label="Simplified atom diagram"><circle cx="280" cy="135" r="35" class="chem"/><ellipse cx="280" cy="135" rx="150" ry="65" class="line"/><ellipse cx="280" cy="135" rx="85" ry="120" class="line"/><circle cx="430" cy="135" r="9" class="accent"/><circle cx="280" cy="15" r="9" class="accent"/><text x="255" y="140">nucleus</text><text x="440" y="132">electron</text></svg>`;
  if(type==='circuit')return `<svg viewBox="0 0 560 270" role="img" aria-label="Simple circuit"><path d="M100 70 H450 V200 H100 Z" class="line"/><line x1="100" y1="115" x2="100" y2="155" stroke="#071421" stroke-width="12"/><line x1="92" y1="120" x2="108" y2="120" stroke="#ffc96b" stroke-width="4"/><line x1="88" y1="150" x2="112" y2="150" stroke="#ffc96b" stroke-width="8"/><rect x="250" y="60" width="85" height="20" class="physics"/><text x="258" y="55">resistor</text><text x="62" y="140">cell</text></svg>`;
  if(type==='wave')return `<svg viewBox="0 0 560 270" role="img" aria-label="Wave diagram"><path d="M35 135 C75 45 115 45 155 135 S235 225 275 135 S355 45 395 135 S475 225 525 135" class="line"/><line x1="155" y1="235" x2="395" y2="235" stroke="#ffc96b" stroke-width="3"/><text x="245" y="258">wavelength λ</text><line x1="155" y1="135" x2="155" y2="55" stroke="#52d39a" stroke-width="3"/><text x="165" y="92">amplitude</text></svg>`;
  if(type==='profile')return `<svg viewBox="0 0 560 270" role="img" aria-label="Reaction profile"><path d="M40 205 H170 C235 205 215 65 310 65 C385 65 360 160 520 160" class="line"/><text x="55" y="195">reactants</text><text x="430" y="150">products</text><line x1="310" y1="65" x2="310" y2="205" stroke="#ffc96b" stroke-width="2"/><text x="320" y="115">activation energy</text></svg>`;
  if(type==='bonding')return `<svg viewBox="0 0 560 270" role="img" aria-label="Bonding diagram"><circle cx="195" cy="135" r="60" class="soft"/><circle cx="365" cy="135" r="60" class="soft"/><circle cx="265" cy="125" r="9" class="accent"/><circle cx="295" cy="145" r="9" class="accent"/><text x="182" y="140">atom</text><text x="352" y="140">atom</text><text x="225" y="215">shared / transferred electrons determine bonding</text></svg>`;
  const labels=flow[type]||[topic.code,'Key idea','Evidence','Application'];
  return `<svg viewBox="0 0 640 260" role="img" aria-label="${escapeHtml(topic.title)} concept diagram">${labels.map((label,i)=>{const x=35+i*150;return `<rect x="${x}" y="95" width="125" height="70" rx="18" class="soft"/><text x="${x+12}" y="135">${escapeHtml(label.length>18?label.slice(0,18)+'…':label)}</text>${i<labels.length-1?`<path d="M${x+125} 130 H${x+148}" class="line"/>`:''}`;}).join('')}</svg>`;
}

function renderPracticals(topic){
  const list=topic.practicals.filter(p=>state.mode==='triple'||!/only\)/i.test(p));
  els.topicContent.innerHTML=`<div class="panel content-panel"><span class="eyebrow">Required practical knowledge</span><h2>${list.length?`${list.length} practical focus${list.length===1?'':'es'}`:'No named practical in this topic'}</h2>${list.length?`<div class="practical-list">${list.map((p,i)=>`<article><span>${i+1}</span><div><strong>${escapeHtml(p)}</strong><div class="practical-method"><div><strong>Method thinking</strong><span>Identify independent, dependent and control variables. Use a repeatable method and suitable measuring equipment.</span></div><div><strong>Data</strong><span>Record raw data with units, repeat measurements and calculate a mean when appropriate.</span></div><div><strong>Analysis</strong><span>Choose a suitable graph, identify trends and use gradients or calculations where required.</span></div><div><strong>Evaluation</strong><span>Discuss uncertainty, anomalies, accuracy, repeatability and one realistic improvement.</span></div></div></div></article>`).join('')}</div>`:'<p>This topic can still assess working scientifically, mathematical skills and interpretation of experimental evidence.</p>'}</div>`;
}
function renderActivities(topic,guide){
  const practical=topic.practicals.find(p=>state.mode==='triple'||!/only\)/i.test(p));
  els.topicContent.innerHTML=`<div class="activity-grid">
    <article class="panel activity-card"><span class="eyebrow">Core activity</span><h3>${escapeHtml(guide.activity.title)}</h3><p>${escapeHtml(guide.activity.task)}</p><div class="activity-steps"><div class="activity-step"><span>1</span><p>Complete the task without notes first.</p></div><div class="activity-step"><span>2</span><p>Check your scientific vocabulary against the textbook tab.</p></div><div class="activity-step"><span>3</span><p>Add one application to an unfamiliar context.</p></div></div></article>
    <article class="panel activity-card challenge-card"><span class="eyebrow">Exam challenge</span><h3>Explain, don't just state</h3><p>Choose one key idea from ${topic.title}. Write a four-sentence explanation using: <strong>idea → evidence/change → scientific reason → consequence.</strong></p></article>
    <article class="panel activity-card"><span class="eyebrow">Retrieval</span><h3>Blurting task</h3><p>Close your notes and write everything you remember about ${topic.code} for three minutes. Reopen the textbook, add missing facts in a different section, then write three questions to test them tomorrow.</p></article>
    <article class="panel activity-card"><span class="eyebrow">Practical connection</span><h3>${practical?'Apply the method':'Working scientifically'}</h3><p>${practical?escapeHtml(practical):'Design a fair investigation linked to this topic. Identify variables, equipment, repeats, graph choice and one safety or validity issue.'}</p></article>
  </div>`;
}

const simDefs={
  diffusion:{title:'Diffusion rate explorer',formula:'relative rate ∝ concentration difference ÷ distance',inputs:[['gradient','Concentration difference',1,100,1,60],['distance','Diffusion distance',1,20,1,5]],calc:v=>({value:(v.gradient/v.distance).toFixed(1),unit:'relative units',caption:'A larger concentration difference and shorter distance produce faster diffusion.'})},
  cardiac:{title:'Cardiac output calculator',formula:'cardiac output = heart rate × stroke volume',inputs:[['rate','Heart rate / min',40,180,1,75],['stroke','Stroke volume / mL',30,140,1,70]],calc:v=>({value:(v.rate*v.stroke/1000).toFixed(2),unit:'L/min',caption:'Cardiac output is the volume of blood pumped by the heart each minute.'})},
  infection:{title:'Population susceptibility model',formula:'susceptible contacts = contacts × (1 − immune fraction)',inputs:[['immune','Immune population / %',0,100,1,60],['contacts','Close contacts',1,30,1,10]],calc:v=>({value:(v.contacts*(1-v.immune/100)).toFixed(1),unit:'susceptible contacts',caption:'Concept model only: increasing immunity reduces the number of susceptible contacts.'})},
  photosynthesis:{title:'Limiting-factor explorer',formula:'rate is limited by the factor in shortest supply',inputs:[['light','Light level / %',0,100,1,60],['co2','CO₂ level / %',0,100,1,45]],calc:v=>({value:Math.min(v.light,v.co2).toFixed(0),unit:'relative rate',caption:'Once one factor is no longer limiting, another factor can set the maximum rate.'})},
  glucose:{title:'Blood-glucose feedback model',formula:'negative feedback pushes concentration toward a normal level',inputs:[['glucose','Blood glucose / relative units',3,12,.1,8],['response','Hormone response / %',0,100,1,70]],calc:v=>({value:(v.glucose-(v.glucose-5)*v.response/100).toFixed(1),unit:'modelled level',caption:'Conceptual negative-feedback model: stronger corrective response moves the value toward the normal level.'})},
  genetics:{title:'Allele probability explorer',formula:'P(aa) = P(a from parent 1) × P(a from parent 2)',inputs:[['p1','P(a) parent 1 / %',0,100,1,50],['p2','P(a) parent 2 / %',0,100,1,50]],calc:v=>({value:(v.p1*v.p2/100).toFixed(1),unit:'% aa offspring',caption:'For two heterozygous Aa parents, each contributes a with probability 50%, giving 25% aa.'})},
  quadrat:{title:'Quadrat population estimator',formula:'estimate = mean per quadrat × habitat area ÷ quadrat area',inputs:[['mean','Mean organisms / quadrat',1,30,1,6],['habitat','Habitat area / m²',10,500,10,100],['area','Quadrat area / m²',.25,2,.25,.5]],calc:v=>({value:Math.round(v.mean*v.habitat/v.area),unit:'organisms',caption:'Random sampling and enough repeats make the estimate more representative.'})},
  atom:{title:'Atom builder',formula:'mass number = protons + neutrons; charge = protons − electrons',inputs:[['protons','Protons',1,20,1,11],['neutrons','Neutrons',0,25,1,12],['electrons','Electrons',0,20,1,11]],calc:v=>({value:`A=${v.protons+v.neutrons}, charge=${v.protons-v.electrons>0?'+':''}${v.protons-v.electrons}`,unit:'',caption:'Changing neutron number changes isotope; changing electron number changes charge.'})},
  bonding:{title:'Shared-pair explorer',formula:'covalent bonds contain shared pairs of electrons',inputs:[['pairs','Shared electron pairs',1,3,1,1]],calc:v=>({value:v.pairs===1?'single':v.pairs===2?'double':'triple',unit:'covalent bond',caption:'This visual focuses on shared pairs; ionic bonding instead involves electron transfer and attraction between ions.'})},
  moles:{title:'Mole calculator',formula:'moles = mass ÷ Mr',inputs:[['mass','Mass / g',1,200,1,18],['mr','Mr',1,200,1,18]],calc:v=>({value:(v.mass/v.mr).toFixed(3),unit:'mol',caption:'Use the balanced equation after this step to apply mole ratios.'})},
  electrolysis:{title:'Ion movement explorer',formula:'positive ions → cathode; negative ions → anode',inputs:[['positive','Positive ions',1,20,1,8],['negative','Negative ions',1,20,1,8]],calc:v=>({value:`${v.positive} → cathode | ${v.negative} → anode`,unit:'ions shown',caption:'At the cathode positive ions gain electrons; at the anode negative ions lose electrons.'})},
  bondenergy:{title:'Bond-energy calculator',formula:'energy change = energy to break bonds − energy released making bonds',inputs:[['break','Break bonds / kJ',100,2000,10,720],['make','Make bonds / kJ',100,2000,10,850]],calc:v=>({value:(v.break-v.make).toFixed(0),unit:'kJ',caption:v.break-v.make<0?'Negative: exothermic overall.':'Positive: endothermic overall.'})},
  rate:{title:'Collision-rate model',formula:'relative collision rate increases with concentration and temperature',inputs:[['concentration','Concentration / %',10,100,1,50],['temperature','Temperature / °C',10,80,1,25]],calc:v=>({value:(v.concentration*(1+Math.max(0,v.temperature-20)/40)).toFixed(0),unit:'collision index',caption:'Concept model: more particles per volume and faster particles increase collision frequency.'})},
  alkane:{title:'Alkane formula generator',formula:'alkanes: CₙH₂ₙ₊₂',inputs:[['carbon','Carbon atoms n',1,12,1,5]],calc:v=>({value:`C${v.carbon}H${2*v.carbon+2}`,unit:'',caption:'Alkanes are saturated hydrocarbons with only single carbon–carbon bonds.'})},
  rf:{title:'Chromatography Rf calculator',formula:'Rf = distance moved by substance ÷ distance moved by solvent front',inputs:[['spot','Spot distance / cm',.1,10,.1,4.2],['front','Solvent front / cm',.5,12,.1,6]],calc:v=>({value:Math.min(1,v.spot/v.front).toFixed(2),unit:'Rf',caption:'Rf has no unit and is normally between 0 and 1 for a valid chromatogram.'})},
  atmosphere:{title:'Atmospheric change calculator',formula:'percentage change = change ÷ original × 100',inputs:[['start','Starting value / ppm',100,500,10,280],['end','Later value / ppm',100,600,10,420]],calc:v=>({value:(((v.end-v.start)/v.start)*100).toFixed(1),unit:'% change',caption:'This is a maths model for interpreting concentration data; climate conclusions require multiple lines of evidence.'})},
  resources:{title:'Energy-saving calculator',formula:'saving % = (original − new) ÷ original × 100',inputs:[['original','Original process / MJ',1,20,.1,6],['new','Alternative process / MJ',.1,20,.1,2.4]],calc:v=>({value:(((v.original-v.new)/v.original)*100).toFixed(1),unit:'% saving',caption:'Life-cycle assessment also needs raw materials, transport, use and disposal impacts.'})},
  energy:{title:'Kinetic-energy calculator',formula:'Ek = ½mv²',inputs:[['mass','Mass / kg',.1,2000,.1,2],['speed','Speed / m/s',0,50,.5,6]],calc:v=>({value:(.5*v.mass*v.speed*v.speed).toFixed(1),unit:'J',caption:'Because speed is squared, doubling speed makes kinetic energy four times larger.'})},
  ohm:{title:'Ohm’s law calculator',formula:'I = V ÷ R',inputs:[['voltage','Potential difference / V',0,24,.5,12],['resistance','Resistance / Ω',1,100,1,24]],calc:v=>({value:(v.voltage/v.resistance).toFixed(3),unit:'A',caption:'For an ohmic conductor at constant temperature, current is proportional to potential difference.'})},
  density:{title:'Density calculator',formula:'ρ = m ÷ V',inputs:[['mass','Mass / kg',.1,20,.1,2.4],['volume','Volume / m³',.0001,.02,.0001,.001]],calc:v=>({value:(v.mass/v.volume).toFixed(0),unit:'kg/m³',caption:'Convert all measurements to compatible units before calculating.'})},
  halflife:{title:'Half-life decay model',formula:'remaining activity = initial activity × (½)ⁿ',inputs:[['initial','Initial activity / Bq',10,2000,10,640],['halves','Number of half-lives',0,8,1,3]],calc:v=>({value:(v.initial*Math.pow(.5,v.halves)).toFixed(1),unit:'Bq',caption:'Individual decays are random; the overall pattern is predictable for large numbers of nuclei.'})},
  force:{title:'Newton’s second law calculator',formula:'F = ma',inputs:[['mass','Mass / kg',1,2000,1,1200],['acceleration','Acceleration / m/s²',0,10,.1,3]],calc:v=>({value:(v.mass*v.acceleration).toFixed(1),unit:'N',caption:'The acceleration is in the direction of the resultant force.'})},
  waves:{title:'Wave equation explorer',formula:'v = fλ',inputs:[['frequency','Frequency / Hz',1,1000,1,170],['wavelength','Wavelength / m',.01,10,.01,2]],calc:v=>({value:(v.frequency*v.wavelength).toFixed(1),unit:'m/s',caption:'Frequency is set by the source; wave speed depends on the medium.'})},
  transformer:{title:'Transformer calculator',formula:'Vp/Vs = Np/Ns',inputs:[['vp','Primary pd / V',1,500,1,240],['np','Primary turns',10,2000,10,1000],['ns','Secondary turns',10,2000,10,100]],calc:v=>({value:(v.vp*v.ns/v.np).toFixed(1),unit:'V secondary',caption:'A step-down transformer has fewer secondary turns than primary turns.'})},
  orbit:{title:'Orbital period model',formula:'period = circumference ÷ orbital speed',inputs:[['radius','Orbital radius / thousand km',1,500,1,100],['speed','Orbital speed / km/s',1,100,.5,30]],calc:v=>({value:(2*Math.PI*v.radius*1000/v.speed/3600).toFixed(2),unit:'hours',caption:'This simple circular-orbit calculation assumes constant speed and radius.'})}
};
function renderSimulation(topic,guide){
  const def=simDefs[guide.sim]; if(!def){els.topicContent.innerHTML='<div class="panel content-panel">Simulation coming soon.</div>';return;}
  els.topicContent.innerHTML=`<article class="panel simulator"><span class="eyebrow">Interactive model</span><h2>${escapeHtml(def.title)}</h2><p class="sim-equation">${escapeHtml(def.formula)}</p><div class="sim-layout"><div class="sim-controls">${def.inputs.map(([id,label,min,max,step,value])=>`<div class="sim-control"><label for="sim-${id}"><span>${escapeHtml(label)}</span><b id="sim-label-${id}">${value}</b></label><input id="sim-${id}" data-sim-input="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`).join('')}<div class="sim-note">Use the sliders to test cause and effect. Conceptual models are labelled where they simplify real systems.</div></div><div class="sim-stage"><div class="sim-result" id="simResult"></div><div class="sim-unit" id="simUnit"></div><div class="sim-visual"><div class="sim-wave"></div></div><p class="sim-caption" id="simCaption"></p></div></div></article>`;
  const update=()=>{const values={};els.topicContent.querySelectorAll('[data-sim-input]').forEach(input=>{values[input.dataset.simInput]=Number(input.value);const lab=document.getElementById(`sim-label-${input.dataset.simInput}`);if(lab)lab.textContent=input.value;});const out=def.calc(values);document.getElementById('simResult').textContent=out.value;document.getElementById('simUnit').textContent=out.unit||'';document.getElementById('simCaption').textContent=out.caption||'';};
  els.topicContent.querySelectorAll('[data-sim-input]').forEach(input=>input.addEventListener('input',update));update();
}

function normaliseAnswer(text){return text.toLowerCase().replace(/,/g,'').replace(/[^a-z0-9.+\- ]/g,' ').replace(/\s+/g,' ').trim();}
function keywordHit(answer,keyword){
  const a=normaliseAnswer(answer),alts=String(keyword).toLowerCase().split('|').map(x=>normaliseAnswer(x));
  return alts.some(k=>{
    if(!k)return false;
    if(/^[-+]?\d*\.?\d+$/.test(k)){const nums=a.match(/[-+]?\d*\.?\d+/g)||[];const target=Number(k);return nums.some(n=>Math.abs(Number(n)-target)<=Math.max(.02,Math.abs(target)*.01));}
    return a.includes(k);
  });
}
function renderExamPractice(topic,guide){
  els.topicContent.innerHTML=`<div class="exam-toolbar"><div><span class="eyebrow">Original exam-style practice</span><h2>${topic.code} exam questions</h2><p class="exam-warning">These are original practice questions written for this course, not copied AQA questions. Automatic marking is a keyword/concept check and should be used as feedback rather than treated as an official examiner mark.</p></div></div><div class="exam-list">${guide.exam.map((q,i)=>`<article class="panel exam-card"><div class="exam-card-head"><div><span class="question-number">Question ${i+1}</span><h3>${escapeHtml(q[0])}</h3></div><span class="mark-badge">${q[1]} marks</span></div><textarea id="exam-answer-${i}" placeholder="Write your answer here…"></textarea><div class="question-actions"><button class="button small" type="button" data-model="${i}">Mark points</button><button class="button primary small" type="button" data-mark="${i}">Auto-mark</button></div><div id="exam-result-${i}"></div><div id="model-${i}" class="model-answer" hidden><strong>Key marking points</strong><br>${q[2].map(x=>escapeHtml(String(x))).join(' · ')}</div></article>`).join('')}</div>`;
  els.topicContent.querySelectorAll('[data-model]').forEach(btn=>btn.addEventListener('click',()=>{const el=document.getElementById(`model-${btn.dataset.model}`);el.hidden=!el.hidden;btn.textContent=el.hidden?'Mark points':'Hide points';}));
  els.topicContent.querySelectorAll('[data-mark]').forEach(btn=>btn.addEventListener('click',()=>{
    const i=Number(btn.dataset.mark),q=guide.exam[i],answer=document.getElementById(`exam-answer-${i}`).value,points=q[2].map(k=>({k,hit:keywordHit(answer,k)})),hits=points.filter(p=>p.hit).length,score=Math.min(q[1],hits);
    const missing=points.filter(p=>!p.hit).map(p=>String(p.k));
    document.getElementById(`exam-result-${i}`).innerHTML=`<div class="mark-result"><strong>Practice mark: ${score} / ${q[1]}</strong><p>${score===q[1]?'You included the main marking ideas in this simplified check.':'Add more precise scientific detail, then mark again.'}</p><div class="mark-points">${points.map(p=>`<span class="mark-point ${p.hit?'hit':''}">${p.hit?'✓':'○'} ${escapeHtml(String(p.k))}</span>`).join('')}</div>${missing.length?`<p><b>Missing/unclear:</b> ${missing.map(escapeHtml).join(', ')}</p>`:''}</div>`;
  }));
}
function renderRetrievalQuiz(topic){
  els.topicContent.innerHTML=`<div class="panel content-panel"><span class="eyebrow">Retrieval practice</span><h2>Test yourself</h2><p class="muted">Say or write your answer before revealing the model answer.</p><div class="quiz-list">${topic.quiz.map(([q,a],i)=>`<article class="quiz-card"><span class="question-number">Q${i+1}</span><h3>${escapeHtml(q)}</h3><button class="button small reveal-answer" type="button" data-answer="${i}">Reveal answer</button><p class="answer" id="answer-${i}" hidden>${escapeHtml(a)}</p></article>`).join('')}</div></div>`;
  els.topicContent.querySelectorAll('.reveal-answer').forEach(btn=>btn.addEventListener('click',()=>{const answer=document.getElementById(`answer-${btn.dataset.answer}`);answer.hidden=!answer.hidden;btn.textContent=answer.hidden?'Reveal answer':'Hide answer';}));
}

function setMode(mode){
  state.mode=mode==='triple'?'triple':'combined'; if(state.mode==='combined'&&topics.find(t=>t.id===state.activeTopicId)?.scope==='triple')state.activeTopicId='p7';saveSettings();renderHome();if(!els.topicView.hidden)renderTopic();
}
function openNotebook(){const topic=topics.find(t=>t.id===state.activeTopicId);els.notebookContext.textContent=els.topicView.hidden?'Save definitions, calculations, practical reminders and exam tips.':`${topic.code} · ${topic.title}`;els.notebook.classList.add('open');els.notebook.setAttribute('aria-hidden','false');els.backdrop.hidden=false;renderNotes();setTimeout(()=>els.notebookInput.focus(),50);}
function closeNotebook(){els.notebook.classList.remove('open');els.notebook.setAttribute('aria-hidden','true');els.backdrop.hidden=true;}
function renderNotes(){
  if(!notes.length){els.notesList.innerHTML='<div class="empty-notes">No notes yet.</div>';return;}
  els.notesList.innerHTML=[...notes].reverse().map(note=>{const topic=topics.find(t=>t.id===note.topic);return `<article class="note"><div><strong>${topic?`${topic.code} · ${topic.title}`:'General Science'}</strong><button type="button" data-delete-note="${note.id}" aria-label="Delete note">×</button></div><p>${escapeHtml(note.text).replace(/\n/g,'<br>')}</p><small>${new Date(note.created).toLocaleString()}</small></article>`;}).join('');
  els.notesList.querySelectorAll('[data-delete-note]').forEach(btn=>btn.addEventListener('click',()=>{notes=notes.filter(n=>String(n.id)!==btn.dataset.deleteNote);saveNotes();renderNotes();}));
}
function saveNote(){const text=els.notebookInput.value.trim();if(!text)return;notes.push({id:Date.now(),topic:els.topicView.hidden?null:state.activeTopicId,text,created:new Date().toISOString()});saveNotes();els.notebookInput.value='';renderNotes();}

let currentRetrieval=null;
function retrievalPool(){return filteredTopics().flatMap(topic=>topic.quiz.map(([q,a])=>({topic,q,a})));}
function showRetrieval(){const selected=retrievalPool(),pool=selected.length?selected:availableTopics().flatMap(topic=>topic.quiz.map(([q,a])=>({topic,q,a})));if(!pool.length)return;currentRetrieval=pool[Math.floor(Math.random()*pool.length)];els.retrievalQuestion.innerHTML=`<span>${currentRetrieval.topic.code} · ${escapeHtml(currentRetrieval.topic.title)}</span>${escapeHtml(currentRetrieval.q)}`;els.retrievalAnswer.textContent=currentRetrieval.a;els.retrievalAnswer.hidden=true;document.getElementById('showAnswer').textContent='Show answer';els.retrievalModal.hidden=false;}
function closeRetrieval(){els.retrievalModal.hidden=true;}

// Home controls
document.querySelectorAll('#courseMode button').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
document.querySelectorAll('#subjectTabs button').forEach(btn=>btn.addEventListener('click',()=>{state.subject=btn.dataset.subject;renderHome();}));
els.search.addEventListener('input',()=>{state.search=els.search.value;renderHome();});
els.paper.addEventListener('change',()=>{state.paper=els.paper.value;renderHome();});
document.getElementById('continueButton').addEventListener('click',()=>{const last=topics.find(t=>t.id===state.activeTopicId&&(state.mode==='triple'||t.scope!=='triple'))||availableTopics()[0];if(last)openTopic(last.id);});
document.getElementById('homeButton').addEventListener('click',closeTopic);document.getElementById('backButton').addEventListener('click',closeTopic);

// Topic navigation
aels=els; // keeps older browser debugging simple without changing app state
els.topicSelect.addEventListener('change',()=>openTopic(els.topicSelect.value));
els.previousTopic.addEventListener('click',()=>{const list=availableTopics(),i=list.findIndex(t=>t.id===state.activeTopicId);if(i>0)openTopic(list[i-1].id);});
els.nextTopic.addEventListener('click',()=>{const list=availableTopics(),i=list.findIndex(t=>t.id===state.activeTopicId);if(i<list.length-1)openTopic(list[i+1].id);});
els.completeTopic.addEventListener('click',()=>{progress[state.activeTopicId]=!progress[state.activeTopicId];saveProgress();renderTopic();});
document.querySelectorAll('#contentTabs button').forEach(btn=>btn.addEventListener('click',()=>{state.activeTab=btn.dataset.tab;renderTopic();}));

// Notebook
document.getElementById('notebookButton').addEventListener('click',openNotebook);document.getElementById('topicNotebookButton').addEventListener('click',openNotebook);document.getElementById('closeNotebook').addEventListener('click',closeNotebook);els.backdrop.addEventListener('click',closeNotebook);document.getElementById('saveNote').addEventListener('click',saveNote);els.notebookInput.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')saveNote();});

// Retrieval
document.getElementById('randomQuestionButton').addEventListener('click',showRetrieval);document.getElementById('closeRetrieval').addEventListener('click',closeRetrieval);document.getElementById('anotherQuestion').addEventListener('click',showRetrieval);document.getElementById('showAnswer').addEventListener('click',()=>{els.retrievalAnswer.hidden=!els.retrievalAnswer.hidden;document.getElementById('showAnswer').textContent=els.retrievalAnswer.hidden?'Show answer':'Hide answer';});els.retrievalModal.addEventListener('click',e=>{if(e.target===els.retrievalModal)closeRetrieval();});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(els.notebook.classList.contains('open'))closeNotebook();else if(!els.retrievalModal.hidden)closeRetrieval();else if(!els.topicView.hidden)closeTopic();}});

const params=new URLSearchParams(location.search),requested=params.get('topic');renderHome();if(requested&&topics.some(t=>t.id===requested)&&(state.mode==='triple'||topics.find(t=>t.id===requested).scope!=='triple'))openTopic(requested);
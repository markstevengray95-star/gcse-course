const DATA = window.GCSE_COURSE_DATA;
const topics = DATA.topics;
const subjects = DATA.subjects;

const keys = {
  settings: 'gcse-science-settings-v1',
  progress: 'gcse-science-progress-v1',
  lessons: 'gcse-science-lessons-v1',
  notes: 'gcse-science-notes-v1',
  location: 'gcse-science-location-v1'
};

const safeParse = (value, fallback) => {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
};

const settings = safeParse(localStorage.getItem(keys.settings), {mode:'combined'});
let state = {
  mode: settings.mode === 'triple' ? 'triple' : 'combined',
  subject: 'all',
  paper: 'all',
  search: '',
  activeTopicId: safeParse(localStorage.getItem(keys.location), {topic:'b1'}).topic || 'b1',
  activeTab: 'overview'
};
let progress = safeParse(localStorage.getItem(keys.progress), {});
let lessonProgress = safeParse(localStorage.getItem(keys.lessons), {});
let notes = safeParse(localStorage.getItem(keys.notes), []);

const els = {
  homeView: document.getElementById('homeView'),
  topicView: document.getElementById('topicView'),
  topicGrid: document.getElementById('topicGrid'),
  resultCount: document.getElementById('resultCount'),
  mapTitle: document.getElementById('mapTitle'),
  courseSummary: document.getElementById('courseSummary'),
  progressText: document.getElementById('progressText'),
  progressFill: document.getElementById('progressFill'),
  search: document.getElementById('topicSearch'),
  paper: document.getElementById('paperFilter'),
  topicTitle: document.getElementById('topicTitle'),
  topicSummary: document.getElementById('topicSummary'),
  topicMeta: document.getElementById('topicMeta'),
  topicStat: document.getElementById('topicStat'),
  topicContent: document.getElementById('topicContent'),
  topicSelect: document.getElementById('topicSelect'),
  previousTopic: document.getElementById('previousTopic'),
  nextTopic: document.getElementById('nextTopic'),
  completeTopic: document.getElementById('completeTopicButton'),
  notebook: document.getElementById('notebook'),
  backdrop: document.getElementById('backdrop'),
  notesList: document.getElementById('notesList'),
  notebookInput: document.getElementById('notebookInput'),
  notebookContext: document.getElementById('notebookContext'),
  retrievalModal: document.getElementById('retrievalModal'),
  retrievalQuestion: document.getElementById('retrievalQuestion'),
  retrievalAnswer: document.getElementById('retrievalAnswer')
};

function saveSettings(){
  localStorage.setItem(keys.settings, JSON.stringify({mode: state.mode}));
}
function saveProgress(){localStorage.setItem(keys.progress, JSON.stringify(progress));}
function saveLessons(){localStorage.setItem(keys.lessons, JSON.stringify(lessonProgress));}
function saveNotes(){localStorage.setItem(keys.notes, JSON.stringify(notes));}
function saveLocation(){localStorage.setItem(keys.location, JSON.stringify({topic:state.activeTopicId}));}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function subjectFor(topic){return subjects.find(s=>s.id===topic.subject);}
function availableTopics(){return topics.filter(t => state.mode === 'triple' || t.scope !== 'triple');}
function visibleLessons(topic){return topic.lessons.filter(([,scope]) => state.mode === 'triple' || scope !== 'triple');}
function lessonKey(topicId, index){return `${state.mode}:${topicId}:${index}`;}
function subjectTopics(subject){return availableTopics().filter(t=>t.subject===subject);}

function topicLessonStats(topic){
  const lessons = visibleLessons(topic);
  const done = lessons.reduce((count, _, index) => count + (lessonProgress[lessonKey(topic.id,index)] ? 1 : 0), 0);
  return {done,total:lessons.length,percent:lessons.length ? Math.round(done/lessons.length*100) : 0};
}

function courseStats(list=availableTopics()){
  const done = list.filter(t=>progress[t.id]).length;
  return {done,total:list.length,percent:list.length?Math.round(done/list.length*100):0};
}

function filteredTopics(){
  const q = state.search.trim().toLowerCase();
  return availableTopics().filter(topic => {
    if(state.subject !== 'all' && topic.subject !== state.subject) return false;
    if(state.paper !== 'all' && String(topic.paper) !== state.paper) return false;
    if(!q) return true;
    const lessonText = visibleLessons(topic).map(([name])=>name).join(' ');
    return `${topic.code} ${topic.title} ${topic.summary} ${lessonText}`.toLowerCase().includes(q);
  });
}

function renderGlobalProgress(){
  const stat = courseStats();
  els.progressText.textContent = `${stat.done} / ${stat.total} topics complete`;
  els.progressFill.style.width = `${stat.percent}%`;
}

function renderCourseSummary(){
  const modeTitle = state.mode === 'combined' ? 'Combined Science' : 'Separate / Triple Science';
  const cards = subjects.map(subject => {
    const list = subjectTopics(subject.id);
    const stat = courseStats(list);
    return `<article class="summary-card ${subject.id}">
      <span class="summary-icon">${subject.icon}</span>
      <div><strong>${subject.name}</strong><span>${stat.done} / ${stat.total} topics complete</span></div>
      <b>${stat.percent}%</b>
    </article>`;
  }).join('');
  els.courseSummary.innerHTML = `<div class="summary-heading"><strong>${modeTitle}</strong><span>${availableTopics().length} specification topics</span></div><div class="summary-grid">${cards}</div>`;
}

function renderTopicGrid(){
  const list = filteredTopics();
  els.resultCount.textContent = `${list.length} topic${list.length===1?'':'s'}`;
  const subjectName = state.subject === 'all' ? 'All GCSE Science topics' : `${subjectFor({subject:state.subject}).name} topics`;
  els.mapTitle.textContent = state.mode === 'combined' ? subjectName : `${subjectName} · Separate / Triple`;

  if(!list.length){
    els.topicGrid.innerHTML = `<div class="empty-state panel"><strong>No topics found.</strong><p>Try a different subject, paper or search term.</p></div>`;
    return;
  }

  els.topicGrid.innerHTML = list.map(topic => {
    const subject = subjectFor(topic);
    const stats = topicLessonStats(topic);
    const extraCount = topic.lessons.filter(([,scope])=>scope==='triple').length;
    return `<article class="topic-card ${topic.subject} ${progress[topic.id]?'complete':''}" data-topic="${topic.id}" tabindex="0" role="button">
      <div class="card-top">
        <span class="topic-code">${topic.code}</span>
        <div class="badges"><span class="badge">Paper ${topic.paper}</span>${topic.scope==='triple'?'<span class="badge triple">Physics only</span>':(state.mode==='triple'&&extraCount?`<span class="badge triple">+${extraCount} Separate</span>`:'')}</div>
      </div>
      <span class="subject-label">${subject.icon} ${subject.name}</span>
      <h3>${topic.title}</h3>
      <p>${topic.summary}</p>
      <div class="mini-progress"><span><i style="width:${stats.percent}%"></i></span><b>${stats.done}/${stats.total} lessons</b></div>
      <div class="card-footer"><span>${topic.practicals.length} practical${topic.practicals.length===1?'':'s'}</span><strong>${progress[topic.id]?'Completed ✓':'Open topic →'}</strong></div>
    </article>`;
  }).join('');

  els.topicGrid.querySelectorAll('.topic-card').forEach(card => {
    const open = () => openTopic(card.dataset.topic);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}

function renderHome(){
  document.querySelectorAll('#courseMode button').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===state.mode));
  document.querySelectorAll('#subjectTabs button').forEach(btn=>btn.classList.toggle('active',btn.dataset.subject===state.subject));
  els.paper.value = state.paper;
  els.search.value = state.search;
  renderGlobalProgress();
  renderCourseSummary();
  renderTopicGrid();
  const last = topics.find(t=>t.id===state.activeTopicId && (state.mode==='triple'||t.scope!=='triple')) || availableTopics()[0];
  document.getElementById('continueButton').textContent = last ? `Continue ${last.code}: ${last.title}` : 'Continue learning';
}

function openTopic(id){
  const topic = topics.find(t=>t.id===id);
  if(!topic || (state.mode==='combined' && topic.scope==='triple')) return;
  state.activeTopicId = topic.id;
  state.activeTab = 'overview';
  saveLocation();
  els.homeView.hidden = true;
  els.topicView.hidden = false;
  renderTopic();
  window.scrollTo({top:0,behavior:'smooth'});
  const url = new URL(location.href); url.searchParams.set('topic',topic.id); history.replaceState({},'',url);
}

function closeTopic(){
  els.homeView.hidden = false;
  els.topicView.hidden = true;
  const url = new URL(location.href); url.searchParams.delete('topic'); history.replaceState({},'',url);
  renderHome();
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderTopic(){
  let topic = topics.find(t=>t.id===state.activeTopicId);
  if(!topic || (state.mode==='combined' && topic.scope==='triple')){
    topic = availableTopics()[0];
    state.activeTopicId = topic.id;
  }
  const subject = subjectFor(topic);
  const stats = topicLessonStats(topic);
  const extraLessons = topic.lessons.filter(([,scope])=>scope==='triple').length;

  els.topicTitle.textContent = `${topic.code}: ${topic.title}`;
  els.topicSummary.textContent = topic.summary;
  els.topicMeta.innerHTML = `<span class="badge ${topic.subject}">${subject.icon} ${subject.name}</span><span class="badge">Paper ${topic.paper}</span>${topic.scope==='triple'?'<span class="badge triple">Separate Physics only</span>':(state.mode==='triple'&&extraLessons?'<span class="badge triple">Includes Separate Science extension</span>':'')}`;
  els.topicStat.innerHTML = `<strong>${stats.percent}%</strong><span>${stats.done} of ${stats.total} lessons checked off</span>`;
  els.completeTopic.textContent = progress[topic.id] ? 'Completed ✓' : 'Mark topic complete';
  els.completeTopic.classList.toggle('completed',!!progress[topic.id]);

  const navTopics = availableTopics();
  const index = navTopics.findIndex(t=>t.id===topic.id);
  els.topicSelect.innerHTML = navTopics.map(t=>`<option value="${t.id}">${t.code} · ${t.title}</option>`).join('');
  els.topicSelect.value = topic.id;
  els.previousTopic.disabled = index<=0;
  els.nextTopic.disabled = index>=navTopics.length-1;

  document.querySelectorAll('#contentTabs button').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===state.activeTab));
  renderTopicContent(topic);
  renderGlobalProgress();
}

function renderTopicContent(topic){
  const subject = subjectFor(topic);
  const lessons = visibleLessons(topic);
  if(state.activeTab === 'overview'){
    const combinedCount = topic.lessons.filter(([,scope])=>scope==='combined').length;
    const separateCount = topic.lessons.filter(([,scope])=>scope==='triple').length;
    els.topicContent.innerHTML = `<div class="overview-grid">
      <article class="panel content-panel"><span class="eyebrow">What you will learn</span><h2>${topic.title}</h2><p>${topic.summary}</p><ul class="key-list">${lessons.slice(0,8).map(([name])=>`<li>${escapeHtml(name)}</li>`).join('')}${lessons.length>8?`<li>+ ${lessons.length-8} more lesson sections</li>`:''}</ul></article>
      <article class="panel content-panel"><span class="eyebrow">Specification coverage</span><h2>${subject.name} Paper ${topic.paper}</h2><div class="stat-row"><div><strong>${combinedCount}</strong><span>Combined lessons</span></div><div><strong>${state.mode==='triple'?separateCount:0}</strong><span>Separate-only lessons</span></div><div><strong>${topic.practicals.length}</strong><span>Practical links</span></div></div><p class="muted">Separate Science mode includes all Combined content plus the additional Biology-, Chemistry- or Physics-only material.</p></article>
      <article class="panel content-panel full-span"><span class="eyebrow">Study flow</span><h2>Recommended sequence</h2><div class="study-flow"><span>1. Learn the lesson content</span><span>2. Check required practical knowledge</span><span>3. Complete retrieval questions</span><span>4. Mark the topic complete</span></div></article>
    </div>`;
  }

  if(state.activeTab === 'lessons'){
    els.topicContent.innerHTML = `<div class="panel content-panel"><div class="content-heading"><div><span class="eyebrow">Structured course</span><h2>${lessons.length} lesson sections</h2><p class="muted">Check off lessons as you teach or study them. Progress is stored on this device.</p></div></div><div class="lesson-list">${lessons.map(([name,scope],index)=>{
      const checked = !!lessonProgress[lessonKey(topic.id,index)];
      return `<label class="lesson-row ${checked?'done':''}"><input type="checkbox" data-lesson="${index}" ${checked?'checked':''}><span class="lesson-number">${String(index+1).padStart(2,'0')}</span><span class="lesson-name">${escapeHtml(name)}</span>${scope==='triple'?'<span class="badge triple">Separate only</span>':''}</label>`;
    }).join('')}</div></div>`;
    els.topicContent.querySelectorAll('[data-lesson]').forEach(input=>input.addEventListener('change',()=>{
      lessonProgress[lessonKey(topic.id,Number(input.dataset.lesson))] = input.checked;
      saveLessons();
      renderTopic();
    }));
  }

  if(state.activeTab === 'practicals'){
    const list = topic.practicals.filter(p=>state.mode==='triple' || !/only\)/i.test(p));
    els.topicContent.innerHTML = `<div class="panel content-panel"><span class="eyebrow">Required practical knowledge</span><h2>${list.length ? `${list.length} practical focus${list.length===1?'':'es'}` : 'No topic-specific required practical'}</h2>${list.length?`<div class="practical-list">${list.map((p,i)=>`<article><span>${i+1}</span><div><strong>Practical ${i+1}</strong><p>${escapeHtml(p)}</p><small>Revise variables, method, measurements, safety, graph/data handling and evaluation.</small></div></article>`).join('')}</div>`:'<p>This topic still assesses working scientifically, mathematical skills and interpretation of practical evidence even where no named required practical sits directly inside the topic.</p>'}</div>`;
  }

  if(state.activeTab === 'quiz'){
    els.topicContent.innerHTML = `<div class="panel content-panel"><span class="eyebrow">Retrieval practice</span><h2>Test yourself</h2><p class="muted">Say or write your answer before revealing the model answer.</p><div class="quiz-list">${topic.quiz.map(([q,a],i)=>`<article class="quiz-card"><span class="question-number">Q${i+1}</span><h3>${escapeHtml(q)}</h3><button class="button small reveal-answer" type="button" data-answer="${i}">Reveal answer</button><p class="answer" id="answer-${i}" hidden>${escapeHtml(a)}</p></article>`).join('')}</div></div>`;
    els.topicContent.querySelectorAll('.reveal-answer').forEach(btn=>btn.addEventListener('click',()=>{
      const answer = document.getElementById(`answer-${btn.dataset.answer}`);
      answer.hidden = !answer.hidden;
      btn.textContent = answer.hidden ? 'Reveal answer' : 'Hide answer';
    }));
  }
}

function setMode(mode){
  state.mode = mode === 'triple' ? 'triple' : 'combined';
  if(state.mode==='combined' && topics.find(t=>t.id===state.activeTopicId)?.scope==='triple') state.activeTopicId='p7';
  saveSettings();
  renderHome();
  if(!els.topicView.hidden) renderTopic();
}

function openNotebook(){
  const topic = topics.find(t=>t.id===state.activeTopicId);
  els.notebookContext.textContent = els.topicView.hidden ? 'Save definitions, calculations, practical reminders and exam tips.' : `${topic.code} · ${topic.title}`;
  els.notebook.classList.add('open');
  els.notebook.setAttribute('aria-hidden','false');
  els.backdrop.hidden=false;
  renderNotes();
  setTimeout(()=>els.notebookInput.focus(),50);
}
function closeNotebook(){
  els.notebook.classList.remove('open');
  els.notebook.setAttribute('aria-hidden','true');
  els.backdrop.hidden=true;
}
function renderNotes(){
  if(!notes.length){els.notesList.innerHTML='<div class="empty-notes">No notes yet.</div>';return;}
  els.notesList.innerHTML = [...notes].reverse().map(note=>{
    const topic = topics.find(t=>t.id===note.topic);
    return `<article class="note"><div><strong>${topic?`${topic.code} · ${topic.title}`:'General Science'}</strong><button type="button" data-delete-note="${note.id}" aria-label="Delete note">×</button></div><p>${escapeHtml(note.text).replace(/\n/g,'<br>')}</p><small>${new Date(note.created).toLocaleString()}</small></article>`;
  }).join('');
  els.notesList.querySelectorAll('[data-delete-note]').forEach(btn=>btn.addEventListener('click',()=>{
    notes=notes.filter(n=>String(n.id)!==btn.dataset.deleteNote);saveNotes();renderNotes();
  }));
}
function saveNote(){
  const text = els.notebookInput.value.trim(); if(!text) return;
  notes.push({id:Date.now(),topic:els.topicView.hidden?null:state.activeTopicId,text,created:new Date().toISOString()});
  saveNotes(); els.notebookInput.value=''; renderNotes();
}

let currentRetrieval = null;
function retrievalPool(){
  return filteredTopics().flatMap(topic=>topic.quiz.map(([q,a])=>({topic,q,a})));
}
function showRetrieval(){
  const pool = retrievalPool().length ? retrievalPool() : availableTopics().flatMap(topic=>topic.quiz.map(([q,a])=>({topic,q,a})));
  if(!pool.length) return;
  currentRetrieval = pool[Math.floor(Math.random()*pool.length)];
  els.retrievalQuestion.innerHTML = `<span>${currentRetrieval.topic.code} · ${escapeHtml(currentRetrieval.topic.title)}</span>${escapeHtml(currentRetrieval.q)}`;
  els.retrievalAnswer.textContent = currentRetrieval.a;
  els.retrievalAnswer.hidden = true;
  document.getElementById('showAnswer').textContent='Show answer';
  els.retrievalModal.hidden=false;
}
function closeRetrieval(){els.retrievalModal.hidden=true;}

// Home controls
document.querySelectorAll('#courseMode button').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
document.querySelectorAll('#subjectTabs button').forEach(btn=>btn.addEventListener('click',()=>{state.subject=btn.dataset.subject;renderHome();}));
els.search.addEventListener('input',()=>{state.search=els.search.value;renderHome();});
els.paper.addEventListener('change',()=>{state.paper=els.paper.value;renderHome();});
document.getElementById('continueButton').addEventListener('click',()=>{
  const last = topics.find(t=>t.id===state.activeTopicId && (state.mode==='triple'||t.scope!=='triple')) || availableTopics()[0];
  if(last) openTopic(last.id);
});
document.getElementById('homeButton').addEventListener('click',closeTopic);
document.getElementById('backButton').addEventListener('click',closeTopic);

// Topic navigation
els.topicSelect.addEventListener('change',()=>openTopic(els.topicSelect.value));
els.previousTopic.addEventListener('click',()=>{const list=availableTopics(),i=list.findIndex(t=>t.id===state.activeTopicId);if(i>0)openTopic(list[i-1].id);});
els.nextTopic.addEventListener('click',()=>{const list=availableTopics(),i=list.findIndex(t=>t.id===state.activeTopicId);if(i<list.length-1)openTopic(list[i+1].id);});
els.completeTopic.addEventListener('click',()=>{progress[state.activeTopicId]=!progress[state.activeTopicId];saveProgress();renderTopic();});
document.querySelectorAll('#contentTabs button').forEach(btn=>btn.addEventListener('click',()=>{state.activeTab=btn.dataset.tab;renderTopic();}));

// Notebook
document.getElementById('notebookButton').addEventListener('click',openNotebook);
document.getElementById('topicNotebookButton').addEventListener('click',openNotebook);
document.getElementById('closeNotebook').addEventListener('click',closeNotebook);
els.backdrop.addEventListener('click',closeNotebook);
document.getElementById('saveNote').addEventListener('click',saveNote);
els.notebookInput.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')saveNote();});

// Retrieval
document.getElementById('randomQuestionButton').addEventListener('click',showRetrieval);
document.getElementById('closeRetrieval').addEventListener('click',closeRetrieval);
document.getElementById('anotherQuestion').addEventListener('click',showRetrieval);
document.getElementById('showAnswer').addEventListener('click',()=>{els.retrievalAnswer.hidden=!els.retrievalAnswer.hidden;document.getElementById('showAnswer').textContent=els.retrievalAnswer.hidden?'Show answer':'Hide answer';});
els.retrievalModal.addEventListener('click',e=>{if(e.target===els.retrievalModal)closeRetrieval();});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(els.notebook.classList.contains('open')) closeNotebook();
    else if(!els.retrievalModal.hidden) closeRetrieval();
    else if(!els.topicView.hidden) closeTopic();
  }
});

// Initial route
const params = new URLSearchParams(location.search);
const requested = params.get('topic');
renderHome();
if(requested && topics.some(t=>t.id===requested) && (state.mode==='triple'||topics.find(t=>t.id===requested).scope!=='triple')) openTopic(requested);

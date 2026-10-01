(() => {
  'use strict';

  const DATA = window.GCSE_COURSE_DATA;
  if (!DATA?.topics?.length) return;

  const KEYS = {
    performance: 'gcse-revision-performance-v1',
    mistakes: 'gcse-mistake-bank-v1',
    mocks: 'gcse-mock-exams-v1'
  };
  const SUBJECTS = Object.fromEntries((DATA.subjects || []).map(s => [s.id, s]));
  const MAX_HISTORY = 250;
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

  const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const dayMs = 86400000;
  const now = () => Date.now();
  const fmtDate = value => value ? new Date(value).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—';
  const fmtTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  const save = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('gcse-learning-data-changed', { detail:{ key } })); };

  let performance = parse(localStorage.getItem(KEYS.performance), { topics:{}, history:[] });
  let mistakes = parse(localStorage.getItem(KEYS.mistakes), []);
  let mocks = parse(localStorage.getItem(KEYS.mocks), []);
  if (!performance || typeof performance !== 'object') performance = { topics:{}, history:[] };
  performance.topics ||= {};
  performance.history ||= [];
  if (!Array.isArray(mistakes)) mistakes = [];
  if (!Array.isArray(mocks)) mocks = [];

  let shell = null;
  let activeView = 'dashboard';
  let activeMock = null;
  let mockTimer = null;
  let mockSecondsRemaining = 0;
  let activeReviewId = null;

  function topicById(id) { return DATA.topics.find(t => t.id === id) || null; }
  function subjectName(id) { return SUBJECTS[id]?.name || id || 'Science'; }
  function subjectIcon(id) { return SUBJECTS[id]?.icon || '🧪'; }
  function accessAllowed(feature) { return Boolean(window.GCSE_ACCESS?.can?.(feature)); }
  function requireAccess(feature, label, fn) {
    if (!accessAllowed(feature)) {
      window.GCSE_ACCESS?.showUpgrade?.(feature, label);
      return false;
    }
    fn?.();
    return true;
  }

  function stableId(topicId, prompt, index) {
    let hash = 2166136261;
    const text = `${topicId}|${index}|${prompt}`;
    for (let i=0;i<text.length;i+=1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return `${topicId}-${(hash >>> 0).toString(36)}`;
  }

  function normaliseMarking(marking, fallback = '') {
    if (Array.isArray(marking)) return marking.map(x => String(x || '').trim()).filter(Boolean);
    if (marking && typeof marking === 'object') return Object.values(marking).flat().map(x => String(x || '').trim()).filter(Boolean);
    return fallback ? [String(fallback)] : [];
  }

  function questionBank() {
    const rich = window.GCSE_RICH_CONTENT;
    const bank = [];
    DATA.topics.forEach(topic => {
      const guide = rich?.guides?.[topic.id];
      const exam = Array.isArray(guide?.exam) ? guide.exam : [];
      exam.forEach((q, index) => {
        const prompt = String(Array.isArray(q) ? q[0] : q?.prompt || '').trim();
        if (!prompt) return;
        const marks = clamp(Array.isArray(q) ? q[1] : q?.marks, 1, 12) || 1;
        const marking = normaliseMarking(Array.isArray(q) ? q[2] : (q?.marking || q?.points));
        bank.push({
          id: stableId(topic.id, prompt, index), topicId:topic.id, topicCode:topic.code, topicTitle:topic.title,
          subject:topic.subject, paper:Number(topic.paper), prompt, marks, marking,
          modelAnswer: marking.length ? marking.join('; ') : 'Use the lesson content and specification points to check the response.', source:'exam-bank'
        });
      });
      (topic.quiz || []).forEach((q, index) => {
        const prompt = String(q?.[0] || '').trim();
        if (!prompt) return;
        const answer = String(q?.[1] || '').trim();
        bank.push({
          id: stableId(topic.id, `quiz:${prompt}`, index), topicId:topic.id, topicCode:topic.code, topicTitle:topic.title,
          subject:topic.subject, paper:Number(topic.paper), prompt, marks:1, marking:normaliseMarking(answer, answer),
          modelAnswer:answer, source:'retrieval'
        });
      });
    });
    const unique = new Map();
    bank.forEach(q => unique.set(q.id, q));
    return [...unique.values()];
  }

  function keywordTokens(point) {
    return String(point || '').toLowerCase().replace(/[^a-z0-9.\-\s/]/g,' ').split(/[,;]|\s{2,}/).map(x => x.trim()).filter(Boolean);
  }

  function pointMatched(answer, point) {
    const a = String(answer || '').toLowerCase().replace(/[^a-z0-9.\-\s/]/g,' ');
    const p = String(point || '').toLowerCase().trim();
    if (!p) return false;
    const numeric = p.match(/-?\d+(?:\.\d+)?/g);
    if (numeric?.some(n => a.includes(n))) return true;
    if (a.includes(p)) return true;
    const words = p.split(/\s+/).filter(w => w.length > 3 && !['with','from','that','this','into','than','same','more','less','both','when','because'].includes(w));
    return words.length ? words.filter(w => a.includes(w)).length >= Math.max(1, Math.ceil(words.length * .65)) : false;
  }

  function autoMark(question, answer) {
    const points = normaliseMarking(question.marking, question.modelAnswer);
    if (!String(answer || '').trim()) return { score:0, matched:[], possible:question.marks, confidence:'low' };
    if (!points.length) return { score:0, matched:[], possible:question.marks, confidence:'low' };
    const matched = points.filter(point => pointMatched(answer, point));
    const proportional = points.length ? Math.round((matched.length / points.length) * question.marks) : 0;
    return { score:clamp(proportional,0,question.marks), matched, possible:question.marks, confidence: question.marks <= 2 ? 'medium' : 'indicative' };
  }

  function persistAll() {
    save(KEYS.performance, performance);
    save(KEYS.mistakes, mistakes);
    save(KEYS.mocks, mocks);
  }

  function recordAttempt(entry) {
    const topicId = entry.topicId;
    if (!topicId) return;
    const maxMarks = Math.max(1, Number(entry.maxMarks || entry.marks || 1));
    const score = clamp(entry.score, 0, maxMarks);
    const previous = performance.topics[topicId] || { earned:0, possible:0, attempts:0, lastAttempt:0 };
    performance.topics[topicId] = {
      earned: previous.earned + score,
      possible: previous.possible + maxMarks,
      attempts: previous.attempts + 1,
      lastAttempt: now(),
      lastScore: score,
      lastPossible: maxMarks
    };
    performance.history.unshift({ topicId, score, maxMarks, source:entry.source || 'practice', at:now() });
    performance.history = performance.history.slice(0, MAX_HISTORY);

    if (entry.question && score < maxMarks) addMistake(entry, score, maxMarks);
    else if (entry.question && score >= maxMarks) improveExistingMistake(entry.question.id);

    save(KEYS.performance, performance);
    save(KEYS.mistakes, mistakes);
    refreshVisible();
  }

  function addMistake(entry, score, maxMarks) {
    const q = entry.question;
    if (!q?.id) return;
    const existing = mistakes.find(m => m.id === q.id);
    const payload = {
      id:q.id, topicId:q.topicId, topicCode:q.topicCode, topicTitle:q.topicTitle, subject:q.subject, paper:q.paper,
      prompt:q.prompt, marks:q.marks, marking:q.marking || [], modelAnswer:q.modelAnswer || '',
      lastAnswer:String(entry.answer || ''), lastScore:score, maxMarks, updated:now(),
      attempts:(existing?.attempts || 0) + 1, streak:0, status:'review', nextReview:now()
    };
    if (existing) Object.assign(existing, payload);
    else mistakes.unshift(payload);
  }

  function improveExistingMistake(id) {
    const item = mistakes.find(m => m.id === id);
    if (!item) return;
    item.streak = Math.max(1, Number(item.streak || 0) + 1);
    item.status = item.streak >= 3 ? 'mastered' : 'review';
    item.nextReview = now() + REVIEW_INTERVALS[Math.min(item.streak, REVIEW_INTERVALS.length - 1)] * dayMs;
    item.updated = now();
  }

  function topicScore(topicId) {
    const p = performance.topics[topicId];
    if (!p?.possible) return null;
    return Math.round((p.earned / p.possible) * 100);
  }

  function subjectScore(subject) {
    const scores = DATA.topics.filter(t => t.subject === subject).map(t => topicScore(t.id)).filter(Number.isFinite);
    return scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) : null;
  }

  function dueMistakes() {
    const time = now();
    return mistakes.filter(m => m.status !== 'mastered' && Number(m.nextReview || 0) <= time).sort((a,b)=>(a.nextReview||0)-(b.nextReview||0));
  }

  function weakestTopics(limit=5) {
    const attempted = DATA.topics.map(topic => ({ topic, score:topicScore(topic.id), perf:performance.topics[topic.id] || null }))
      .filter(x => Number.isFinite(x.score)).sort((a,b)=>a.score-b.score || (a.perf?.lastAttempt||0)-(b.perf?.lastAttempt||0));
    const unattempted = DATA.topics.filter(topic => !performance.topics[topic.id]).map(topic => ({ topic, score:null, perf:null }));
    return [...attempted, ...unattempted].slice(0, limit);
  }

  function dailyQueue() {
    const queue = [];
    dueMistakes().slice(0,3).forEach(m => queue.push({ type:'mistake', id:m.id, title:m.prompt, meta:`${m.topicCode} · due review` }));
    weakestTopics(5).forEach(item => {
      if (queue.length >= 5) return;
      if (queue.some(q => q.type==='topic' && q.id===item.topic.id)) return;
      queue.push({ type:'topic', id:item.topic.id, title:`${item.topic.code}: ${item.topic.title}`, meta:Number.isFinite(item.score)?`${item.score}% evidence score`:'Not assessed yet' });
    });
    return queue.slice(0,5);
  }

  function ensureHomeHub() {
    const home = document.getElementById('homeView');
    if (!home || home.querySelector('[data-revision-hub]')) return;
    const hero = home.querySelector('.hero');
    const section = document.createElement('section');
    section.className = 'revision-hub panel';
    section.dataset.revisionHub = 'true';
    section.innerHTML = `
      <div class="revision-hub-head"><div><span class="eyebrow">Smart revision</span><h2>Your revision command centre</h2><p class="muted">Use your results to decide what to revise next, revisit mistakes and sit timed original practice mocks.</p></div><div class="revision-hub-pulse" data-revision-pulse></div></div>
      <div class="revision-feature-grid">
        <button type="button" class="revision-feature-card" data-open-revision="dashboard"><span>📊</span><strong>Personal Revision Dashboard</strong><small>Weakest topics, mastery evidence and today’s revision queue.</small><b>Open dashboard →</b></button>
        <button type="button" class="revision-feature-card" data-open-revision="mistakes"><span>🧠</span><strong>Mistake Bank</strong><small>Wrong answers return automatically using spaced retrieval.</small><b>Review mistakes →</b></button>
        <button type="button" class="revision-feature-card pro" data-open-revision="mock"><span>📝</span><strong>Mock Exam Mode</strong><small>Timed Biology, Chemistry and Physics Paper 1/2 practice.</small><b>Start a mock →</b></button>
      </div>`;
    (hero || home.firstElementChild)?.insertAdjacentElement('afterend', section);
    section.querySelectorAll('[data-open-revision]').forEach(button => button.addEventListener('click', () => {
      const view = button.dataset.openRevision;
      const feature = view === 'mock' ? 'exam_tools' : 'revision_tools';
      requireAccess(feature, view === 'mock' ? 'Mock Exam Mode' : view === 'mistakes' ? 'Mistake Bank' : 'Personal Revision Dashboard', () => openShell(view));
    }));
    renderHomePulse();
    renderAccessState();
  }

  function renderHomePulse() {
    const pulse = document.querySelector('[data-revision-pulse]');
    if (!pulse) return;
    const due = dueMistakes().length;
    const attempts = performance.history.length;
    pulse.innerHTML = `<span><strong>${due}</strong> due mistake${due===1?'':'s'}</span><span><strong>${attempts}</strong> recorded answer${attempts===1?'':'s'}</span>`;
  }

  function renderAccessState() {
    document.querySelectorAll('[data-open-revision]').forEach(button => {
      const view = button.dataset.openRevision;
      const feature = view === 'mock' ? 'exam_tools' : 'revision_tools';
      const allowed = accessAllowed(feature);
      button.classList.toggle('revision-plan-locked', !allowed);
      let badge = button.querySelector('.revision-tier-badge');
      if (!allowed && !badge) {
        badge = document.createElement('em'); badge.className='revision-tier-badge'; badge.textContent=view==='mock'?'🔒 Pro':'🔒 Plus'; button.appendChild(badge);
      }
      if (allowed) badge?.remove();
    });
  }

  function ensureShell() {
    if (shell) return shell;
    shell = document.createElement('div');
    shell.className = 'revision-shell';
    shell.hidden = true;
    shell.innerHTML = `
      <div class="revision-shell-backdrop" data-revision-close></div>
      <section class="revision-workspace" role="dialog" aria-modal="true" aria-labelledby="revisionWorkspaceTitle">
        <header class="revision-workspace-head"><div><span class="eyebrow">GCSE Science</span><h2 id="revisionWorkspaceTitle">Smart Revision</h2></div><button type="button" class="revision-close" data-revision-close aria-label="Close">×</button></header>
        <nav class="revision-workspace-tabs">
          <button type="button" data-revision-tab="dashboard">Dashboard</button>
          <button type="button" data-revision-tab="mistakes">Mistake Bank</button>
          <button type="button" data-revision-tab="mock">Mock Exam</button>
        </nav>
        <div class="revision-workspace-body" data-revision-body></div>
      </section>`;
    document.body.appendChild(shell);
    shell.querySelectorAll('[data-revision-close]').forEach(el => el.addEventListener('click', closeShell));
    shell.querySelectorAll('[data-revision-tab]').forEach(button => button.addEventListener('click', () => {
      const view=button.dataset.revisionTab; const feature=view==='mock'?'exam_tools':'revision_tools';
      requireAccess(feature, view==='mock'?'Mock Exam Mode':view==='mistakes'?'Mistake Bank':'Personal Revision Dashboard', () => renderView(view));
    }));
    return shell;
  }

  function openShell(view='dashboard') {
    ensureShell();
    shell.hidden=false;
    document.body.classList.add('revision-shell-open');
    renderView(view);
  }
  function closeShell() {
    if (shell) shell.hidden=true;
    document.body.classList.remove('revision-shell-open');
    stopMockTimer();
  }

  function renderView(view) {
    activeView=view;
    const root=ensureShell();
    root.querySelectorAll('[data-revision-tab]').forEach(b=>b.classList.toggle('active',b.dataset.revisionTab===view));
    if (view==='mistakes') renderMistakes();
    else if (view==='mock') renderMockSetup();
    else renderDashboard();
  }

  function dashboardHtml() {
    const queue=dailyQueue(); const weak=weakestTopics(5);
    const subjectCards=['biology','chemistry','physics'].map(id=>{
      const score=subjectScore(id); return `<article class="revision-subject-score"><span>${subjectIcon(id)}</span><div><strong>${subjectName(id)}</strong><small>${score===null?'Complete practice to build evidence':`${score}% current evidence score`}</small></div><b>${score===null?'—':`${score}%`}</b></article>`;
    }).join('');
    return `<div class="revision-dashboard">
      <section class="revision-dashboard-hero"><div><span class="eyebrow">Personal Revision Dashboard</span><h3>What should I revise today?</h3><p>Recommendations update from your practice answers, mock results and Mistake Bank reviews.</p></div><div class="revision-dashboard-kpi"><strong>${dueMistakes().length}</strong><span>mistakes due now</span></div></section>
      <div class="revision-dashboard-grid">
        <section class="revision-panel"><div class="revision-panel-head"><div><h3>Today’s queue</h3><p>Start with overdue mistakes, then work on the weakest evidence.</p></div></div><div class="revision-queue">${queue.length?queue.map((q,i)=>`<button type="button" data-queue-type="${q.type}" data-queue-id="${esc(q.id)}"><span>${i+1}</span><div><strong>${esc(q.title)}</strong><small>${esc(q.meta)}</small></div><b>Start →</b></button>`).join(''):'<p class="revision-empty">Complete some practice and your queue will appear here.</p>'}</div></section>
        <section class="revision-panel"><div class="revision-panel-head"><div><h3>Weakest evidence</h3><p>Lower scores are prioritised first.</p></div></div><div class="revision-weak-list">${weak.map(item=>`<button type="button" data-open-topic="${item.topic.id}"><div><span>${item.topic.code}</span><strong>${esc(item.topic.title)}</strong></div><div class="revision-score-bar"><i style="width:${Number.isFinite(item.score)?item.score:5}%"></i></div><b>${Number.isFinite(item.score)?`${item.score}%`:'New'}</b></button>`).join('')}</div></section>
      </div>
      <section class="revision-panel"><div class="revision-panel-head"><div><h3>Subject mastery evidence</h3><p>This is a revision indicator based on answers recorded in the app, not an official predicted grade.</p></div></div><div class="revision-subject-grid">${subjectCards}</div></section>
      <section class="revision-panel revision-history"><div class="revision-panel-head"><div><h3>Recent practice</h3><p>${mocks.length} mock attempt${mocks.length===1?'':'s'} saved · ${performance.history.length} scored answer${performance.history.length===1?'':'s'} recorded.</p></div><button type="button" data-open-mistakes>Open Mistake Bank</button></div>${recentMocksHtml()}</section>
    </div>`;
  }

  function recentMocksHtml() {
    if (!mocks.length) return '<p class="revision-empty">No mock results yet. Use Mock Exam Mode when you are ready.</p>';
    return `<div class="revision-mock-history">${mocks.slice(0,5).map(m=>`<article><span>${subjectIcon(m.subject)} ${esc(subjectName(m.subject))} P${m.paper}</span><strong>${m.score}/${m.totalMarks}</strong><small>${Math.round((m.score/Math.max(1,m.totalMarks))*100)}% · ${fmtDate(m.finishedAt)}</small></article>`).join('')}</div>`;
  }

  function renderDashboard() {
    const body=ensureShell().querySelector('[data-revision-body]');
    body.innerHTML=dashboardHtml();
    body.querySelectorAll('[data-queue-type]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.queueType==='mistake'){activeReviewId=button.dataset.queueId;renderMistakes();}
      else openCourseTopic(button.dataset.queueId);
    }));
    body.querySelectorAll('[data-open-topic]').forEach(button=>button.addEventListener('click',()=>openCourseTopic(button.dataset.openTopic)));
    body.querySelector('[data-open-mistakes]')?.addEventListener('click',()=>renderView('mistakes'));
  }

  function openCourseTopic(topicId) {
    closeShell();
    if (typeof openTopic === 'function') openTopic(topicId);
    else { const url=new URL(location.href); url.searchParams.set('topic',topicId); location.href=url.toString(); }
  }

  function mistakeStatus(item) {
    if (item.status==='mastered') return 'Mastered';
    if ((item.nextReview||0)<=now()) return 'Due now';
    return `Next ${fmtDate(item.nextReview)}`;
  }

  function renderMistakes() {
    activeView='mistakes';
    const root=ensureShell();
    root.querySelectorAll('[data-revision-tab]').forEach(b=>b.classList.toggle('active',b.dataset.revisionTab==='mistakes'));
    const body=root.querySelector('[data-revision-body]');
    const selected=activeReviewId?mistakes.find(m=>m.id===activeReviewId):null;
    if (selected) {
      body.innerHTML=reviewCardHtml(selected);
      bindReviewCard(selected);
      return;
    }
    const due=dueMistakes();
    body.innerHTML=`<div class="mistake-bank">
      <section class="revision-dashboard-hero mistake"><div><span class="eyebrow">Mistake Bank</span><h3>Turn wrong answers into future marks</h3><p>Questions you miss are saved automatically. Review them again after increasing intervals as they become secure.</p></div><div class="revision-dashboard-kpi"><strong>${due.length}</strong><span>due now</span></div></section>
      <div class="mistake-toolbar"><button type="button" data-review-next ${due.length?'':'disabled'}>Review next due mistake</button><span>${mistakes.length} saved · ${mistakes.filter(m=>m.status==='mastered').length} mastered</span></div>
      <div class="mistake-list">${mistakes.length?mistakes.map(item=>`<article class="mistake-item ${item.status==='mastered'?'mastered':''}"><div class="mistake-item-top"><span>${subjectIcon(item.subject)} ${esc(item.topicCode)} · Paper ${item.paper}</span><em>${mistakeStatus(item)}</em></div><strong>${esc(item.prompt)}</strong><p>Last score: ${item.lastScore}/${item.maxMarks} · attempts: ${item.attempts}</p><div><button type="button" data-review-id="${esc(item.id)}">Review</button><button type="button" data-remove-mistake="${esc(item.id)}">Remove</button></div></article>`).join(''):'<div class="revision-empty large"><strong>No mistakes saved yet.</strong><p>When a student loses marks in Mock Exam Mode or connected Exam Studio practice, the question will appear here automatically.</p></div>'}</div>
    </div>`;
    body.querySelector('[data-review-next]')?.addEventListener('click',()=>{if(due[0]){activeReviewId=due[0].id;renderMistakes();}});
    body.querySelectorAll('[data-review-id]').forEach(button=>button.addEventListener('click',()=>{activeReviewId=button.dataset.reviewId;renderMistakes();}));
    body.querySelectorAll('[data-remove-mistake]').forEach(button=>button.addEventListener('click',()=>{
      mistakes=mistakes.filter(m=>m.id!==button.dataset.removeMistake); save(KEYS.mistakes,mistakes); renderMistakes(); renderHomePulse();
    }));
  }

  function reviewCardHtml(item) {
    return `<div class="mistake-review"><button type="button" class="revision-back" data-review-back>← Mistake Bank</button><section class="revision-panel"><span class="eyebrow">${subjectIcon(item.subject)} ${esc(item.topicCode)} · Paper ${item.paper}</span><h3>${esc(item.prompt)}</h3><p class="muted">Write a fresh answer without looking at your previous response.</p><textarea rows="7" data-review-answer placeholder="Write your answer here…"></textarea><div class="mistake-review-actions"><button type="button" class="button primary" data-check-review>Check my answer</button></div><div data-review-feedback></div></section></div>`;
  }

  function bindReviewCard(item) {
    const body=ensureShell().querySelector('[data-revision-body]');
    body.querySelector('[data-review-back]')?.addEventListener('click',()=>{activeReviewId=null;renderMistakes();});
    body.querySelector('[data-check-review]')?.addEventListener('click',()=>{
      const answer=body.querySelector('[data-review-answer]')?.value || '';
      const result=autoMark(item,answer);
      const feedback=body.querySelector('[data-review-feedback]');
      feedback.innerHTML=`<section class="mistake-feedback"><div><strong>Practice estimate: ${result.score}/${item.maxMarks}</strong><span>This uses indicative keyword matching, so use the marking points as the final check.</span></div><details open><summary>Indicative marking points</summary><ul>${(item.marking||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></details><div class="mistake-feedback-actions"><button type="button" data-review-outcome="again">Again soon</button><button type="button" data-review-outcome="gotit">I got it</button></div></section>`;
      feedback.querySelectorAll('[data-review-outcome]').forEach(button=>button.addEventListener('click',()=>{
        const gotIt=button.dataset.reviewOutcome==='gotit';
        item.attempts=(item.attempts||0)+1; item.lastAnswer=answer; item.lastScore=result.score; item.updated=now();
        if(gotIt){item.streak=(item.streak||0)+1;item.status=item.streak>=3?'mastered':'review';item.nextReview=now()+REVIEW_INTERVALS[Math.min(item.streak,REVIEW_INTERVALS.length-1)]*dayMs;}
        else {item.streak=0;item.status='review';item.nextReview=now()+dayMs;}
        recordAttempt({topicId:item.topicId,score:gotIt?item.maxMarks:result.score,maxMarks:item.maxMarks,source:'mistake-review'});
        save(KEYS.mistakes,mistakes); activeReviewId=null; renderMistakes(); renderHomePulse();
      }));
    });
  }

  function mockSetupHtml() {
    return `<div class="mock-exam"><section class="revision-dashboard-hero mock"><div><span class="eyebrow">Mock Exam Mode</span><h3>Build an original timed GCSE Science practice paper</h3><p>Choose a science and paper. Questions are assembled from original AQA-style practice material already in this course; they are not an official AQA past paper.</p></div><div class="revision-dashboard-kpi"><strong>${mocks.length}</strong><span>mock attempts</span></div></section>
      <section class="revision-panel mock-builder"><div class="mock-builder-grid"><label>Subject<select data-mock-subject><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label><label>Paper<select data-mock-paper><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label><label>Target length<select data-mock-marks><option value="20">Short · about 20 marks</option><option value="40" selected>Standard · about 40 marks</option><option value="60">Long · about 60 marks</option></select></label></div><div class="mock-builder-note" data-mock-availability></div><button type="button" class="button primary" data-start-mock>Start timed mock</button></section>${recentMocksHtml()}</div>`;
  }

  function renderMockSetup() {
    activeView='mock'; stopMockTimer(); activeMock=null;
    const root=ensureShell(); root.querySelectorAll('[data-revision-tab]').forEach(b=>b.classList.toggle('active',b.dataset.revisionTab==='mock'));
    const body=root.querySelector('[data-revision-body]'); body.innerHTML=mockSetupHtml();
    const subject=body.querySelector('[data-mock-subject]'), paper=body.querySelector('[data-mock-paper]'), marks=body.querySelector('[data-mock-marks]');
    const update=()=>{
      const bank=questionBank().filter(q=>q.subject===subject.value&&q.paper===Number(paper.value));
      const total=bank.reduce((n,q)=>n+q.marks,0);
      body.querySelector('[data-mock-availability]').textContent=`${bank.length} questions available across ${new Set(bank.map(q=>q.topicId)).size} topics · ${total} total source marks available.`;
    };
    subject.addEventListener('change',update); paper.addEventListener('change',update); update();
    body.querySelector('[data-start-mock]')?.addEventListener('click',()=>startMock(subject.value,Number(paper.value),Number(marks.value)));
  }

  function shuffled(items) {
    const out=[...items]; for(let i=out.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out;
  }

  function buildMock(subject,paper,targetMarks) {
    const candidates=questionBank().filter(q=>q.subject===subject&&q.paper===paper);
    const groups=new Map(); candidates.forEach(q=>{if(!groups.has(q.topicId))groups.set(q.topicId,[]);groups.get(q.topicId).push(q);});
    const topicIds=shuffled([...groups.keys()]); topicIds.forEach(id=>groups.set(id,shuffled(groups.get(id))));
    const selected=[]; let total=0; let round=0;
    while(total<targetMarks && topicIds.some(id=>(groups.get(id)||[]).length)){
      const id=topicIds[round%topicIds.length]; const pool=groups.get(id)||[]; const q=pool.shift(); round+=1; if(!q)continue;
      if(total>0 && total+q.marks>targetMarks+4)continue;
      selected.push(q); total+=q.marks;
    }
    return { id:`mock-${Date.now()}`, subject,paper,targetMarks,totalMarks:total,questions:selected,answers:{},current:0,startedAt:now(),durationMinutes:Math.max(20,Math.round(total*1.1)),finishedAt:null };
  }

  function startMock(subject,paper,targetMarks) {
    activeMock=buildMock(subject,paper,targetMarks);
    if(!activeMock.questions.length){ensureShell().querySelector('[data-revision-body]').innerHTML='<div class="revision-empty large"><strong>No questions are available for that paper yet.</strong></div>';return;}
    mockSecondsRemaining=activeMock.durationMinutes*60;
    renderMockQuestion(); startMockTimer();
  }

  function startMockTimer() {
    stopMockTimer();
    mockTimer=setInterval(()=>{
      mockSecondsRemaining=Math.max(0,mockSecondsRemaining-1);
      const timer=ensureShell().querySelector('[data-mock-timer]'); if(timer)timer.textContent=fmtTime(mockSecondsRemaining);
      if(mockSecondsRemaining<=0){stopMockTimer();finishMock(true);}
    },1000);
  }
  function stopMockTimer(){if(mockTimer)clearInterval(mockTimer);mockTimer=null;}

  function renderMockQuestion() {
    if(!activeMock)return;
    const body=ensureShell().querySelector('[data-revision-body]');
    const q=activeMock.questions[activeMock.current]; const saved=activeMock.answers[q.id]||'';
    body.innerHTML=`<div class="mock-session"><header class="mock-session-head"><div><span class="eyebrow">${subjectIcon(activeMock.subject)} ${subjectName(activeMock.subject)} · Paper ${activeMock.paper}</span><h3>Practice Mock</h3></div><div class="mock-timer"><small>Time remaining</small><strong data-mock-timer>${fmtTime(mockSecondsRemaining)}</strong></div></header><div class="mock-progress"><span style="width:${((activeMock.current+1)/activeMock.questions.length)*100}%"></span></div><div class="mock-session-layout"><nav class="mock-question-nav">${activeMock.questions.map((item,i)=>`<button type="button" data-mock-jump="${i}" class="${i===activeMock.current?'active':''} ${activeMock.answers[item.id]?.trim()?'answered':''}">${i+1}</button>`).join('')}</nav><section class="revision-panel mock-question"><div class="mock-question-meta"><span>${esc(q.topicCode)} · ${esc(q.topicTitle)}</span><strong>${q.marks} mark${q.marks===1?'':'s'}</strong></div><h3>${esc(q.prompt)}</h3><textarea rows="9" data-mock-answer placeholder="Write your answer here…">${esc(saved)}</textarea><div class="mock-question-actions"><button type="button" data-mock-prev ${activeMock.current===0?'disabled':''}>← Previous</button><span>Question ${activeMock.current+1} of ${activeMock.questions.length}</span>${activeMock.current===activeMock.questions.length-1?'<button type="button" class="primary" data-finish-mock>Finish mock</button>':'<button type="button" class="primary" data-mock-next>Next →</button>'}</div></section></div></div>`;
    const answer=body.querySelector('[data-mock-answer]'); answer?.focus();
    answer?.addEventListener('input',()=>{activeMock.answers[q.id]=answer.value;});
    const saveAnswer=()=>{if(answer)activeMock.answers[q.id]=answer.value;};
    body.querySelector('[data-mock-prev]')?.addEventListener('click',()=>{saveAnswer();activeMock.current=Math.max(0,activeMock.current-1);renderMockQuestion();});
    body.querySelector('[data-mock-next]')?.addEventListener('click',()=>{saveAnswer();activeMock.current=Math.min(activeMock.questions.length-1,activeMock.current+1);renderMockQuestion();});
    body.querySelector('[data-finish-mock]')?.addEventListener('click',()=>{saveAnswer();finishMock(false);});
    body.querySelectorAll('[data-mock-jump]').forEach(button=>button.addEventListener('click',()=>{saveAnswer();activeMock.current=Number(button.dataset.mockJump);renderMockQuestion();}));
  }

  function finishMock(timedOut=false) {
    if(!activeMock)return; stopMockTimer();
    activeMock.finishedAt=now(); activeMock.timedOut=timedOut;
    const results=activeMock.questions.map(q=>{const answer=activeMock.answers[q.id]||'';const marked=autoMark(q,answer);return{q,answer,...marked};});
    activeMock.score=results.reduce((n,r)=>n+r.score,0);
    activeMock.results=results.map(r=>({questionId:r.q.id,topicId:r.q.topicId,score:r.score,maxMarks:r.possible,answer:r.answer}));
    mocks.unshift({id:activeMock.id,subject:activeMock.subject,paper:activeMock.paper,score:activeMock.score,totalMarks:activeMock.totalMarks,startedAt:activeMock.startedAt,finishedAt:activeMock.finishedAt,timedOut,topicBreakdown:mockTopicBreakdown(results)});
    mocks=mocks.slice(0,30);
    results.forEach(r=>recordAttempt({topicId:r.q.topicId,score:r.score,maxMarks:r.possible,source:'mock',question:r.q,answer:r.answer}));
    save(KEYS.mocks,mocks); save(KEYS.mistakes,mistakes); save(KEYS.performance,performance);
    renderMockResults(results); renderHomePulse();
  }

  function mockTopicBreakdown(results) {
    const map={}; results.forEach(r=>{map[r.q.topicId]||={score:0,maxMarks:0};map[r.q.topicId].score+=r.score;map[r.q.topicId].maxMarks+=r.possible;}); return map;
  }

  function renderMockResults(results) {
    const body=ensureShell().querySelector('[data-revision-body]'); const percent=Math.round(activeMock.score/Math.max(1,activeMock.totalMarks)*100);
    const breakdown=mockTopicBreakdown(results);
    body.innerHTML=`<div class="mock-results"><section class="revision-dashboard-hero result"><div><span class="eyebrow">Mock complete</span><h3>${subjectIcon(activeMock.subject)} ${subjectName(activeMock.subject)} Paper ${activeMock.paper}</h3><p>${activeMock.timedOut?'Time expired. Your saved answers were marked.':'Your answers have been marked with indicative keyword matching.'}</p></div><div class="revision-dashboard-kpi"><strong>${activeMock.score}/${activeMock.totalMarks}</strong><span>${percent}% practice estimate</span></div></section><div class="revision-result-warning">This is an in-app practice estimate, not an official AQA mark or predicted grade. Extended answers should be checked against the indicative points below.</div><div class="mock-topic-results">${Object.entries(breakdown).map(([id,r])=>{const t=topicById(id);const p=Math.round(r.score/Math.max(1,r.maxMarks)*100);return`<article><span>${esc(t?.code||id)}</span><strong>${esc(t?.title||'Topic')}</strong><b>${r.score}/${r.maxMarks} · ${p}%</b></article>`;}).join('')}</div><div class="mock-result-questions">${results.map((r,i)=>`<details class="mock-result-question ${r.score<r.possible?'lost-marks':''}"><summary><span>Q${i+1} · ${esc(r.q.topicCode)}</span><strong>${r.score}/${r.possible}</strong></summary><h4>${esc(r.q.prompt)}</h4><p><b>Your answer:</b> ${esc(r.answer||'No answer')}</p><div><b>Indicative marking points:</b><ul>${r.q.marking.map(p=>`<li class="${r.matched.includes(p)?'matched':''}">${esc(p)}</li>`).join('')}</ul></div></details>`).join('')}</div><div class="mock-result-actions"><button type="button" class="button primary" data-results-mistakes>Review lost marks</button><button type="button" class="button" data-results-dashboard>Back to dashboard</button><button type="button" class="button" data-results-new>New mock</button></div></div>`;
    body.querySelector('[data-results-mistakes]')?.addEventListener('click',()=>{activeReviewId=null;renderView('mistakes');});
    body.querySelector('[data-results-dashboard]')?.addEventListener('click',()=>renderView('dashboard'));
    body.querySelector('[data-results-new]')?.addEventListener('click',()=>renderView('mock'));
  }

  function refreshVisible() {
    renderHomePulse(); renderAccessState();
    if (!shell || shell.hidden) return;
    if (activeView==='dashboard') renderDashboard();
  }

  function ingestExternalAttempt(detail) {
    if (!detail?.topicId || !Number.isFinite(Number(detail.maxMarks ?? detail.marks))) return;
    const topic=topicById(detail.topicId);
    const question=detail.question ? {
      id:detail.question.id || stableId(detail.topicId,detail.question.prompt||detail.question.question||'',0),
      topicId:detail.topicId, topicCode:topic?.code||detail.topicId, topicTitle:topic?.title||'', subject:topic?.subject||detail.subject,
      paper:Number(topic?.paper||detail.paper||1), prompt:detail.question.prompt||detail.question.question||'', marks:Number(detail.maxMarks||detail.marks||1),
      marking:normaliseMarking(detail.question.marking||detail.question.points||detail.marking), modelAnswer:detail.question.modelAnswer||detail.modelAnswer||''
    } : null;
    recordAttempt({topicId:detail.topicId,score:Number(detail.score||0),maxMarks:Number(detail.maxMarks||detail.marks||1),source:detail.source||'course-practice',question,answer:detail.answer||''});
  }

  window.addEventListener('gcse-performance-record', event=>ingestExternalAttempt(event.detail));
  window.addEventListener('gcse-access-changed',()=>renderAccessState());
  window.addEventListener('gcse-home-rendered',()=>{ensureHomeHub();refreshVisible();});
  window.addEventListener('storage',event=>{
    if(event.key===KEYS.performance)performance=parse(event.newValue,{topics:{},history:[]});
    if(event.key===KEYS.mistakes)mistakes=parse(event.newValue,[]);
    if(event.key===KEYS.mocks)mocks=parse(event.newValue,[]);
    if(Object.values(KEYS).includes(event.key))refreshVisible();
  });

  window.GCSE_REVISION_INTELLIGENCE = {
    openDashboard:()=>requireAccess('revision_tools','Personal Revision Dashboard',()=>openShell('dashboard')),
    openMistakes:()=>requireAccess('revision_tools','Mistake Bank',()=>openShell('mistakes')),
    openMock:()=>requireAccess('exam_tools','Mock Exam Mode',()=>openShell('mock')),
    recordAttempt:ingestExternalAttempt,
    getPerformance:()=>JSON.parse(JSON.stringify(performance)),
    getMistakes:()=>JSON.parse(JSON.stringify(mistakes)),
    getMocks:()=>JSON.parse(JSON.stringify(mocks)),
    questionBank
  };

  const boot=()=>{ensureHomeHub();ensureShell();renderAccessState();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

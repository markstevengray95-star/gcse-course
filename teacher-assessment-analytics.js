(() => {
  'use strict';

  const state = { assessmentId:null, data:null, view:'overview', loading:false };
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.GCSE_AUTH?.client || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const eligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const titleCase = v => String(v||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const fmt = v => v ? new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const asArray = v => Array.isArray(v) ? v : [];
  const scoreClass = value => value == null ? 'none' : value >= 75 ? 'secure' : value >= 50 ? 'developing' : 'support';
  const studentById = id => asArray(state.data?.students).find(s=>s.studentId===id) || null;
  const questionById = id => asArray(state.data?.questions).find(q=>q.questionId===id) || null;

  function decorateAssessmentCards(){
    if(!eligible()) return;
    document.querySelectorAll('#gcseTeacherAssessmentsModal .teacher-assessment-card').forEach(card=>{
      const source=card.querySelector('[data-assessment-toggle]');
      const actions=card.querySelector('.teacher-assessment-actions');
      const id=source?.dataset.assessmentToggle;
      if(!id||!actions||actions.querySelector(`[data-assessment-analytics="${id}"]`))return;
      const button=document.createElement('button');
      button.type='button';button.className='button assessment-analytics-button';button.dataset.assessmentAnalytics=id;
      button.innerHTML='<span aria-hidden="true">▦</span> Analytics';
      button.addEventListener('click',()=>openAnalytics(id));
      actions.insertBefore(button,actions.firstChild);
    });
  }

  function ensureModal(){
    let modal=document.getElementById('gcseAssessmentAnalyticsModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='gcseAssessmentAnalyticsModal';modal.className='assessment-analytics-modal';modal.hidden=true;
    modal.innerHTML=`<div class="assessment-analytics-backdrop" data-analytics-close></div><section class="assessment-analytics-shell" role="dialog" aria-modal="true" aria-labelledby="assessmentAnalyticsTitle"><header class="assessment-analytics-header"><div><span class="teacher-eyebrow">Teacher Platform · Phase 5</span><h2 id="assessmentAnalyticsTitle">Assessment analytics</h2><p>Class evidence, common missed points, intervention suggestions and teacher-reviewed marks.</p></div><button type="button" data-analytics-close aria-label="Close analytics">×</button></header><nav class="assessment-analytics-tabs" data-analytics-tabs></nav><div class="assessment-analytics-body" data-analytics-body></div></section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-analytics-close]').forEach(x=>x.addEventListener('click',closeAnalytics));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeAnalytics();});
    return modal;
  }

  async function openAnalytics(id){
    if(!eligible()){window.GCSE_ACCESS?.showUpgrade?.('teacher_tools','Assessment Analytics');return;}
    state.assessmentId=id;state.view='overview';state.data=null;
    const modal=ensureModal();modal.hidden=false;document.body.classList.add('assessment-analytics-open');
    modal.querySelector('[data-analytics-body]').innerHTML='<div class="teacher-loading">Calculating class assessment evidence…</div>';
    modal.querySelector('[data-analytics-tabs]').innerHTML='';
    await loadAnalytics();
  }

  function closeAnalytics(){const modal=document.getElementById('gcseAssessmentAnalyticsModal');if(modal)modal.hidden=true;document.body.classList.remove('assessment-analytics-open');}

  async function loadAnalytics(){
    const client=sb();if(!client||!state.assessmentId)return;
    state.loading=true;
    const {data,error}=await client.rpc('gcse_assessment_analytics',{p_assessment_id:state.assessmentId});
    state.loading=false;
    if(error){console.error('[Assessment Analytics]',error);const body=ensureModal().querySelector('[data-analytics-body]');body.innerHTML=`<div class="teacher-empty"><strong>Analytics could not be loaded.</strong><p>${esc(error.message||'Try again.')}</p></div>`;return;}
    state.data=data||{};render();
  }

  const tabs=[
    ['overview','Overview'],['questions','Questions'],['heatmap','Heatmap'],['interventions','Interventions'],['marking','Review marks'],['audit','Audit trail']
  ];

  function render(){
    const modal=ensureModal(),d=state.data||{},a=d.assessment||{};
    modal.querySelector('#assessmentAnalyticsTitle').textContent=a.title||'Assessment analytics';
    modal.querySelector('[data-analytics-tabs]').innerHTML=tabs.map(([id,label])=>`<button type="button" data-analytics-tab="${id}" class="${state.view===id?'active':''}">${label}</button>`).join('');
    modal.querySelectorAll('[data-analytics-tab]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.analyticsTab;render();}));
    const body=modal.querySelector('[data-analytics-body]');
    if(!Number(a.submitted||0)){
      body.innerHTML=`<div class="assessment-analytics-empty"><strong>No submitted assessments yet</strong><p>Question analytics, misconception patterns and intervention suggestions will appear once students submit.</p><div><span>${Number(a.assigned||0)}</span> assigned</div></div>`;
      return;
    }
    if(state.view==='questions')body.innerHTML=questionsHtml();
    else if(state.view==='heatmap')body.innerHTML=heatmapHtml();
    else if(state.view==='interventions')body.innerHTML=interventionsHtml();
    else if(state.view==='marking')body.innerHTML=markingHtml();
    else if(state.view==='audit')body.innerHTML=auditHtml();
    else body.innerHTML=overviewHtml();
    bindBody();
  }

  function overviewHtml(){
    const d=state.data,a=d.assessment||{},students=asArray(d.students),topics=asArray(d.topics),mis=asArray(d.misconceptions);
    const avg=students.length?Math.round(students.reduce((n,s)=>n+Number(s.percent||0),0)/students.length):null;
    const topWeak=topics[0];
    return `<section class="assessment-analytics-overview"><div class="assessment-analytics-kpis"><article><span>Assigned</span><strong>${Number(a.assigned||0)}</strong><small>students</small></article><article><span>Submitted</span><strong>${Number(a.submitted||0)}</strong><small>${Math.round(Number(a.submitted||0)*100/Math.max(1,Number(a.assigned||0)))}% completion</small></article><article><span>Class average</span><strong>${avg==null?'—':`${avg}%`}</strong><small>final marks</small></article><article><span>Support signals</span><strong>${asArray(d.interventions).length}</strong><small>suggested topic groups</small></article></div>
      <div class="assessment-analytics-grid"><section class="assessment-analytics-panel"><header><div><h3>Topic performance</h3><p>Final marks after any teacher adjustments.</p></div></header><div class="assessment-topic-bars">${topics.length?topics.map(t=>`<article><div><span>${esc(t.topicCode)} · ${esc(t.topicTitle)}</span><strong>${t.successRate}%</strong></div><div class="assessment-bar"><i style="width:${Math.max(0,Math.min(100,Number(t.successRate||0)))}%"></i></div><small>${t.earned}/${t.possible} marks across submitted responses</small></article>`).join(''):'<p>No topic evidence yet.</p>'}</div></section>
      <section class="assessment-analytics-panel"><header><div><h3>Most commonly missed marking points</h3><p>Patterns from the automated marking review; use professional judgement alongside them.</p></div></header><div class="assessment-misconception-list">${mis.length?mis.slice(0,8).map(m=>`<article><div><span>${esc(m.topicCode)} · Q${esc(m.number)}</span><strong>${esc(m.markingPoint)}</strong></div><b>${m.studentCount} student${Number(m.studentCount)===1?'':'s'}</b></article>`).join(''):'<p>No repeated missed marking points detected.</p>'}</div>${topWeak?`<div class="assessment-evidence-note"><strong>Lowest topic evidence:</strong> ${esc(topWeak.topicCode)} ${esc(topWeak.topicTitle)} at ${topWeak.successRate}% for this assessment.</div>`:''}</section></div></section>`;
  }

  function questionsHtml(){
    const rows=asArray(state.data?.questions);
    return `<section class="assessment-analytics-panel"><header><div><h3>Question-by-question analysis</h3><p>Class success rate is earned marks as a percentage of available marks; it is not an exam-board difficulty rating.</p></div></header><div class="assessment-table-wrap"><table class="assessment-question-table"><thead><tr><th>Q</th><th>Topic</th><th>Question</th><th>Marks</th><th>Answered</th><th>Class success</th><th>Full marks</th><th>0 marks</th><th>Adjusted</th></tr></thead><tbody>${rows.map(q=>`<tr><td><strong>${esc(q.number)}</strong></td><td>${esc(q.topicCode)}</td><td>${esc(q.prompt)}</td><td>${q.marks}</td><td>${q.answered}/${q.submissions}</td><td><span class="assessment-rate ${scoreClass(q.successRate)}">${q.successRate==null?'—':`${q.successRate}%`}</span></td><td>${q.fullMarkRate==null?'—':`${q.fullMarkRate}%`}</td><td>${q.zeroMarkRate==null?'—':`${q.zeroMarkRate}%`}</td><td>${Number(q.teacherAdjusted||0)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function heatmapHtml(){
    const questions=asArray(state.data?.questions),students=asArray(state.data?.students),mis=asArray(state.data?.misconceptions);
    const header=questions.map(q=>`<th title="${esc(q.prompt)}">Q${esc(q.number)}</th>`).join('');
    const rows=students.map(s=>{const map=new Map(asArray(s.review).map(r=>[r.id,r]));return `<tr><th><strong>${esc(s.displayName)}</strong><small>${s.percent}% overall</small></th>${questions.map(q=>{const r=map.get(q.questionId),mark=Number(r?.awarded||0),max=Number(r?.marks||q.marks||1),p=Math.round(mark*100/Math.max(1,max));return `<td class="assessment-heat ${scoreClass(p)}" title="${esc(s.displayName)} · Q${esc(q.number)} · ${mark}/${max}"><span>${mark}/${max}</span></td>`;}).join('')}</tr>`;}).join('');
    return `<section class="assessment-analytics-panel"><header><div><h3>Student × question heatmap</h3><p>Cells show marks awarded. Red/amber/green bands are learning-evidence signals, not labels about students.</p></div></header><div class="assessment-table-wrap"><table class="assessment-heatmap"><thead><tr><th>Student</th>${header}</tr></thead><tbody>${rows}</tbody></table></div></section><section class="assessment-analytics-panel"><header><div><h3>Misconception / missed-point heatmap</h3><p>Repeated marking points that were absent from submitted responses.</p></div></header><div class="assessment-misconception-grid">${mis.length?mis.map(m=>`<article class="${Number(m.missRate)>=60?'high':Number(m.missRate)>=30?'medium':'low'}"><span>${esc(m.topicCode)} · Q${esc(m.number)}</span><strong>${esc(m.markingPoint)}</strong><div><b>${m.missRate}%</b><small>${m.studentCount} student${Number(m.studentCount)===1?'':'s'}</small></div></article>`).join(''):'<p>No common missed points yet.</p>'}</div></section>`;
  }

  function interventionsHtml(){
    const groups=asArray(state.data?.interventions);
    return `<section class="assessment-analytics-panel"><header><div><h3>Suggested intervention groups</h3><p>Generated from assessment evidence only. Groups are suggestions for planning, not diagnoses or permanent labels.</p></div></header><div class="assessment-intervention-list">${groups.length?groups.map(g=>`<article><header><div><span>${esc(g.topicCode)}</span><strong>${esc(g.topicTitle)}</strong></div><b>${g.studentCount} student${Number(g.studentCount)===1?'':'s'}</b></header><div class="assessment-intervention-students">${asArray(g.students).map(s=>`<span><strong>${esc(s.displayName)}</strong><small>${s.earned}/${s.possible} · ${s.percent}%</small></span>`).join('')}</div><div class="assessment-intervention-action"><p><b>Evidence:</b> ${esc(g.evidenceRule)}</p><p><b>Suggested next step:</b> ${esc(g.suggestedAction)}</p><button type="button" class="button" data-copy-intervention="${esc(g.id)}">Copy student list</button></div></article>`).join(''):'<div class="teacher-empty compact"><strong>No topic intervention groups suggested.</strong><p>No submitted student is currently below the Phase 5 grouping threshold on an assessed topic.</p></div>'}</div></section>`;
  }

  function markingHtml(){
    const students=asArray(state.data?.students);
    return `<section class="assessment-analytics-panel"><header><div><h3>Teacher mark review</h3><p>Adjust an automatically awarded question mark when professional judgement is needed. Every change requires a reason and is logged.</p></div></header><div class="assessment-mark-review-list">${students.map(s=>`<details><summary><div><strong>${esc(s.displayName)}</strong><small>${esc(s.email||'')}</small></div><span>${s.score}/${s.totalMarks} · ${s.percent}%</span><b>${Number(s.adjustmentCount||0)} adjustment${Number(s.adjustmentCount||0)===1?'':'s'}</b></summary><div class="assessment-mark-questions">${asArray(s.review).map(r=>{const adjusted=Boolean(r.teacherAdjusted),auto=adjusted?Number(r.autoAwarded??r.awarded):Number(r.awarded||0);return `<article><div><span>Q${esc(r.number)} · ${esc(r.topicCode)}</span><strong>${esc(r.prompt)}</strong><small>${esc(r.answer||'No answer')}</small></div><div class="assessment-mark-score"><b>${Number(r.awarded||0)}/${Number(r.marks||1)}</b>${adjusted?`<em>Auto ${auto}/${Number(r.marks||1)}</em>`:''}<button type="button" class="button" data-adjust-attempt="${esc(s.attemptId)}" data-adjust-question="${esc(r.id)}">Adjust mark</button></div></article>`;}).join('')}</div></details>`).join('')}</div></section>`;
  }

  function auditHtml(){
    const rows=asArray(state.data?.adjustments);
    return `<section class="assessment-analytics-panel"><header><div><h3>Mark adjustment audit trail</h3><p>Original automated marks are retained even after later teacher changes.</p></div></header><div class="assessment-audit-list">${rows.length?rows.map(x=>{const student=studentById(x.studentId),q=questionById(x.questionId);return `<article><div><span>${fmt(x.createdAt)} · ${esc(student?.displayName||'Student')} · Q${esc(q?.number||'')}</span><strong>${x.previousMark}/${x.maxMarks} → ${x.newMark}/${x.maxMarks}</strong><small>Original automated mark ${x.autoMark}/${x.maxMarks}</small></div><p>${esc(x.reason)}</p></article>`;}).join(''):'<div class="teacher-empty compact">No teacher mark adjustments have been made.</div>'}</div></section>`;
  }

  function bindBody(){
    const body=ensureModal().querySelector('[data-analytics-body]');
    body.querySelectorAll('[data-copy-intervention]').forEach(btn=>btn.addEventListener('click',async()=>{
      const group=asArray(state.data?.interventions).find(g=>g.id===btn.dataset.copyIntervention);if(!group)return;
      const text=asArray(group.students).map(s=>s.displayName||s.email).join('\n');
      try{await navigator.clipboard.writeText(text);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy student list',1200);}catch{btn.textContent='Copy unavailable';}
    }));
    body.querySelectorAll('[data-adjust-attempt]').forEach(btn=>btn.addEventListener('click',()=>openAdjustment(btn.dataset.adjustAttempt,btn.dataset.adjustQuestion)));
  }

  function ensureAdjustmentModal(){
    let modal=document.getElementById('gcseAssessmentAdjustmentModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='gcseAssessmentAdjustmentModal';modal.className='assessment-adjustment-modal';modal.hidden=true;
    modal.innerHTML=`<div class="assessment-adjustment-backdrop" data-adjust-close></div><section class="assessment-adjustment-shell" role="dialog" aria-modal="true" aria-labelledby="assessmentAdjustmentTitle"><header><div><span class="teacher-eyebrow">Teacher mark review</span><h2 id="assessmentAdjustmentTitle">Adjust question mark</h2></div><button type="button" data-adjust-close aria-label="Close">×</button></header><div data-adjust-body></div></section>`;
    document.body.appendChild(modal);modal.querySelectorAll('[data-adjust-close]').forEach(x=>x.addEventListener('click',()=>modal.hidden=true));return modal;
  }

  function openAdjustment(attemptId,questionId){
    const student=asArray(state.data?.students).find(s=>s.attemptId===attemptId),row=asArray(student?.review).find(r=>r.id===questionId);if(!student||!row)return;
    const modal=ensureAdjustmentModal(),auto=Number(row.autoAwarded??row.awarded??0),current=Number(row.awarded||0),max=Number(row.marks||1);modal.hidden=false;
    modal.querySelector('[data-adjust-body]').innerHTML=`<div class="assessment-adjustment-context"><span>${esc(student.displayName)} · Q${esc(row.number)} · ${esc(row.topicCode)}</span><h3>${esc(row.prompt)}</h3><p><b>Student answer:</b> ${esc(row.answer||'No answer')}</p><div><span>Automated mark <strong>${auto}/${max}</strong></span><span>Current final mark <strong>${current}/${max}</strong></span></div></div><form data-adjust-form><label>New mark<input type="number" name="new_mark" min="0" max="${max}" value="${current}" required></label><label>Reason for change<textarea name="reason" rows="3" maxlength="500" required placeholder="e.g. Accept equivalent wording; response meets marking point 2."></textarea></label><div class="assessment-adjustment-actions"><button type="submit" class="button primary">Save adjusted mark</button><button type="button" class="button" data-adjust-cancel>Cancel</button></div><p class="assessment-adjustment-message" data-adjust-message hidden></p></form>`;
    const form=modal.querySelector('[data-adjust-form]');form.querySelector('[data-adjust-cancel]').addEventListener('click',()=>modal.hidden=true);form.addEventListener('submit',e=>saveAdjustment(e,attemptId,questionId));form.elements.reason.focus();
  }

  async function saveAdjustment(event,attemptId,questionId){
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),message=form.querySelector('[data-adjust-message]');const fd=new FormData(form);
    const newMark=Number(fd.get('new_mark')),reason=String(fd.get('reason')||'').trim();if(reason.length<3){message.hidden=false;message.textContent='Add a short reason for the mark change.';return;}
    button.disabled=true;button.textContent='Saving…';
    const {data,error}=await sb().rpc('gcse_adjust_assessment_mark',{p_attempt_id:attemptId,p_question_id:questionId,p_new_mark:newMark,p_reason:reason});
    button.disabled=false;button.textContent='Save adjusted mark';
    if(error){message.hidden=false;message.textContent=error.message==='mark_unchanged'?'Choose a different mark before saving.':(error.message||'Mark could not be adjusted.');return;}
    ensureAdjustmentModal().hidden=true;
    window.dispatchEvent(new CustomEvent('gcse-assessment-mark-adjusted',{detail:{assessmentId:state.assessmentId,attemptId,questionId,attempt:data?.attempt||null}}));
    await loadAnalytics();
    try{await window.GCSE_TEACHER_ASSESSMENTS?.refresh?.();}catch{}
  }

  function boot(){
    ensureModal();ensureAdjustmentModal();decorateAssessmentCards();
    const observer=new MutationObserver(decorateAssessmentCards);observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('gcse-auth-changed',()=>setTimeout(decorateAssessmentCards,0));
    window.addEventListener('gcse-access-changed',()=>setTimeout(decorateAssessmentCards,0));
  }

  window.GCSE_ASSESSMENT_ANALYTICS={open:openAnalytics,refresh:loadAnalytics};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
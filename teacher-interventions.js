(() => {
  'use strict';

  const state = {
    currentAssessmentId: null,
    teacher: [],
    student: [],
    assignmentIds: new Set(),
    activeRun: null,
    saveTimer: null,
    loadingTeacher: false,
    loadingStudent: false
  };

  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const eligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const asArray = v => Array.isArray(v) ? v : [];
  const fmt = v => v ? new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const localDateTime = d => {
    const z = new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return z.toISOString().slice(0,16);
  };
  const gainLabel = value => value == null ? '—' : `${Number(value)>0?'+':''}${Number(value)} pp`;

  function rememberAnalyticsSource(event){
    const button=event.target.closest?.('[data-assessment-analytics]');
    if(button?.dataset.assessmentAnalytics) state.currentAssessmentId=button.dataset.assessmentAnalytics;
  }

  function wrapAnalyticsApi(){
    const api=window.GCSE_ASSESSMENT_ANALYTICS;
    if(!api || api.__phase6Wrapped) return;
    const original=api.open;
    api.open=id=>{state.currentAssessmentId=id;return original?.(id);};
    api.__phase6Wrapped=true;
  }

  function decorateAnalyticsInterventions(){
    if(!eligible()) return;
    wrapAnalyticsApi();
    const modal=document.getElementById('gcseAssessmentAnalyticsModal');
    if(!modal || modal.hidden) return;
    modal.querySelectorAll('.assessment-intervention-list > article').forEach(card=>{
      const copy=card.querySelector('[data-copy-intervention]');
      const action=card.querySelector('.assessment-intervention-action');
      if(!copy||!action||action.querySelector('[data-create-targeted-intervention]')) return;
      const raw=String(copy.dataset.copyIntervention||'');
      const topicId=raw.startsWith('topic:')?raw.slice(6):raw;
      if(!topicId) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='button primary phase6-create-intervention';
      button.dataset.createTargetedIntervention=topicId;
      button.textContent='Create targeted follow-up';
      button.addEventListener('click',()=>openCreateIntervention(state.currentAssessmentId,topicId,card));
      copy.insertAdjacentElement('afterend',button);
    });
  }

  function ensureTeacherButton(){
    const header=document.querySelector('#gcseTeacherPlatformModal .teacher-platform-header');
    if(!header||!eligible()||document.getElementById('gcseTeacherInterventionsButton')) return;
    const button=document.createElement('button');
    button.id='gcseTeacherInterventionsButton';
    button.type='button';
    button.className='teacher-interventions-open';
    button.textContent='Interventions';
    button.addEventListener('click',openTeacherDashboard);
    const close=header.querySelector('.teacher-close');
    (close||header).insertAdjacentElement(close?'beforebegin':'beforeend',button);
  }

  function ensureCreateModal(){
    let modal=document.getElementById('gcseInterventionCreateModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='gcseInterventionCreateModal';
    modal.className='gcse-intervention-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="gcse-intervention-backdrop" data-intervention-create-close></div>
      <section class="gcse-intervention-dialog compact" role="dialog" aria-modal="true" aria-labelledby="gcseInterventionCreateTitle">
        <header><div><span class="teacher-eyebrow">Teacher Platform · Phase 6</span><h2 id="gcseInterventionCreateTitle">Create targeted follow-up</h2><p>Turn assessment evidence into guided practice and an independent mastery check.</p></div><button type="button" data-intervention-create-close aria-label="Close">×</button></header>
        <div data-intervention-create-body></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-intervention-create-close]').forEach(x=>x.addEventListener('click',()=>modal.hidden=true));
    return modal;
  }

  function openCreateIntervention(assessmentId,topicId,card){
    if(!eligible()){window.GCSE_ACCESS?.showUpgrade?.('teacher_tools','Targeted interventions');return;}
    if(!assessmentId){alert('Open this assessment from the assessment dashboard first.');return;}
    const code=card?.querySelector('header span')?.textContent?.trim()||topicId.toUpperCase();
    const title=card?.querySelector('header strong')?.textContent?.trim()||'Targeted follow-up';
    const students=card?.querySelectorAll('.assessment-intervention-students > span').length||0;
    const due=new Date();due.setDate(due.getDate()+3);due.setHours(16,0,0,0);
    const modal=ensureCreateModal();
    modal.hidden=false;
    const body=modal.querySelector('[data-intervention-create-body]');
    body.innerHTML=`<div class="gcse-intervention-source"><span>${esc(code)}</span><strong>${esc(title)}</strong><small>${students} student${students===1?'':'s'} currently in this evidence group</small></div>
      <form data-intervention-create-form class="gcse-intervention-form">
        <label class="wide">Assignment title<input name="title" maxlength="160" value="${esc(`${code} ${title} targeted follow-up`)}" required></label>
        <label>Target mastery score<input name="target_score" type="number" min="0" max="100" value="70" required><small>This is a follow-up target, not an official grade boundary.</small></label>
        <label>Weak questions to revisit<select name="max_questions"><option value="1">1 question</option><option value="2">2 questions</option><option value="3" selected>3 questions</option><option value="4">4 questions</option><option value="5">5 questions</option></select></label>
        <label>Due date<input name="due_at" type="datetime-local" value="${localDateTime(due)}" required></label>
        <label>Publish<select name="status"><option value="published">Publish to students</option><option value="draft">Save as draft</option></select></label>
        <div class="wide gcse-intervention-explainer"><strong>What students receive</strong><span>1. A guided reflection using their own previous response.</span><span>2. The question again as an independent mastery check.</span><span>3. Immediate evidence showing whether the topic result improved.</span></div>
        <div class="wide gcse-intervention-actions"><button class="button primary" type="submit">Create follow-up</button><button class="button" type="button" data-intervention-create-cancel>Cancel</button></div>
        <p class="gcse-intervention-message wide" data-intervention-create-message hidden></p>
      </form>`;
    const form=body.querySelector('[data-intervention-create-form]');
    form.querySelector('[data-intervention-create-cancel]').addEventListener('click',()=>modal.hidden=true);
    form.addEventListener('submit',event=>createIntervention(event,assessmentId,topicId));
  }

  async function createIntervention(event,assessmentId,topicId){
    event.preventDefault();
    const form=event.currentTarget,client=sb(),message=form.querySelector('[data-intervention-create-message]');
    if(!client)return;
    const fd=new FormData(form);
    const due=new Date(String(fd.get('due_at')));
    if(Number.isNaN(due.getTime())||due.getTime()<=Date.now()){message.hidden=false;message.textContent='Choose a future due date.';return;}
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Creating…';
    const options={
      title:String(fd.get('title')||'').trim(),
      targetScore:Number(fd.get('target_score')||70),
      maxQuestions:Number(fd.get('max_questions')||3),
      dueAt:due.toISOString(),
      status:String(fd.get('status')||'published')
    };
    const {data,error}=await client.rpc('gcse_create_targeted_intervention',{
      p_assessment_id:assessmentId,p_topic_id:topicId,p_options:options
    });
    button.disabled=false;button.textContent='Create follow-up';
    if(error){
      message.hidden=false;
      message.className='gcse-intervention-message wide error';
      message.textContent=error.message==='active_intervention_exists'
        ? 'There is already an active follow-up for this topic and assessment. Open Interventions to review it.'
        : error.message==='no_students_need_intervention'
          ? 'No students currently meet the evidence threshold for this targeted follow-up.'
          : (error.message||'The intervention could not be created.');
      return;
    }
    message.hidden=false;message.className='gcse-intervention-message wide success';
    message.textContent=`Created for ${Number(data?.studentCount||0)} student${Number(data?.studentCount||0)===1?'':'s'}.`;
    try{await window.GCSE_TEACHER_HOMEWORK?.refresh?.();}catch{}
    setTimeout(()=>{ensureCreateModal().hidden=true;openTeacherDashboard();},450);
  }

  function ensureTeacherModal(){
    let modal=document.getElementById('gcseTeacherInterventionsModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='gcseTeacherInterventionsModal';
    modal.className='gcse-intervention-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="gcse-intervention-backdrop" data-teacher-intervention-close></div>
      <section class="gcse-intervention-dialog teacher" role="dialog" aria-modal="true" aria-labelledby="gcseTeacherInterventionTitle">
        <header><div><span class="teacher-eyebrow">Teacher Platform · Phase 6</span><h2 id="gcseTeacherInterventionTitle">Targeted interventions</h2><p>Follow assessment gaps through to re-test evidence and improvement.</p></div><button type="button" data-teacher-intervention-close aria-label="Close">×</button></header>
        <div class="gcse-intervention-body" data-teacher-intervention-body></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-teacher-intervention-close]').forEach(x=>x.addEventListener('click',()=>modal.hidden=true));
    return modal;
  }

  async function loadTeacherInterventions(){
    const client=sb();if(!client||!eligible())return [];
    state.loadingTeacher=true;
    const {data,error}=await client.rpc('gcse_teacher_interventions',{p_assessment_id:null});
    state.loadingTeacher=false;
    if(error)throw error;
    state.teacher=asArray(data);
    return state.teacher;
  }

  async function openTeacherDashboard(){
    if(!eligible()){window.GCSE_ACCESS?.showUpgrade?.('teacher_tools','Targeted interventions');return;}
    const modal=ensureTeacherModal();modal.hidden=false;
    const body=modal.querySelector('[data-teacher-intervention-body]');
    body.innerHTML='<div class="teacher-loading">Loading intervention evidence…</div>';
    try{await loadTeacherInterventions();renderTeacherDashboard();}
    catch(error){console.error('[GCSE Interventions]',error);body.innerHTML=`<div class="teacher-empty"><strong>Interventions could not be loaded.</strong><p>${esc(error.message||'Try again.')}</p></div>`;}
  }

  function renderTeacherDashboard(){
    const body=ensureTeacherModal().querySelector('[data-teacher-intervention-body]');
    const plans=state.teacher;
    const summaries=plans.map(x=>x.summary||{});
    const assigned=summaries.reduce((n,s)=>n+Number(s.assigned||0),0);
    const submitted=summaries.reduce((n,s)=>n+Number(s.submitted||0),0);
    const improved=summaries.reduce((n,s)=>n+Number(s.improved||0),0);
    const gains=summaries.map(s=>s.averageGain).filter(v=>v!=null).map(Number);
    const avgGain=gains.length?Math.round(gains.reduce((a,b)=>a+b,0)/gains.length):null;
    body.innerHTML=`<div class="gcse-intervention-kpis">
        <article><span>Plans</span><strong>${plans.length}</strong><small>targeted follow-ups</small></article>
        <article><span>Students assigned</span><strong>${assigned}</strong><small>across intervention plans</small></article>
        <article><span>Mastery checks</span><strong>${submitted}</strong><small>submitted</small></article>
        <article><span>Improved</span><strong>${improved}</strong><small>higher than baseline</small></article>
        <article><span>Average gain</span><strong>${avgGain==null?'—':gainLabel(avgGain)}</strong><small>submitted follow-ups</small></article>
      </div>
      <div class="gcse-intervention-teacher-list">${plans.length?plans.map(teacherCard).join(''):'<div class="teacher-empty"><strong>No targeted interventions yet</strong><p>Create one from an assessment’s Analytics → Interventions tab.</p></div>'}</div>`;
    body.querySelectorAll('[data-intervention-detail]').forEach(btn=>btn.addEventListener('click',()=>{
      const detail=body.querySelector(`[data-intervention-students="${btn.dataset.interventionDetail}"]`);if(detail)detail.hidden=!detail.hidden;
    }));
    body.querySelectorAll('[data-intervention-status]').forEach(btn=>btn.addEventListener('click',()=>setInterventionStatus(btn.dataset.interventionStatus,btn.dataset.nextStatus)));
  }

  function teacherCard(plan){
    const s=plan.summary||{},students=asArray(plan.students);
    const next=plan.status==='draft'?'published':plan.status==='published'?'closed':'published';
    const action=plan.status==='draft'?'Publish':plan.status==='published'?'Close':'Reopen';
    const impact=s.averageRetest==null?'Awaiting mastery checks':`${s.averageBaseline}% → ${s.averageRetest}% (${gainLabel(s.averageGain)})`;
    return `<article class="gcse-intervention-teacher-card">
      <div class="gcse-intervention-card-head"><div><span>${esc(plan.className||'Class')} · ${esc(plan.topicCode||'Topic')}</span><strong>${esc(plan.title)}</strong><small>${esc(plan.assessmentTitle||'Assessment')} · due ${esc(fmt(plan.dueAt))}</small></div><b class="gcse-intervention-state ${esc(plan.status)}">${esc(plan.status)}</b></div>
      <div class="gcse-intervention-impact"><span><b>${Number(s.assigned||0)}</b> assigned</span><span><b>${Number(s.submitted||0)}</b> submitted</span><span><b>${Number(s.improved||0)}</b> improved</span><span><b>${Number(s.targetMet||0)}</b> target met</span><strong>${esc(impact)}</strong></div>
      <p class="gcse-intervention-note">Improvement compares this short follow-up mastery check with the same topic in the source assessment; it is not an official predicted grade.</p>
      <div class="gcse-intervention-card-actions"><button class="button" type="button" data-intervention-detail="${plan.id}">View students</button><button class="button" type="button" data-intervention-status="${plan.id}" data-next-status="${next}">${action}</button></div>
      <div class="gcse-intervention-students-table" data-intervention-students="${plan.id}" hidden>${students.length?`<div class="gcse-intervention-student-row header"><span>Student</span><span>Baseline</span><span>Re-test</span><span>Change</span><span>Status</span></div>${students.map(studentRow).join('')}`:'<span>No targeted students.</span>'}</div>
    </article>`;
  }

  function studentRow(s){
    const status=s.status==='submitted'?(s.targetMet?'Target met':s.improved?'Improved':'Follow-up complete'):s.status==='in_progress'?'In progress':'Not started';
    return `<div class="gcse-intervention-student-row"><span><strong>${esc(s.displayName||'Student')}</strong><small>${esc(s.email||'')}</small></span><span>${Number(s.baselinePercent||0)}%</span><span>${s.retestPercent==null?'—':`${Number(s.retestPercent)}%`}</span><span>${gainLabel(s.improvementPoints)}</span><span>${esc(status)}</span></div>`;
  }

  async function setInterventionStatus(id,status){
    const {error}=await sb().rpc('gcse_set_intervention_status',{p_intervention_id:id,p_status:status});
    if(error){alert(error.message||'Intervention status could not be changed.');return;}
    try{await window.GCSE_TEACHER_HOMEWORK?.refresh?.();}catch{}
    await loadTeacherInterventions();renderTeacherDashboard();
  }

  async function loadStudentInterventions(){
    const client=sb();if(!client||!session()?.user||eligible()){state.student=[];state.assignmentIds=new Set();return [];}
    state.loadingStudent=true;
    const {data,error}=await client.rpc('gcse_student_interventions');
    state.loadingStudent=false;
    if(error){console.warn('[GCSE Interventions] student load failed',error);return [];}
    state.student=asArray(data);
    state.assignmentIds=new Set(state.student.map(x=>String(x.assignmentId||'')).filter(Boolean));
    return state.student;
  }

  async function renderStudentPanel(){
    const content=document.getElementById('gcseAuthContent');
    if(!content||!session()?.user||eligible())return;
    content.querySelector('[data-student-interventions]')?.remove();
    await loadStudentInterventions();
    if(!state.student.length)return;
    const panel=document.createElement('section');
    panel.className='student-intervention-panel';
    panel.dataset.studentInterventions='true';
    const pending=state.student.filter(x=>x.status==='published'&&x.attempt?.status!=='submitted').length;
    panel.innerHTML=`<div class="student-intervention-head"><div><span class="gcse-auth-eyebrow">Targeted follow-up</span><h3>Your intervention work</h3><p>Use your earlier evidence to improve, then complete the independent check.</p></div><strong>${pending}</strong></div><div class="student-intervention-list">${state.student.map(studentCard).join('')}</div>`;
    content.querySelector('#gcseSignOut')?.insertAdjacentElement('beforebegin',panel);
    panel.querySelectorAll('[data-open-intervention]').forEach(btn=>btn.addEventListener('click',()=>openStudentIntervention(btn.dataset.openIntervention)));
  }

  function studentCard(item){
    const at=item.attempt;
    let status='Ready',action='Start follow-up';
    if(at?.status==='in_progress'){status='In progress';action='Continue';}
    if(at?.status==='submitted'){status=`${at.percent}% · ${gainLabel(at.improvementPoints)}`;action='Review';}
    if(item.status==='closed'&&!at){status='Closed';action='';}
    return `<article class="student-intervention-card"><div><span>${esc(item.topicCode)} · due ${esc(fmt(item.dueAt))}</span><strong>${esc(item.title)}</strong><p>Baseline evidence: ${Number(item.baselinePercent||0)}% · follow-up target ${Number(item.targetScore||0)}%</p><small>${esc(status)}</small></div>${action?`<button type="button" data-open-intervention="${item.id}">${esc(action)}</button>`:''}</article>`;
  }

  function ensureRunModal(){
    let modal=document.getElementById('gcseInterventionRunModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='gcseInterventionRunModal';
    modal.className='gcse-intervention-run-modal';
    modal.hidden=true;
    modal.innerHTML='<div class="gcse-intervention-run-shell"><header data-intervention-run-header></header><div data-intervention-run-body></div></div>';
    document.body.appendChild(modal);
    return modal;
  }

  async function openStudentIntervention(id){
    document.getElementById('gcseAuthClose')?.click();
    const {data,error}=await sb().rpc('gcse_start_intervention',{p_intervention_id:id});
    if(error){alert(error.message==='intervention_closed'?'This follow-up is closed.':(error.message||'The follow-up could not be opened.'));return;}
    state.activeRun=data;
    renderStudentRun();
  }

  async function openStudentByAssignment(assignmentId){
    if(!state.student.length)await loadStudentInterventions();
    const item=state.student.find(x=>String(x.assignmentId)===String(assignmentId));
    if(!item){alert('This targeted follow-up is not available.');return;}
    await openStudentIntervention(item.id);
  }

  function renderStudentRun(){
    const modal=ensureRunModal(),run=state.activeRun,i=run?.intervention,at=run?.attempt;
    if(!i||!at)return;
    modal.hidden=false;document.body.classList.add('gcse-intervention-running');
    if(at.status==='submitted'){renderStudentResult(at);return;}
    const answers=at.answers&&typeof at.answers==='object'?at.answers:{};
    const tasks=asArray(i.tasks);
    modal.querySelector('[data-intervention-run-header]').innerHTML=`<div><span>Targeted follow-up · ${esc(i.topicCode)}</span><h2>${esc(i.title)}</h2><small>Baseline ${Number(i.baselinePercent||0)}% · target ${Number(i.targetScore||0)}%</small></div><button type="button" data-intervention-run-close aria-label="Close">×</button>`;
    modal.querySelector('[data-intervention-run-body]').innerHTML=`<div class="student-intervention-guidance"><strong>Two-step follow-up</strong><p>First improve your thinking using the guided reflection. Then answer the mastery-check question independently. Only the mastery-check questions count towards the follow-up score.</p></div>
      <div class="student-intervention-tasks">${tasks.map(t=>taskHtml(t,answers[t.id]||'')).join('')}</div>
      <div class="student-intervention-submit"><span>Your answers save while you work.</span><button type="button" class="button primary" data-submit-intervention>Submit mastery check</button></div>`;
    modal.querySelector('[data-intervention-run-close]').addEventListener('click',closeStudentRun);
    modal.querySelectorAll('[data-intervention-answer]').forEach(el=>el.addEventListener('input',scheduleSave));
    modal.querySelectorAll('[data-intervention-choice]').forEach(el=>el.addEventListener('change',scheduleSave));
    modal.querySelector('[data-submit-intervention]').addEventListener('click',submitStudentIntervention);
  }

  function taskHtml(task,value){
    if(task.stage==='practice'){
      return `<article class="student-intervention-task practice"><div class="student-intervention-task-title"><span>Guided reflection · ${esc(task.number)}</span><b>Practice</b></div><h3>${esc(task.sourcePrompt||task.prompt)}</h3>${task.previousAnswer?`<blockquote><span>Your earlier response</span>${esc(task.previousAnswer)}</blockquote>`:''}<p>${esc(task.prompt)}</p><ul>${asArray(task.guidance).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><textarea rows="4" data-intervention-answer data-task-id="${esc(task.id)}" placeholder="Write your improvement plan…">${esc(value)}</textarea></article>`;
    }
    const answer=task.type==='mcq'&&asArray(task.options).length
      ? `<div class="student-intervention-options">${asArray(task.options).map(opt=>`<label><input type="radio" data-intervention-choice data-task-id="${esc(task.id)}" name="intervention-${esc(task.id)}" value="${esc(opt)}" ${String(value)===String(opt)?'checked':''}><span>${esc(opt)}</span></label>`).join('')}</div>`
      : `<textarea rows="${Number(task.marks||1)>=4?7:4}" data-intervention-answer data-task-id="${esc(task.id)}" placeholder="Answer independently…">${esc(value)}</textarea>`;
    return `<article class="student-intervention-task retest"><div class="student-intervention-task-title"><span>Mastery check · ${esc(task.number)}</span><b>${Number(task.marks||1)} mark${Number(task.marks||1)===1?'':'s'}</b></div><h3>${esc(task.prompt)}</h3>${answer}</article>`;
  }

  function collectRunAnswers(){
    const modal=document.getElementById('gcseInterventionRunModal'),answers={};
    modal?.querySelectorAll('[data-intervention-answer]').forEach(el=>answers[el.dataset.taskId]=el.value);
    modal?.querySelectorAll('[data-intervention-choice]:checked').forEach(el=>answers[el.dataset.taskId]=el.value);
    return answers;
  }

  function scheduleSave(){
    clearTimeout(state.saveTimer);
    state.saveTimer=setTimeout(saveRunAnswers,700);
  }

  async function saveRunAnswers(){
    const id=state.activeRun?.intervention?.id;
    if(!id||state.activeRun?.attempt?.status==='submitted')return;
    const {error}=await sb().rpc('gcse_save_intervention_answers',{p_intervention_id:id,p_answers:collectRunAnswers()});
    if(error)console.warn('[GCSE Interventions] autosave failed',error);
  }

  async function submitStudentIntervention(){
    const id=state.activeRun?.intervention?.id;if(!id)return;
    if(!confirm('Submit this mastery check? Your answers cannot be changed afterwards.'))return;
    clearTimeout(state.saveTimer);
    const button=document.querySelector('#gcseInterventionRunModal [data-submit-intervention]');
    if(button){button.disabled=true;button.textContent='Submitting…';}
    const {data,error}=await sb().rpc('gcse_submit_intervention',{p_intervention_id:id,p_answers:collectRunAnswers()});
    if(error){if(button){button.disabled=false;button.textContent='Submit mastery check';}alert(error.message||'The mastery check could not be submitted.');return;}
    state.activeRun.attempt=data;
    asArray(data?.review).forEach(row=>window.dispatchEvent(new CustomEvent('gcse-performance-record',{detail:{
      topicId:String(row.topicId||state.activeRun?.intervention?.topicId||''),
      score:Number(row.awarded||0),maxMarks:Number(row.marks||1),source:'targeted-intervention',
      answer:String(row.answer||''),question:{id:`targeted-intervention:${id}:${row.id||''}`,prompt:String(row.prompt||''),points:asArray(row.markingPoints),marking:asArray(row.markingPoints)}
    }})));
    window.dispatchEvent(new CustomEvent('gcse-intervention-submitted',{detail:{interventionId:id,percent:data?.percent,baselinePercent:data?.baselinePercent,improvementPoints:data?.improvementPoints}}));
    renderStudentResult(data);
    await renderStudentPanel();
  }

  function renderStudentResult(result){
    const modal=ensureRunModal(),i=state.activeRun?.intervention||{},review=asArray(result?.review);
    const baseline=Number(result?.baselinePercent??i.baselinePercent??0);
    const percent=Number(result?.percent??0);
    const gain=Number(result?.improvementPoints??(percent-baseline));
    modal.querySelector('[data-intervention-run-header]').innerHTML=`<div><span>Follow-up complete</span><h2>${esc(i.title||'Targeted follow-up')}</h2><small>${esc(i.topicCode||'Topic')}</small></div><button type="button" data-intervention-run-close aria-label="Close">×</button>`;
    modal.querySelector('[data-intervention-run-body]').innerHTML=`<section class="student-intervention-result"><span>Mastery-check evidence</span><div class="student-intervention-result-grid"><article><small>Baseline</small><strong>${baseline}%</strong></article><article><small>Re-test</small><strong>${percent}%</strong></article><article><small>Change</small><strong>${gainLabel(gain)}</strong></article></div><p>${result?.targetMet?'You met the follow-up target.':'Your teacher can use this evidence to decide the next practice step.'} This short check is learning evidence, not an official predicted grade.</p></section>
      <section class="student-intervention-review"><h3>Mastery-check review</h3>${review.map(r=>`<article><div><span>${esc(r.number||'')}</span><b>${Number(r.awarded||0)}/${Number(r.marks||1)}</b></div><strong>${esc(r.prompt)}</strong><p><b>Your answer:</b> ${esc(r.answer||'No answer')}</p><ul>${asArray(r.markingPoints).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></article>`).join('')}</section>`;
    modal.querySelector('[data-intervention-run-close]').addEventListener('click',closeStudentRun);
  }

  function closeStudentRun(){
    clearTimeout(state.saveTimer);
    const modal=document.getElementById('gcseInterventionRunModal');if(modal)modal.hidden=true;
    document.body.classList.remove('gcse-intervention-running');state.activeRun=null;
  }

  function interceptHomework(event){
    const button=event.target.closest?.('[data-homework-start],[data-homework-submit]');
    if(!button)return;
    const assignmentId=button.dataset.homeworkStart||button.dataset.homeworkSubmit;
    if(!assignmentId||!state.assignmentIds.has(String(assignmentId)))return;
    event.preventDefault();event.stopImmediatePropagation();
    openStudentByAssignment(assignmentId);
  }

  function onAccountRendered(){setTimeout(renderStudentPanel,0);}

  function boot(){
    ensureCreateModal();ensureTeacherModal();ensureRunModal();ensureTeacherButton();wrapAnalyticsApi();
    document.addEventListener('click',rememberAnalyticsSource,true);
    document.addEventListener('click',interceptHomework,true);
    window.addEventListener('gcse-auth-account-rendered',onAccountRendered);
    window.addEventListener('gcse-auth-changed',()=>{ensureTeacherButton();setTimeout(()=>eligible()?null:renderStudentPanel(),50);});
    window.addEventListener('gcse-access-changed',ensureTeacherButton);
    window.addEventListener('gcse-assessment-mark-adjusted',()=>setTimeout(decorateAnalyticsInterventions,50));
    const observer=new MutationObserver(()=>{ensureTeacherButton();decorateAnalyticsInterventions();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(decorateAnalyticsInterventions,150);
  }

  window.GCSE_INTERVENTIONS={
    openTeacher:openTeacherDashboard,
    openStudent:openStudentIntervention,
    openStudentByAssignment,
    refreshTeacher:async()=>{await loadTeacherInterventions();if(!ensureTeacherModal().hidden)renderTeacherDashboard();},
    refreshStudent:renderStudentPanel
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
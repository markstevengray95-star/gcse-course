(() => {
  'use strict';

  const DATA = window.GCSE_COURSE_DATA;
  if (!DATA?.topics?.length) return;

  const state = {
    classes:[], members:[], assessments:[], targets:[], attempts:[],
    studentAssessments:[], activeRun:null, saveTimer:null, timer:null
  };
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const uid = () => session()?.user?.id || '';
  const teacherEligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const titleCase = v => String(v||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const fmt = v => v ? new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const now = () => Date.now();
  const classById = id => state.classes.find(c=>c.id===id) || null;
  const joinedFor = id => state.members.filter(m=>m.class_id===id && m.status==='joined' && m.student_id);
  const attemptFor = (assessmentId,studentId) => state.attempts.find(a=>a.assessment_id===assessmentId && a.student_id===studentId) || null;
  const targetSet = assessmentId => new Set(state.targets.filter(t=>t.assessment_id===assessmentId).map(t=>t.student_id));

  function normaliseMarking(marking, fallback='') {
    if (Array.isArray(marking)) return marking.map(x=>String(x||'').trim()).filter(Boolean);
    if (marking && typeof marking==='object') return Object.values(marking).flat().map(x=>String(x||'').trim()).filter(Boolean);
    return fallback ? [String(fallback).trim()] : [];
  }

  function stableId(topicId,prompt,index) {
    let hash=2166136261; const text=`${topicId}|${index}|${prompt}`;
    for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `${topicId}-${(hash>>>0).toString(36)}`;
  }

  function questionPool(config) {
    const rich=window.GCSE_RICH_CONTENT;
    const selected=new Set(config.topicIds || []);
    const topics=DATA.topics.filter(t=>t.subject===config.subject && Number(t.paper)===Number(config.paper) && (!selected.size || selected.has(t.id)) && (config.qualification==='separate' || t.scope!=='triple'));
    const bank=[];
    for(const topic of topics){
      const guide=rich?.guides?.[topic.id];
      const exam=Array.isArray(guide?.exam)?guide.exam:[];
      exam.forEach((raw,index)=>{
        const prompt=String(Array.isArray(raw)?raw[0]:raw?.prompt||'').trim(); if(!prompt)return;
        const marks=Math.max(1,Math.min(12,Number(Array.isArray(raw)?raw[1]:raw?.marks)||1));
        const points=normaliseMarking(Array.isArray(raw)?raw[2]:(raw?.marking||raw?.points));
        if(!points.length)return;
        bank.push({id:stableId(topic.id,`exam:${prompt}`,index),topicId:topic.id,topicCode:topic.code,topicTitle:topic.title,prompt,marks,type:'written',points});
      });
      (topic.quiz||[]).forEach((raw,index)=>{
        const prompt=String(raw?.[0]||'').trim(), answer=String(raw?.[1]||'').trim(); if(!prompt||!answer)return;
        bank.push({id:stableId(topic.id,`quiz:${prompt}`,index),topicId:topic.id,topicCode:topic.code,topicTitle:topic.title,prompt,marks:1,type:'short',points:[answer]});
      });
    }
    const seen=new Set();
    return bank.filter(q=>{const key=q.prompt.toLowerCase().replace(/\s+/g,' ').trim();if(seen.has(key))return false;seen.add(key);return true;});
  }

  function shuffle(list){
    const copy=[...list];
    for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }

  function buildPaper(config){
    const pool=shuffle(questionPool(config));
    const chosen=[]; let remaining=Number(config.totalMarks)||20;
    const ordered=[...pool].sort((a,b)=>{
      if(config.tier==='higher') return b.marks-a.marks || Math.random()-.5;
      return a.marks-b.marks || Math.random()-.5;
    });
    for(const q of ordered){
      if(remaining<=0)break;
      if(q.marks<=remaining){chosen.push({...q});remaining-=q.marks;}
    }
    if(remaining>0){
      for(const q of ordered){
        if(remaining<=0)break;
        if(chosen.some(x=>x.id===q.id))continue;
        if(q.marks>remaining && q.points.length>=remaining){chosen.push({...q,marks:remaining,points:q.points.slice(0,remaining)});remaining=0;}
      }
    }
    if(remaining>0) throw new Error(`Only ${config.totalMarks-remaining} marks of securely auto-markable material are available for those topic choices. Select more topics or reduce the mark total.`);

    const answerPool=pool.map(q=>q.points[0]).filter(Boolean);
    const publicQuestions=[], marking=[];
    chosen.forEach((q,index)=>{
      let type=q.type, options=null, correct=null;
      if(q.marks===1 && index%4===0 && answerPool.length>=4){
        correct=q.points[0];
        const distractors=shuffle(answerPool.filter(x=>x!==correct)).slice(0,3);
        if(distractors.length===3){type='mcq';options=shuffle([correct,...distractors]);}
      }
      const id=`assessment-${Date.now().toString(36)}-${index}-${q.id}`;
      publicQuestions.push({id,number:String(index+1).padStart(2,'0'),topicId:q.topicId,topicCode:q.topicCode,topicTitle:q.topicTitle,prompt:q.prompt,marks:q.marks,type,options});
      marking.push({id,marks:q.marks,type,topicId:q.topicId,topicCode:q.topicCode,topicTitle:q.topicTitle,correct:type==='mcq'?correct:null,points:q.points.slice(0,Math.max(q.marks,q.points.length))});
    });
    return {questions:publicQuestions,marking};
  }

  function ensureTeacherButton(){
    const header=document.querySelector('#gcseTeacherPlatformModal .teacher-platform-header');
    if(!header||!teacherEligible()||document.getElementById('gcseTeacherAssessmentsButton'))return;
    const btn=document.createElement('button'); btn.id='gcseTeacherAssessmentsButton';btn.type='button';btn.className='teacher-assessment-open';btn.textContent='Assessments';btn.addEventListener('click',openTeacherAssessments);
    const close=header.querySelector('.teacher-close');(close||header).insertAdjacentElement(close?'beforebegin':'beforeend',btn);
  }

  function ensureTeacherModal(){
    let modal=document.getElementById('gcseTeacherAssessmentsModal'); if(modal)return modal;
    modal=document.createElement('div');modal.id='gcseTeacherAssessmentsModal';modal.className='teacher-assessment-modal';modal.hidden=true;
    modal.innerHTML=`<div class="teacher-assessment-backdrop" data-assessment-close></div><section class="teacher-assessment-shell" role="dialog" aria-modal="true" aria-labelledby="teacherAssessmentTitle"><header><div><span class="teacher-eyebrow">Teacher Platform</span><h2 id="teacherAssessmentTitle">Assessments & markbook</h2><p>Create secure timed assessments and analyse automatically marked results.</p></div><button type="button" data-assessment-close aria-label="Close">×</button></header><div class="teacher-assessment-body" data-assessment-body></div></section>`;
    document.body.appendChild(modal);modal.querySelectorAll('[data-assessment-close]').forEach(x=>x.addEventListener('click',closeTeacherAssessments));return modal;
  }

  async function loadTeacherData(){
    const client=sb(),userId=uid();if(!client||!userId)return;
    const [classes,members,assessments,targets,attempts]=await Promise.all([
      client.from('gcse_classes').select('id,name,year_group,subject,course_type,archived').eq('teacher_id',userId).order('name'),
      client.from('gcse_class_members').select('id,class_id,student_id,student_email,display_name,status').eq('teacher_id',userId),
      client.from('gcse_assessments').select('*').eq('teacher_id',userId).order('opens_at',{ascending:false}),
      client.from('gcse_assessment_targets').select('*').eq('teacher_id',userId),
      client.from('gcse_assessment_attempts').select('*').eq('teacher_id',userId)
    ]);
    const error=classes.error||members.error||assessments.error||targets.error||attempts.error;if(error)throw error;
    state.classes=classes.data||[];state.members=members.data||[];state.assessments=assessments.data||[];state.targets=targets.data||[];state.attempts=attempts.data||[];
    updateDashboardCard();
  }

  function recipients(a){const joined=joinedFor(a.class_id);if(a.audience_mode!=='selected')return joined;const ids=targetSet(a.id);return joined.filter(m=>ids.has(m.student_id));}
  function assessmentSummary(a){
    const people=recipients(a),submitted=people.map(m=>attemptFor(a.id,m.student_id)).filter(x=>x?.status==='submitted');
    const values=submitted.map(x=>Number(x.percent)).filter(Number.isFinite);
    return {assigned:people.length,submitted:submitted.length,average:values.length?Math.round(values.reduce((x,y)=>x+y,0)/values.length):null,high:values.length?Math.max(...values):null,low:values.length?Math.min(...values):null};
  }

  function updateDashboardCard(){
    const wrap=document.querySelector('[data-phase2-dashboard] .teacher-work-cards');if(!wrap)return;
    let card=wrap.querySelector('[data-phase4-assessments]');if(!card){card=document.createElement('article');card.dataset.phase4Assessments='true';wrap.appendChild(card);}
    const upcoming=state.assessments.filter(a=>a.status==='published'&&new Date(a.closes_at).getTime()>=now()).length;
    card.innerHTML=`<span>Assessments upcoming</span><strong>${upcoming}</strong><small>${upcoming?'published assessment windows':'No assessments scheduled'}</small>`;
  }

  async function openTeacherAssessments(){
    if(!teacherEligible()){window.GCSE_ACCESS?.showUpgrade?.('teacher_tools','Teacher Assessments');return;}
    const modal=ensureTeacherModal();modal.hidden=false;document.body.classList.add('teacher-assessment-open');modal.querySelector('[data-assessment-body]').innerHTML='<div class="teacher-loading">Loading assessment markbook…</div>';
    try{await loadTeacherData();renderTeacherAssessments();}catch(error){console.error('[Teacher Assessments]',error);modal.querySelector('[data-assessment-body]').innerHTML='<div class="teacher-empty"><strong>Assessments could not be loaded.</strong><p>Check the teacher account and try again.</p></div>';}
  }
  function closeTeacherAssessments(){const modal=document.getElementById('gcseTeacherAssessmentsModal');if(modal)modal.hidden=true;document.body.classList.remove('teacher-assessment-open');}

  function renderTeacherAssessments(){
    const body=document.querySelector('#gcseTeacherAssessmentsModal [data-assessment-body]');if(!body)return;
    const live=state.assessments.filter(a=>a.status==='published').length, drafts=state.assessments.filter(a=>a.status==='draft').length;
    const submitted=state.attempts.filter(a=>a.status==='submitted').length;
    body.innerHTML=`<div class="teacher-assessment-kpis"><article><span>Published</span><strong>${live}</strong><small>assessment windows</small></article><article><span>Drafts</span><strong>${drafts}</strong><small>teacher only</small></article><article><span>Submissions</span><strong>${submitted}</strong><small>automatically marked</small></article></div>
      <div class="teacher-assessment-toolbar"><div><h3>Assessment builder</h3><p>Build original AQA-style tests from the course question bank. Answers stay server-side until submission.</p></div><button class="button primary" type="button" data-new-assessment>+ Create assessment</button></div>
      <div class="teacher-status" data-assessment-message hidden></div><section class="teacher-assessment-create" data-assessment-create hidden>${builderHtml()}</section>
      <div class="teacher-assessment-list">${state.assessments.length?state.assessments.map(assessmentCard).join(''):'<div class="teacher-empty"><strong>No assessments yet</strong><p>Create a timed assessment for a class to start building your markbook.</p></div>'}</div>`;
    body.querySelector('[data-new-assessment]')?.addEventListener('click',()=>{const panel=body.querySelector('[data-assessment-create]');panel.hidden=!panel.hidden;if(!panel.hidden)bindBuilder(panel);});
    body.querySelectorAll('[data-assessment-toggle]').forEach(b=>b.addEventListener('click',()=>{const box=body.querySelector(`[data-assessment-detail="${b.dataset.assessmentToggle}"]`);if(box)box.hidden=!box.hidden;}));
    body.querySelectorAll('[data-assessment-state]').forEach(b=>b.addEventListener('click',()=>changeAssessmentStatus(b.dataset.assessmentState,b.dataset.nextState)));
    body.querySelectorAll('[data-assessment-scheme]').forEach(b=>b.addEventListener('click',()=>showTeacherMarkScheme(b.dataset.assessmentScheme)));
  }

  function builderHtml(){
    const active=state.classes.filter(c=>!c.archived);
    return `<form class="assessment-builder" data-assessment-form>
      <label>Class<select name="class_id" required><option value="">Choose class…</option>${active.map(c=>`<option value="${c.id}">${esc(c.name)} · ${esc(c.year_group)}</option>`).join('')}</select></label>
      <label>Assign to<select name="audience_mode"><option value="class">Whole class</option><option value="selected">Selected students</option></select></label>
      <label>Qualification<select name="qualification"><option value="combined">Combined Science</option><option value="separate">Separate / Triple Science</option></select></label>
      <label>Subject<select name="subject"><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
      <label>Paper<select name="paper"><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label>
      <label>Tier<select name="tier"><option value="foundation">Foundation</option><option value="higher" selected>Higher</option></select></label>
      <label>Marks<input type="number" name="total_marks" min="5" max="100" value="40" required></label>
      <label>Time (minutes)<input type="number" name="duration_minutes" min="5" max="180" value="45" required></label>
      <label>Opens<input type="datetime-local" name="opens_at" required></label><label>Closes<input type="datetime-local" name="closes_at" required></label>
      <label class="wide">Title<input name="title" maxlength="160" required placeholder="e.g. Year 10 Biology Paper 1 assessment"></label>
      <label class="wide">Instructions<textarea name="instructions" rows="2" placeholder="Optional instructions for students"></textarea></label>
      <div class="wide assessment-topic-picker" data-assessment-topics></div><div class="wide assessment-student-picker" data-assessment-students hidden></div>
      <label>Status<select name="status"><option value="published">Publish</option><option value="draft">Save as draft</option></select></label>
      <div class="wide teacher-homework-actions"><button class="button primary" type="submit">Generate & save assessment</button><button class="button" type="button" data-cancel-assessment>Cancel</button></div>
    </form>`;
  }

  function bindBuilder(panel){
    const form=panel.querySelector('[data-assessment-form]');if(!form||form.dataset.bound)return;form.dataset.bound='true';
    const local=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16);};
    const start=new Date();start.setMinutes(start.getMinutes()+5);const end=new Date(start);end.setDate(end.getDate()+7);form.elements.opens_at.value=local(start);form.elements.closes_at.value=local(end);
    const refresh=()=>renderBuilderPickers(form);
    ['class_id','audience_mode','qualification','subject','paper'].forEach(name=>form.elements[name].addEventListener('change',refresh));
    form.elements.total_marks.addEventListener('change',()=>{form.elements.duration_minutes.value=Math.max(10,Math.ceil(Number(form.elements.total_marks.value||20)*1.1/5)*5);});
    form.querySelector('[data-cancel-assessment]').addEventListener('click',()=>panel.hidden=true);form.addEventListener('submit',createAssessment);refresh();
  }

  function renderBuilderPickers(form){
    const subject=form.elements.subject.value,paper=Number(form.elements.paper.value),qualification=form.elements.qualification.value;
    const topics=DATA.topics.filter(t=>t.subject===subject&&Number(t.paper)===paper&&(qualification==='separate'||t.scope!=='triple'));
    const topicBox=form.querySelector('[data-assessment-topics]');topicBox.innerHTML=`<strong>Topics included</strong><p>Select one or more. All matching topics are selected by default.</p><div>${topics.map(t=>`<label><input type="checkbox" name="topic_id" value="${esc(t.id)}" checked><span>${esc(t.code)} ${esc(t.title)}</span></label>`).join('')}</div>`;
    const studentBox=form.querySelector('[data-assessment-students]');const selected=form.elements.audience_mode.value==='selected';studentBox.hidden=!selected;if(selected){const members=joinedFor(form.elements.class_id.value);studentBox.innerHTML=`<strong>Selected students</strong><div>${members.length?members.map(m=>`<label><input type="checkbox" name="student_id" value="${m.student_id}"><span>${esc(m.display_name||m.student_email)}</span></label>`).join(''):'<span>No joined students in this class.</span>'}</div>`;}
  }

  async function createAssessment(event){
    event.preventDefault();const form=event.currentTarget,client=sb();if(!client)return;const fd=new FormData(form);
    const topicIds=fd.getAll('topic_id').map(String), studentIds=fd.getAll('student_id').map(String), audience=String(fd.get('audience_mode'));
    if(!topicIds.length)return setTeacherMessage('Select at least one topic.','error');if(audience==='selected'&&!studentIds.length)return setTeacherMessage('Select at least one student.','error');
    const config={qualification:String(fd.get('qualification')),subject:String(fd.get('subject')),paper:Number(fd.get('paper')),tier:String(fd.get('tier')),topicIds,totalMarks:Number(fd.get('total_marks'))};
    let paper;try{paper=buildPaper(config);}catch(error){return setTeacherMessage(error.message,'error');}
    const payload={class_id:String(fd.get('class_id')),title:String(fd.get('title')).trim(),instructions:String(fd.get('instructions')||'').trim(),qualification:config.qualification,subject:config.subject,paper:config.paper,tier:config.tier,topic_ids:topicIds,total_marks:config.totalMarks,duration_minutes:Number(fd.get('duration_minutes')),opens_at:new Date(String(fd.get('opens_at'))).toISOString(),closes_at:new Date(String(fd.get('closes_at'))).toISOString(),audience_mode:audience,status:String(fd.get('status')),question_payload:paper.questions,marking_payload:paper.marking,student_ids:studentIds};
    const btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Generating…';
    const {error}=await client.rpc('gcse_create_assessment',{p_payload:payload});btn.disabled=false;btn.textContent='Generate & save assessment';if(error)return setTeacherMessage(error.message||'Assessment could not be created.','error');
    await loadTeacherData();renderTeacherAssessments();setTeacherMessage(payload.status==='published'?'Assessment published to students.':'Assessment saved as draft.','success');
  }

  function assessmentCard(a){
    const summary=assessmentSummary(a),people=recipients(a);const rows=people.map(m=>{const at=attemptFor(a.id,m.student_id);let status='Not started';if(at?.status==='in_progress')status=now()>new Date(at.ends_at).getTime()?'Time expired':'In progress';if(at?.status==='submitted')status='Submitted';return `<article><div><strong>${esc(m.display_name||m.student_email)}</strong><small>${esc(m.student_email)}</small></div><span>${status}</span><b>${at?.status==='submitted'?`${at.score}/${at.total_marks} · ${at.percent}%`:'—'}</b></article>`;}).join('');
    const next=a.status==='draft'?'published':a.status==='published'?'closed':'published';const action=a.status==='draft'?'Publish':a.status==='published'?'Close':'Reopen';
    return `<article class="teacher-assessment-card"><div class="teacher-assessment-card-head"><div><span>${esc(classById(a.class_id)?.name||'Class')} · ${esc(titleCase(a.subject))} Paper ${a.paper}</span><strong>${esc(a.title)}</strong><small>${a.total_marks} marks · ${a.duration_minutes} min · ${esc(titleCase(a.tier))} · ${fmt(a.opens_at)} → ${fmt(a.closes_at)}</small></div><span class="assessment-state ${a.status}">${esc(titleCase(a.status))}</span></div>
      <div class="teacher-assessment-stats"><span><b>${summary.assigned}</b> assigned</span><span><b>${summary.submitted}</b> submitted</span><span><b>${summary.average==null?'—':`${summary.average}%`}</b> average</span><span><b>${summary.high==null?'—':`${summary.high}%`}</b> high</span><span><b>${summary.low==null?'—':`${summary.low}%`}</b> low</span></div>
      <div class="teacher-assessment-actions"><button class="button" data-assessment-toggle="${a.id}" type="button">View markbook</button><button class="button" data-assessment-scheme="${a.id}" type="button">Mark scheme</button><button class="button" data-assessment-state="${a.id}" data-next-state="${next}" type="button">${action}</button></div>
      <div class="teacher-assessment-markbook" data-assessment-detail="${a.id}" hidden>${rows||'<span>No joined recipients yet.</span>'}</div></article>`;
  }

  async function changeAssessmentStatus(id,status){const {error}=await sb().rpc('gcse_set_assessment_status',{p_assessment_id:id,p_status:status});if(error)return setTeacherMessage(error.message,'error');await loadTeacherData();renderTeacherAssessments();setTeacherMessage(`Assessment ${status}.`,'success');}
  async function showTeacherMarkScheme(id){const assessment=state.assessments.find(a=>a.id===id);const {data,error}=await sb().rpc('gcse_teacher_assessment_key',{p_assessment_id:id});if(error)return setTeacherMessage(error.message,'error');showReviewModal(assessment?.title||'Assessment mark scheme',assessment?.question_payload||[],data||[],null,true);}
  function setTeacherMessage(text,kind='info'){const box=document.querySelector('#gcseTeacherAssessmentsModal [data-assessment-message]');if(!box)return;box.hidden=!text;box.className=`teacher-status ${kind}`;box.textContent=text;}

  async function loadStudentAssessments(){const client=sb();if(!client||!session()?.user)return;const {data,error}=await client.rpc('gcse_student_assessments');if(error){console.warn('[Student Assessments]',error);return;}state.studentAssessments=Array.isArray(data)?data:[];}

  async function renderStudentPanel(){
    const content=document.getElementById('gcseAuthContent');if(!content||!session()?.user||teacherEligible())return;content.querySelector('[data-student-assessments]')?.remove();await loadStudentAssessments();
    const panel=document.createElement('section');panel.className='student-assessment-panel';panel.dataset.studentAssessments='true';
    panel.innerHTML=`<div class="student-assessment-head"><div><span class="gcse-auth-eyebrow">Assessments</span><h3>Timed assessments</h3></div><strong>${state.studentAssessments.filter(a=>a.status==='published'&&!a.attempt?.submitted_at&&new Date(a.closes_at).getTime()>=now()).length}</strong></div><div class="student-assessment-list">${state.studentAssessments.length?state.studentAssessments.map(studentCard).join(''):'<span>No assessments have been assigned yet.</span>'}</div>`;
    content.querySelector('#gcseSignOut')?.insertAdjacentElement('beforebegin',panel);panel.querySelectorAll('[data-start-assessment]').forEach(b=>b.addEventListener('click',()=>startAssessment(b.dataset.startAssessment)));panel.querySelectorAll('[data-review-assessment]').forEach(b=>b.addEventListener('click',()=>reviewStudentAssessment(b.dataset.reviewAssessment)));
  }

  function studentCard(a){
    const openAt=new Date(a.opens_at).getTime(),closeAt=new Date(a.closes_at).getTime(),attempt=a.attempt;let status,action='';
    if(attempt?.status==='submitted'){status=`${attempt.score}/${attempt.total_marks} · ${attempt.percent}%`;action=`<button type="button" data-review-assessment="${a.id}">Review & mark scheme</button>`;}
    else if(now()<openAt){status=`Opens ${fmt(a.opens_at)}`;}
    else if(now()>closeAt&&!attempt){status='Closed';}
    else {status=attempt?.status==='in_progress'?'In progress':'Ready';action=`<button type="button" data-start-assessment="${a.id}">${attempt?'Continue':'Start assessment'}</button>`;}
    return `<article class="student-assessment-card"><div><span>${esc(a.class_name||'Class')} · ${esc(titleCase(a.subject))} Paper ${a.paper}</span><strong>${esc(a.title)}</strong><p>${a.total_marks} marks · ${a.duration_minutes} minutes · ${esc(titleCase(a.tier))}</p><small>${esc(status)}</small></div><div>${action}</div></article>`;
  }

  function ensureRunModal(){let modal=document.getElementById('gcseAssessmentRunModal');if(modal)return modal;modal=document.createElement('div');modal.id='gcseAssessmentRunModal';modal.className='assessment-run-modal';modal.hidden=true;modal.innerHTML='<div class="assessment-run-shell"><header data-run-header></header><div class="assessment-run-body" data-run-body></div></div>';document.body.appendChild(modal);return modal;}

  async function startAssessment(id){
    const client=sb();if(!client)return;const {data,error}=await client.rpc('gcse_start_assessment',{p_assessment_id:id});if(error){alert(error.message||'Assessment could not be started.');return;}state.activeRun=data;openRun();
  }

  function openRun(){
    const modal=ensureRunModal(),run=state.activeRun,a=run?.assessment,attempt=run?.attempt;if(!a||!attempt)return;modal.hidden=false;document.body.classList.add('assessment-running');
    if(attempt.status==='submitted'){return renderSubmittedRun();}
    modal.querySelector('[data-run-header]').innerHTML=`<div><span>AQA-style teacher assessment</span><h2>${esc(a.title)}</h2><small>${esc(titleCase(a.subject))} Paper ${a.paper} · ${a.total_marks} marks</small></div><div class="assessment-clock" data-assessment-clock></div>`;
    const answers=attempt.answers&&typeof attempt.answers==='object'?attempt.answers:{};
    modal.querySelector('[data-run-body]').innerHTML=`<div class="assessment-paper-notice"><strong>Assessment conditions</strong><p>Answer every question. Your work is saved while the timer is running. The mark scheme is unavailable until submission.</p></div><div class="assessment-question-list">${(a.questions||[]).map(q=>questionHtml(q,answers[q.id]||'')).join('')}</div><div class="assessment-submit-bar"><span>Submitting ends the assessment and reveals the automated mark.</span><button type="button" class="button primary" data-submit-assessment>Submit assessment</button></div>`;
    modal.querySelectorAll('[data-assessment-answer]').forEach(el=>el.addEventListener('input',scheduleSave));modal.querySelectorAll('input[type="radio"][data-assessment-choice]').forEach(el=>el.addEventListener('change',scheduleSave));modal.querySelector('[data-submit-assessment]').addEventListener('click',()=>submitActive(false));startTimer();
  }

  function questionHtml(q,value){
    const answer=q.type==='mcq'&&Array.isArray(q.options)?`<div class="assessment-options">${q.options.map(opt=>`<label><input type="radio" data-assessment-choice data-qid="${q.id}" name="answer-${q.id}" value="${esc(opt)}" ${String(value)===String(opt)?'checked':''}><span>${esc(opt)}</span></label>`).join('')}</div>`:`<textarea data-assessment-answer data-qid="${q.id}" rows="${q.marks>=4?7:4}" placeholder="Write your answer here…">${esc(value)}</textarea>`;
    return `<article class="assessment-question" id="aq-${q.id}"><div class="assessment-question-number"><strong>${esc(q.number)}</strong><span>[${q.marks} mark${q.marks===1?'':'s'}]</span></div><p>${esc(q.prompt)}</p>${answer}</article>`;
  }

  function collectAnswers(){const modal=document.getElementById('gcseAssessmentRunModal'),answers={};modal?.querySelectorAll('[data-assessment-answer]').forEach(el=>answers[el.dataset.qid]=el.value);modal?.querySelectorAll('[data-assessment-choice]:checked').forEach(el=>answers[el.dataset.qid]=el.value);return answers;}
  function scheduleSave(){clearTimeout(state.saveTimer);state.saveTimer=setTimeout(saveActive,900);}
  async function saveActive(){const id=state.activeRun?.assessment?.id;if(!id||state.activeRun?.attempt?.status==='submitted')return;const {data,error}=await sb().rpc('gcse_save_assessment_answers',{p_assessment_id:id,p_answers:collectAnswers()});if(!error&&data?.status==='submitted'){state.activeRun.attempt=data;renderSubmittedRun();}}
  function startTimer(){clearInterval(state.timer);const tick=()=>{const end=new Date(state.activeRun?.attempt?.ends_at||0).getTime(),left=Math.max(0,Math.ceil((end-now())/1000)),clock=document.querySelector('[data-assessment-clock]');if(clock)clock.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left<=0){clearInterval(state.timer);submitActive(true);}};tick();state.timer=setInterval(tick,1000);}

  async function submitActive(timedOut){const run=state.activeRun,id=run?.assessment?.id;if(!id)return;if(!timedOut&&!confirm('Submit this assessment now? You will not be able to change your answers afterwards.'))return;clearInterval(state.timer);clearTimeout(state.saveTimer);const {data,error}=await sb().rpc('gcse_submit_assessment',{p_assessment_id:id,p_answers:collectAnswers()});if(error){alert(error.message||'Assessment could not be submitted.');return;}state.activeRun.attempt=data;window.dispatchEvent(new CustomEvent('gcse-assessment-submitted',{detail:{assessmentId:id,score:data.score,totalMarks:data.total_marks,percent:data.percent,topicBreakdown:data.topic_breakdown}}));renderSubmittedRun();}

  function renderSubmittedRun(){
    clearInterval(state.timer);const modal=ensureRunModal(),a=state.activeRun.assessment,at=state.activeRun.attempt;modal.querySelector('[data-run-header]').innerHTML=`<div><span>Assessment submitted</span><h2>${esc(a.title)}</h2></div><button type="button" class="button" data-close-run>Close</button>`;
    modal.querySelector('[data-run-body]').innerHTML=`<section class="assessment-result"><span>Automated practice mark</span><strong>${at.score}/${at.total_marks}</strong><b>${at.percent}%</b><p>Extended written responses use indicative automated marking. Your teacher can review the markbook.</p><button type="button" class="button primary" data-show-result-scheme>Review answers & mark scheme</button></section>`;
    modal.querySelector('[data-close-run]').addEventListener('click',closeRun);modal.querySelector('[data-show-result-scheme]').addEventListener('click',()=>showReviewModal(a.title,a.questions||[],null,at.review||[],false));loadStudentAssessments();
  }
  function closeRun(){clearInterval(state.timer);const modal=document.getElementById('gcseAssessmentRunModal');if(modal)modal.hidden=true;document.body.classList.remove('assessment-running');state.activeRun=null;}

  function showReviewModal(title,questions,marking,review,teacher=false){
    let modal=document.getElementById('gcseAssessmentReviewModal');if(!modal){modal=document.createElement('div');modal.id='gcseAssessmentReviewModal';modal.className='assessment-review-modal';modal.innerHTML='<div class="assessment-review-backdrop" data-review-close></div><section class="assessment-review-shell"><header><div><span>Mark scheme</span><h2 data-review-title></h2></div><button data-review-close type="button">×</button></header><div data-review-body></div></section>';document.body.appendChild(modal);modal.querySelectorAll('[data-review-close]').forEach(x=>x.addEventListener('click',()=>modal.hidden=true));}
    modal.hidden=false;modal.querySelector('[data-review-title]').textContent=title;
    const keyMap=new Map((marking||[]).map(x=>[x.id,x]));const reviewMap=new Map((review||[]).map(x=>[x.id,x]));
    modal.querySelector('[data-review-body]').innerHTML=(questions||[]).map(q=>{const k=keyMap.get(q.id),r=reviewMap.get(q.id),points=k?.points||r?.markingPoints||[];return `<article class="assessment-review-question"><div><strong>${esc(q.number||'')}</strong><span>${q.marks} marks</span></div><h3>${esc(q.prompt)}</h3>${r?`<p><b>Your answer:</b> ${esc(r.answer||'No answer')}</p><p><b>Mark:</b> ${r.awarded}/${r.marks}</p>`:''}<ol>${points.map(p=>`<li>${esc(p)}</li>`).join('')}</ol>${(k?.correct||r?.correct)?`<p><b>Correct option:</b> ${esc(k?.correct||r?.correct)}</p>`:''}</article>`;}).join('')||'<p>No mark scheme data available.</p>';
  }

  function reviewStudentAssessment(id){const a=state.studentAssessments.find(x=>x.id===id);if(!a?.attempt?.review)return;const questions=(a.attempt.review||[]).map(r=>({id:r.id,number:r.number,prompt:r.prompt,marks:r.marks}));showReviewModal(a.title,questions,null,a.attempt.review,false);}

  async function syncDashboard(){if(!teacherEligible()||!uid())return;try{await loadTeacherData();}catch(error){console.warn('[Teacher Assessments] dashboard sync failed',error);}}
  function onAccountRendered(){setTimeout(renderStudentPanel,0);}
  function boot(){ensureTeacherModal();ensureTeacherButton();window.addEventListener('gcse-auth-changed',()=>{ensureTeacherButton();setTimeout(()=>teacherEligible()?syncDashboard():null,0);});window.addEventListener('gcse-access-changed',()=>{ensureTeacherButton();if(teacherEligible())syncDashboard();});window.addEventListener('gcse-auth-account-rendered',onAccountRendered);const observer=new MutationObserver(()=>ensureTeacherButton());observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>teacherEligible()?syncDashboard():null,300);}

  window.GCSE_TEACHER_ASSESSMENTS={open:openTeacherAssessments,refresh:async()=>{await loadTeacherData();renderTeacherAssessments();},syncDashboard};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

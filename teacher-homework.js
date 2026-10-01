(() => {
  'use strict';

  const state = { classes:[], members:[], assignments:[], targets:[], submissions:[], loaded:false };
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const eligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const topics = () => window.GCSE_COURSE_DATA?.topics || [];
  const now = () => Date.now();
  const uid = () => session()?.user?.id || '';
  const joinedFor = classId => state.members.filter(m=>m.class_id===classId && m.status==='joined' && m.student_id);
  const targetIds = assignmentId => new Set(state.targets.filter(t=>t.assignment_id===assignmentId).map(t=>t.student_id));
  const recipients = assignment => assignment.audience_mode==='selected' ? joinedFor(assignment.class_id).filter(m=>targetIds(assignment.id).has(m.student_id)) : joinedFor(assignment.class_id);
  const submissionFor = (assignmentId,studentId) => state.submissions.find(s=>s.assignment_id===assignmentId && s.student_id===studentId) || null;
  const isLate = (assignment,submission) => !submission?.submitted_at && new Date(assignment.due_at).getTime() < now();
  const assignmentStatus = (assignment,studentId) => { const s=submissionFor(assignment.id,studentId); return isLate(assignment,s)?'late':(s?.status||'not_started'); };
  const fmtDate = value => value ? new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const className = id => state.classes.find(c=>c.id===id)?.name || 'Class';
  const titleCase = v => String(v||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

  function ensureButton(){
    const header=document.querySelector('#gcseTeacherPlatformModal .teacher-platform-header');
    if(!header || !eligible() || document.getElementById('gcseTeacherHomeworkButton')) return;
    const btn=document.createElement('button');
    btn.id='gcseTeacherHomeworkButton'; btn.type='button'; btn.className='teacher-homework-open'; btn.textContent='Homework';
    btn.addEventListener('click',openTeacherHomework);
    const close=header.querySelector('.teacher-close');
    (close||header).insertAdjacentElement(close?'beforebegin':'beforeend',btn);
  }

  function ensureModal(){
    let modal=document.getElementById('gcseTeacherHomeworkModal');
    if(modal) return modal;
    modal=document.createElement('div'); modal.id='gcseTeacherHomeworkModal'; modal.className='teacher-homework-modal'; modal.hidden=true;
    modal.innerHTML=`<div class="teacher-homework-backdrop" data-homework-close></div><section class="teacher-homework-shell" role="dialog" aria-modal="true" aria-labelledby="teacherHomeworkTitle"><header><div><span class="teacher-eyebrow">Teacher Platform</span><h2 id="teacherHomeworkTitle">Homework & assignments</h2><p>Set work, target students and track deadlines.</p></div><button type="button" data-homework-close aria-label="Close">×</button></header><div class="teacher-homework-body" data-homework-body></div></section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-homework-close]').forEach(x=>x.addEventListener('click',closeTeacherHomework));
    return modal;
  }

  async function loadTeacherAssignments(){
    const client=sb(), userId=uid(); if(!client||!userId) return;
    const [classes,members,assignments,targets,submissions]=await Promise.all([
      client.from('gcse_classes').select('id,name,year_group,subject,course_type,archived').eq('teacher_id',userId).order('name'),
      client.from('gcse_class_members').select('id,class_id,student_id,student_email,display_name,status').eq('teacher_id',userId),
      client.from('gcse_assignments').select('*').eq('teacher_id',userId).order('due_at',{ascending:true}),
      client.from('gcse_assignment_targets').select('*').eq('teacher_id',userId),
      client.from('gcse_assignment_submissions').select('*').eq('teacher_id',userId)
    ]);
    const error=classes.error||members.error||assignments.error||targets.error||submissions.error;
    if(error) throw error;
    state.classes=classes.data||[]; state.members=members.data||[]; state.assignments=assignments.data||[]; state.targets=targets.data||[]; state.submissions=submissions.data||[]; state.loaded=true;
    updatePhase2Cards();
  }

  function summary(assignment){
    const list=recipients(assignment); const counts={not_started:0,in_progress:0,submitted:0,late:0};
    list.forEach(m=>counts[assignmentStatus(assignment,m.student_id)]++);
    return {...counts,total:list.length};
  }

  function updatePhase2Cards(){
    const cards=document.querySelectorAll('[data-phase2-dashboard] .teacher-work-cards article'); if(cards.length<3) return;
    const published=state.assignments.filter(a=>a.status==='published');
    const dueSoon=published.filter(a=>{const d=new Date(a.due_at).getTime();return d>=now()&&d<=now()+7*86400000;}).length;
    const overdue=published.reduce((n,a)=>n+summary(a).late,0);
    cards[0].querySelector('strong').textContent=String(dueSoon);
    cards[0].querySelector('small').textContent=dueSoon?'due within 7 days':'No homework due this week';
    cards[1].querySelector('strong').textContent=String(published.length);
    cards[1].querySelector('small').textContent=published.length?'published assignments':'No assignments published yet';
    cards[2].querySelector('strong').textContent=String(overdue);
    cards[2].querySelector('small').textContent=overdue?'student submissions overdue':'No overdue submissions';
  }

  async function openTeacherHomework(){
    if(!eligible()){window.GCSE_ACCESS?.showUpgrade?.('teacher_tools','Teacher Homework');return;}
    const modal=ensureModal(); modal.hidden=false; document.body.classList.add('teacher-homework-open');
    const body=modal.querySelector('[data-homework-body]'); body.innerHTML='<div class="teacher-loading">Loading assignments…</div>';
    try{await loadTeacherAssignments(); renderTeacherHomework();}catch(error){console.error('[Teacher Homework]',error);body.innerHTML='<div class="teacher-empty"><strong>Homework could not be loaded.</strong><p>Check the teacher account and try again.</p></div>';}
  }
  function closeTeacherHomework(){const modal=document.getElementById('gcseTeacherHomeworkModal');if(modal)modal.hidden=true;document.body.classList.remove('teacher-homework-open');}

  function contentOptions(type){
    if(type==='mock') return '<option value="science|Full mock exam">Full GCSE Science mock</option><option value="biology|Biology mock">Biology mock</option><option value="chemistry|Chemistry mock">Chemistry mock</option><option value="physics|Physics mock">Physics mock</option>';
    const rows=[];
    for(const topic of topics()){
      if(type==='lesson') for(const lesson of (topic.lessons||[])){const title=Array.isArray(lesson)?lesson[0]:lesson?.title;if(title)rows.push(`<option value="${esc(topic.id)}|${esc(title)}">${esc(topic.code)} · ${esc(title)}</option>`);}
      else rows.push(`<option value="${esc(topic.id)}|${esc(topic.title)}">${esc(topic.code)} · ${esc(topic.title)}</option>`);
    }
    return rows.join('');
  }

  function renderTeacherHomework(){
    const body=document.querySelector('#gcseTeacherHomeworkModal [data-homework-body]'); if(!body)return;
    const published=state.assignments.filter(a=>a.status==='published'); const drafts=state.assignments.filter(a=>a.status==='draft').length; const closed=state.assignments.filter(a=>a.status==='closed').length;
    const overdue=published.reduce((n,a)=>n+summary(a).late,0);
    body.innerHTML=`
      <div class="teacher-homework-kpis"><article><span>Published</span><strong>${published.length}</strong><small>live homework</small></article><article><span>Drafts</span><strong>${drafts}</strong><small>not visible to students</small></article><article><span>Overdue</span><strong>${overdue}</strong><small>student submissions</small></article><article><span>Closed</span><strong>${closed}</strong><small>finished assignments</small></article></div>
      <div class="teacher-homework-toolbar"><div><h3>Assignments</h3><p>Create work for a whole class or selected students.</p></div><button class="button primary" type="button" data-new-homework>+ Set homework</button></div>
      <div data-homework-message class="teacher-status" hidden></div>
      <section class="teacher-homework-create" data-homework-create hidden>${createFormHtml()}</section>
      <div class="teacher-homework-list">${state.assignments.length?state.assignments.map(assignmentCard).join(''):'<div class="teacher-empty"><strong>No homework yet</strong><p>Set your first assignment to make it appear in student accounts.</p></div>'}</div>`;
    body.querySelector('[data-new-homework]')?.addEventListener('click',()=>{const p=body.querySelector('[data-homework-create]');p.hidden=!p.hidden; if(!p.hidden){bindCreateForm(p);p.querySelector('[name="title"]')?.focus();}});
    body.querySelectorAll('[data-assignment-status]').forEach(btn=>btn.addEventListener('click',()=>setAssignmentStatus(btn.dataset.assignmentStatus,btn.dataset.nextStatus)));
    body.querySelectorAll('[data-assignment-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const box=body.querySelector(`[data-assignment-detail="${btn.dataset.assignmentToggle}"]`);if(box)box.hidden=!box.hidden;}));
  }

  function createFormHtml(){
    const active=state.classes.filter(c=>!c.archived);
    return `<form data-homework-form class="teacher-homework-form">
      <label>Class<select name="class_id" required><option value="">Choose class…</option>${active.map(c=>`<option value="${c.id}">${esc(c.name)} · ${esc(c.year_group)}</option>`).join('')}</select></label>
      <label>Assign to<select name="audience_mode"><option value="class">Whole class</option><option value="selected">Selected students</option></select></label>
      <label>Work type<select name="assignment_type"><option value="lesson">Lesson</option><option value="topic">Topic</option><option value="quiz">Quiz</option><option value="revision">Revision</option><option value="mock">Mock exam</option><option value="custom">Custom task</option></select></label>
      <label class="wide">Course content<select name="content_choice"></select></label>
      <div class="wide teacher-homework-students" data-homework-students hidden></div>
      <label class="wide">Homework title<input name="title" maxlength="160" required placeholder="e.g. Cell Biology retrieval homework"></label>
      <label class="wide">Instructions<textarea name="instructions" rows="3" placeholder="What should students complete?"></textarea></label>
      <label>Available from<input name="available_from" type="datetime-local" required></label>
      <label>Due date<input name="due_at" type="datetime-local" required></label>
      <label>Minimum score %<input name="min_score" type="number" min="0" max="100" placeholder="Optional"></label>
      <label>Attempts allowed<input name="max_attempts" type="number" min="1" max="20" placeholder="Optional"></label>
      <label>Status<select name="status"><option value="published">Publish now</option><option value="draft">Save as draft</option></select></label>
      <div class="wide teacher-homework-actions"><button class="button primary" type="submit">Set homework</button><button class="button" type="button" data-cancel-homework>Cancel</button></div>
    </form>`;
  }

  function bindCreateForm(panel){
    const form=panel.querySelector('[data-homework-form]'); if(!form||form.dataset.bound)return; form.dataset.bound='true';
    const available=form.elements.available_from,due=form.elements.due_at;
    const dateLocal=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16);};
    const start=new Date(); const end=new Date(); end.setDate(end.getDate()+2); end.setHours(16,0,0,0); available.value=dateLocal(start); due.value=dateLocal(end);
    const refreshContent=()=>{const type=form.elements.assignment_type.value;const select=form.elements.content_choice;select.disabled=type==='custom';select.innerHTML=type==='custom'?'<option value="|">Custom instructions only</option>':contentOptions(type);};
    const refreshStudents=()=>{const box=form.querySelector('[data-homework-students]');const classId=form.elements.class_id.value;const selected=form.elements.audience_mode.value==='selected';box.hidden=!selected;if(!selected)return;const members=joinedFor(classId);box.innerHTML=`<strong>Select students</strong><div>${members.length?members.map(m=>`<label><input type="checkbox" name="student_id" value="${m.student_id}"><span>${esc(m.display_name||m.student_email)}</span></label>`).join(''):'<span>No joined students in this class yet.</span>'}</div>`;};
    form.elements.assignment_type.addEventListener('change',refreshContent); form.elements.class_id.addEventListener('change',refreshStudents); form.elements.audience_mode.addEventListener('change',refreshStudents); refreshContent();
    form.querySelector('[data-cancel-homework]').addEventListener('click',()=>{panel.hidden=true;});
    form.addEventListener('submit',createAssignment);
  }

  async function createAssignment(event){
    event.preventDefault(); const form=event.currentTarget, client=sb(), userId=uid(); if(!client||!userId)return;
    const fd=new FormData(form); const choice=String(fd.get('content_choice')||'|').split('|'); const audience=String(fd.get('audience_mode')||'class'); const studentIds=fd.getAll('student_id').map(String);
    if(audience==='selected'&&!studentIds.length){setHomeworkMessage('Select at least one student.','error');return;}
    const payload={teacher_id:userId,class_id:String(fd.get('class_id')||''),title:String(fd.get('title')||'').trim(),instructions:String(fd.get('instructions')||'').trim(),assignment_type:String(fd.get('assignment_type')||'custom'),content_ref:choice[0]||null,content_item:choice.slice(1).join('|')||null,audience_mode:audience,available_from:new Date(String(fd.get('available_from'))).toISOString(),due_at:new Date(String(fd.get('due_at'))).toISOString(),status:String(fd.get('status')||'published'),min_score:fd.get('min_score')===''?null:Number(fd.get('min_score')),max_attempts:fd.get('max_attempts')===''?null:Number(fd.get('max_attempts'))};
    const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Saving…';
    const inserted=await client.from('gcse_assignments').insert(payload).select('*').single();
    if(inserted.error){submit.disabled=false;submit.textContent='Set homework';setHomeworkMessage(inserted.error.message||'Could not create homework.','error');return;}
    if(audience==='selected'){
      const rows=studentIds.map(student_id=>({assignment_id:inserted.data.id,class_id:payload.class_id,teacher_id:userId,student_id}));
      const targets=await client.from('gcse_assignment_targets').insert(rows);
      if(targets.error){await client.from('gcse_assignments').delete().eq('id',inserted.data.id);submit.disabled=false;submit.textContent='Set homework';setHomeworkMessage('Homework was not saved because the selected students could not be linked.','error');return;}
    }
    await loadTeacherAssignments(); renderTeacherHomework(); setHomeworkMessage(payload.status==='published'?'Homework published to students.':'Homework saved as a draft.','success');
  }

  function assignmentCard(a){
    const s=summary(a); const detail=recipients(a).map(m=>{const status=assignmentStatus(a,m.student_id);return `<article><div><strong>${esc(m.display_name||m.student_email)}</strong><span>${esc(m.student_email)}</span></div><b class="homework-status ${status}">${esc(titleCase(status))}</b></article>`;}).join('');
    const next=a.status==='draft'?'published':a.status==='published'?'closed':'published'; const action=a.status==='draft'?'Publish':a.status==='published'?'Close':'Reopen';
    return `<article class="teacher-homework-card"><div class="teacher-homework-card-head"><div><span>${esc(className(a.class_id))} · ${esc(titleCase(a.assignment_type))}</span><strong>${esc(a.title)}</strong><small>Due ${esc(fmtDate(a.due_at))} · ${a.audience_mode==='class'?'Whole class':'Selected students'}</small></div><span class="homework-state ${a.status}">${esc(titleCase(a.status))}</span></div><p>${esc(a.instructions||a.content_item||'')}</p><div class="teacher-homework-progress"><span><b>${s.submitted}</b> submitted</span><span><b>${s.in_progress}</b> in progress</span><span><b>${s.not_started}</b> not started</span><span><b>${s.late}</b> late</span></div><div class="teacher-homework-card-actions"><button class="button" type="button" data-assignment-toggle="${a.id}">View students</button><button class="button" type="button" data-assignment-status="${a.id}" data-next-status="${next}">${action}</button></div><div class="teacher-homework-detail" data-assignment-detail="${a.id}" hidden>${detail||'<span>No joined recipients yet.</span>'}</div></article>`;
  }

  async function setAssignmentStatus(id,status){const client=sb();if(!client)return;const {error}=await client.from('gcse_assignments').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('teacher_id',uid());if(error){setHomeworkMessage(error.message,'error');return;}await loadTeacherAssignments();renderTeacherHomework();setHomeworkMessage(`Assignment ${status}.`,'success');}
  function setHomeworkMessage(text,kind='info'){const box=document.querySelector('#gcseTeacherHomeworkModal [data-homework-message]');if(!box)return;box.hidden=!text;box.className=`teacher-status ${kind}`;box.textContent=text;}

  async function studentAssignments(){
    const client=sb(), userId=uid(); if(!client||!userId)return {assignments:[],submissions:[]};
    const [assignments,submissions]=await Promise.all([client.from('gcse_assignments').select('*').order('due_at',{ascending:true}),client.from('gcse_assignment_submissions').select('*').eq('student_id',userId)]);
    return {assignments:assignments.error?[]:(assignments.data||[]),submissions:submissions.error?[]:(submissions.data||[])};
  }

  async function renderStudentHomework(){
    const content=document.getElementById('gcseAuthContent'); if(!content||!session()?.user||eligible())return;
    content.querySelector('[data-student-homework]')?.remove();
    const data=await studentAssignments(); const subMap=new Map(data.submissions.map(s=>[s.assignment_id,s]));
    const panel=document.createElement('section');panel.className='student-homework-panel';panel.dataset.studentHomework='true';
    panel.innerHTML=`<div class="student-homework-head"><div><span class="gcse-auth-eyebrow">Homework</span><h3>Your assignments</h3></div><strong>${data.assignments.filter(a=>{const s=subMap.get(a.id);return !s?.submitted_at;}).length}</strong></div><div class="student-homework-list">${data.assignments.length?data.assignments.map(a=>studentAssignmentCard(a,subMap.get(a.id))).join(''):'<span>No homework has been assigned yet.</span>'}</div><div data-student-homework-message class="teacher-status" hidden></div>`;
    const signout=content.querySelector('#gcseSignOut');signout?.insertAdjacentElement('beforebegin',panel);
    panel.querySelectorAll('[data-homework-start]').forEach(btn=>btn.addEventListener('click',()=>startStudentAssignment(btn.dataset.homeworkStart,data.assignments,subMap)));
    panel.querySelectorAll('[data-homework-submit]').forEach(btn=>btn.addEventListener('click',()=>submitStudentAssignment(btn.dataset.homeworkSubmit,data.assignments,subMap)));
  }

  function studentAssignmentCard(a,s){
    const late=!s?.submitted_at&&new Date(a.due_at).getTime()<now(); const status=late?'late':(s?.status||'not_started');
    return `<article class="student-homework-card"><div><span>${esc(titleCase(a.assignment_type))} · due ${esc(fmtDate(a.due_at))}</span><strong>${esc(a.title)}</strong><p>${esc(a.instructions||a.content_item||'')}</p>${a.min_score!=null?`<small>Target score: ${a.min_score}%</small>`:''}</div><b class="homework-status ${status}">${esc(titleCase(status))}</b><div class="student-homework-actions">${status!=='submitted'?`<button type="button" data-homework-start="${a.id}">${status==='not_started'||status==='late'?'Start':'Continue'}</button><button type="button" data-homework-submit="${a.id}">Mark submitted</button>`:'<span>Submitted ${esc(fmtDate(s?.submitted_at))}</span>'}</div></article>`;
  }

  async function upsertStudentStatus(a,status){
    const client=sb(),userId=uid();if(!client||!userId)return false;const existing=await client.from('gcse_assignment_submissions').select('id,started_at').eq('assignment_id',a.id).eq('student_id',userId).maybeSingle();
    const time=new Date().toISOString(); const payload={assignment_id:a.id,class_id:a.class_id,teacher_id:a.teacher_id,student_id:userId,status,started_at:existing.data?.started_at||time,submitted_at:status==='submitted'?time:null,updated_at:time};
    const result=existing.data?.id?await client.from('gcse_assignment_submissions').update(payload).eq('id',existing.data.id):await client.from('gcse_assignment_submissions').insert(payload);
    return !result.error;
  }
  async function startStudentAssignment(id,assignments){const a=assignments.find(x=>x.id===id);if(!a)return;await upsertStudentStatus(a,'in_progress');openAssignedContent(a);await renderStudentHomework();}
  async function submitStudentAssignment(id,assignments){const a=assignments.find(x=>x.id===id);if(!a)return;if(!confirm('Mark this homework as submitted?'))return;await upsertStudentStatus(a,'submitted');await renderStudentHomework();}

  function openAssignedContent(a){
    document.getElementById('gcseAuthClose')?.click();
    if(a.assignment_type==='custom')return;
    if(['topic','lesson','quiz','revision'].includes(a.assignment_type)&&a.content_ref&&typeof window.openTopic==='function'){
      window.openTopic(a.content_ref);
      setTimeout(()=>{
        if(a.assignment_type==='lesson') document.querySelector('#contentTabs [data-tab="lessons"]')?.click();
        if(a.assignment_type==='quiz') document.querySelector('#contentTabs [data-tab="quiz"]')?.click();
        if(a.assignment_type==='revision') document.querySelector('#contentTabs [data-tab="exam"]')?.click();
        if(a.assignment_type==='lesson'&&a.content_item){setTimeout(()=>{[...document.querySelectorAll('.lesson-card')].find(card=>card.querySelector('.lesson-card-title')?.textContent?.trim()===a.content_item)?.querySelector('[data-open-lesson]')?.click();},80);}
      },80);
    }
  }

  function onAccountRendered(){setTimeout(renderStudentHomework,0);}
  function boot(){ensureModal();ensureButton();window.addEventListener('gcse-auth-changed',()=>{ensureButton();});window.addEventListener('gcse-access-changed',ensureButton);window.addEventListener('gcse-auth-account-rendered',onAccountRendered);const observer=new MutationObserver(()=>{ensureButton();if(state.loaded)updatePhase2Cards();});observer.observe(document.body,{childList:true,subtree:true});}

  window.GCSE_TEACHER_HOMEWORK={open:openTeacherHomework,refresh:async()=>{await loadTeacherAssignments();renderTeacherHomework();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
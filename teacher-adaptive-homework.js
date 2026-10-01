(() => {
  'use strict';

  const state = { previewKey:'', recommendations:[], decorating:false, teacherAssignments:[], teacherTargets:[] };
  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const uid = () => session()?.user?.id || '';
  const eligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleCase = v => String(v||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const fmtDate = value => value ? new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'No recent evidence';

  const DEFAULT_ROUTES = {
    support: {
      studentTitle:'Guided practice',
      instructions:'Start with the key vocabulary and a worked example. Complete the topic lesson, then use the quiz to check each step. Focus on explaining one scientific link at a time.'
    },
    core: {
      studentTitle:'Core practice',
      instructions:'Complete the selected topic practice and quiz. Show full working for calculations and use precise scientific vocabulary in explanations.'
    },
    stretch: {
      studentTitle:'Challenge practice',
      instructions:'Complete the topic practice, then tackle the higher-demand exam questions. Apply the science to unfamiliar contexts and justify each step in extended answers.'
    }
  };

  function setMessage(text,kind='info'){
    const box=document.querySelector('#gcseTeacherHomeworkModal [data-homework-message]');
    if(!box)return;
    box.hidden=!text; box.className=`teacher-status ${kind}`; box.textContent=text;
  }

  function selectedTopic(form){
    const raw=String(form?.elements?.content_choice?.value||'|');
    const [id,...rest]=raw.split('|');
    return { id:id||'', title:rest.join('|')||id||'Topic' };
  }

  function previewKey(form){
    const topic=selectedTopic(form);
    return [form?.elements?.class_id?.value||'',topic.id,form?.querySelector('[name="adaptive_support_max"]')?.value||'49',form?.querySelector('[name="adaptive_stretch_min"]')?.value||'80'].join('|');
  }

  function adaptivePanelHtml(){
    return `<section class="adaptive-homework-panel" data-adaptive-panel hidden>
      <div class="adaptive-homework-heading">
        <div><span class="adaptive-kicker">Phase 7 · Adaptive homework</span><h4>Personalise one homework for the whole class</h4><p>Recommendations use the latest relevant assessment or intervention evidence. They are not fixed ability labels and can be changed before or after publishing.</p></div>
        <button class="button" type="button" data-adaptive-preview>Preview student routes</button>
      </div>
      <div class="adaptive-thresholds">
        <label>Support up to %<input name="adaptive_support_max" type="number" min="0" max="98" value="49"></label>
        <label>Stretch from %<input name="adaptive_stretch_min" type="number" min="2" max="100" value="80"></label>
        <div><strong>Core</strong><span>Students between the two thresholds, plus students without enough recent evidence.</span></div>
      </div>
      <div class="adaptive-route-editor">
        <label><span><b>Support</b> Guided scaffold</span><textarea name="adaptive_support_instructions" rows="4">${esc(DEFAULT_ROUTES.support.instructions)}</textarea></label>
        <label><span><b>Core</b> Standard practice</span><textarea name="adaptive_core_instructions" rows="4">${esc(DEFAULT_ROUTES.core.instructions)}</textarea></label>
        <label><span><b>Stretch</b> Higher-demand application</span><textarea name="adaptive_stretch_instructions" rows="4">${esc(DEFAULT_ROUTES.stretch.instructions)}</textarea></label>
      </div>
      <div class="adaptive-preview" data-adaptive-preview-results><div class="adaptive-empty">Choose a class and topic, then preview the recommended routes.</div></div>
    </section>`;
  }

  function ensureAdaptiveForm(){
    const form=document.querySelector('#gcseTeacherHomeworkModal [data-homework-form]');
    if(!form) return;
    const type=form.elements.assignment_type;
    if(type && !type.querySelector('option[value="adaptive"]')){
      const option=document.createElement('option'); option.value='adaptive'; option.textContent='Adaptive homework';
      type.appendChild(option);
    }
    if(!form.querySelector('[data-adaptive-panel]')){
      const courseLabel=form.elements.content_choice?.closest('label');
      courseLabel?.insertAdjacentHTML('afterend',adaptivePanelHtml());
    }
    if(form.dataset.adaptiveBound==='true') return;
    form.dataset.adaptiveBound='true';
    const panel=form.querySelector('[data-adaptive-panel]');
    const audience=form.elements.audience_mode;
    const updateMode=()=>{
      const active=type?.value==='adaptive';
      panel.hidden=!active;
      if(audience){audience.disabled=active;if(active)audience.value='class';}
      if(active){setTimeout(()=>{if(form.elements.content_choice&&!form.elements.content_choice.value)form.elements.content_choice.selectedIndex=0;},0);}
    };
    const invalidate=()=>{state.previewKey='';state.recommendations=[];const target=panel?.querySelector('[data-adaptive-preview-results]');if(target)target.innerHTML='<div class="adaptive-empty">Recommendations changed. Preview the routes again before publishing.</div>';};
    type?.addEventListener('change',()=>{updateMode();invalidate();});
    form.elements.class_id?.addEventListener('change',invalidate);
    form.elements.content_choice?.addEventListener('change',invalidate);
    panel?.querySelector('[name="adaptive_support_max"]')?.addEventListener('input',invalidate);
    panel?.querySelector('[name="adaptive_stretch_min"]')?.addEventListener('input',invalidate);
    panel?.querySelector('[data-adaptive-preview]')?.addEventListener('click',()=>previewRecommendations(form));
    updateMode();
  }

  function evidenceText(row){
    if(row.evidencePercent==null) return 'No recent topic evidence · Core recommended';
    const source=row.evidenceSource==='intervention'?'Intervention re-test':'Assessment';
    return `${source} ${row.evidencePercent}% · ${fmtDate(row.evidenceAt)}`;
  }

  function renderPreview(form,rows){
    const box=form.querySelector('[data-adaptive-preview-results]'); if(!box)return;
    const counts={support:0,core:0,stretch:0}; rows.forEach(r=>counts[r.recommendedPathway]=(counts[r.recommendedPathway]||0)+1);
    box.innerHTML=`<div class="adaptive-preview-summary"><span><b>${counts.support||0}</b> Support</span><span><b>${counts.core||0}</b> Core</span><span><b>${counts.stretch||0}</b> Stretch</span><small>${rows.length} joined students</small></div>
      <div class="adaptive-preview-table">${rows.map(r=>`<article data-adaptive-preview-student="${esc(r.studentId)}"><div><strong>${esc(r.displayName||r.email||'Student')}</strong><span>${esc(evidenceText(r))}</span></div><label>Route<select data-adaptive-student-path data-recommended="${esc(r.recommendedPathway)}"><option value="support" ${r.recommendedPathway==='support'?'selected':''}>Support</option><option value="core" ${r.recommendedPathway==='core'?'selected':''}>Core</option><option value="stretch" ${r.recommendedPathway==='stretch'?'selected':''}>Stretch</option></select></label></article>`).join('')}</div>`;
  }

  async function previewRecommendations(form){
    const client=sb(); if(!client)return;
    const classId=form.elements.class_id.value; const topic=selectedTopic(form);
    const supportMax=Number(form.querySelector('[name="adaptive_support_max"]')?.value||49);
    const stretchMin=Number(form.querySelector('[name="adaptive_stretch_min"]')?.value||80);
    if(!classId){setMessage('Choose a class before previewing adaptive routes.','error');return;}
    if(!topic.id){setMessage('Choose a topic before previewing adaptive routes.','error');return;}
    if(!Number.isFinite(supportMax)||!Number.isFinite(stretchMin)||supportMax<0||stretchMin>100||supportMax>=stretchMin){setMessage('Use valid thresholds with Support below Stretch.','error');return;}
    const button=form.querySelector('[data-adaptive-preview]'); if(button){button.disabled=true;button.textContent='Analysing…';}
    const {data,error}=await client.rpc('gcse_adaptive_homework_recommendations',{p_class_id:classId,p_topic_id:topic.id,p_support_max:supportMax,p_stretch_min:stretchMin});
    if(button){button.disabled=false;button.textContent='Preview student routes';}
    if(error){setMessage(error.message||'Could not build adaptive recommendations.','error');return;}
    state.previewKey=previewKey(form); state.recommendations=Array.isArray(data)?data:[];
    renderPreview(form,state.recommendations);
    setMessage(state.recommendations.length?'Adaptive routes are ready to review.':'This class has no joined students yet.',state.recommendations.length?'success':'error');
  }

  function adaptiveConfig(form){
    return {
      support:{studentTitle:DEFAULT_ROUTES.support.studentTitle,instructions:String(form.querySelector('[name="adaptive_support_instructions"]')?.value||'').trim()},
      core:{studentTitle:DEFAULT_ROUTES.core.studentTitle,instructions:String(form.querySelector('[name="adaptive_core_instructions"]')?.value||'').trim()},
      stretch:{studentTitle:DEFAULT_ROUTES.stretch.studentTitle,instructions:String(form.querySelector('[name="adaptive_stretch_instructions"]')?.value||'').trim()}
    };
  }

  async function createAdaptive(form){
    const client=sb(); if(!client||!uid())return;
    if(state.previewKey!==previewKey(form)) await previewRecommendations(form);
    if(state.previewKey!==previewKey(form)||!state.recommendations.length)return;
    const fd=new FormData(form); const topic=selectedTopic(form);
    const overrides={};
    form.querySelectorAll('[data-adaptive-preview-student]').forEach(row=>{
      const select=row.querySelector('[data-adaptive-student-path]');
      if(select && select.value!==select.dataset.recommended) overrides[row.dataset.adaptivePreviewStudent]=select.value;
    });
    const payload={
      title:String(fd.get('title')||'').trim(),instructions:String(fd.get('instructions')||'').trim(),topicTitle:topic.title,
      availableFrom:new Date(String(fd.get('available_from'))).toISOString(),dueAt:new Date(String(fd.get('due_at'))).toISOString(),
      status:String(fd.get('status')||'published'),minScore:fd.get('min_score')===''?null:Number(fd.get('min_score')),
      maxAttempts:fd.get('max_attempts')===''?null:Number(fd.get('max_attempts')),
      supportMax:Number(form.querySelector('[name="adaptive_support_max"]')?.value||49),stretchMin:Number(form.querySelector('[name="adaptive_stretch_min"]')?.value||80),
      config:adaptiveConfig(form),overrides
    };
    const submit=form.querySelector('button[type="submit"]'); if(submit){submit.disabled=true;submit.textContent='Creating personalised routes…';}
    const {data,error}=await client.rpc('gcse_create_adaptive_homework',{p_class_id:String(fd.get('class_id')||''),p_topic_id:topic.id,p_payload:payload});
    if(error){if(submit){submit.disabled=false;submit.textContent='Set homework';}setMessage(error.message||'Adaptive homework could not be created.','error');return;}
    state.previewKey='';state.recommendations=[];
    await window.GCSE_TEACHER_HOMEWORK?.refresh?.();
    setMessage(`${data?.title||'Adaptive homework'} created: ${data?.routes?.support||0} Support, ${data?.routes?.core||0} Core, ${data?.routes?.stretch||0} Stretch.`,'success');
    scheduleDecorate();
  }

  async function loadTeacherAdaptive(){
    if(!eligible()||!uid()||!sb())return;
    const client=sb();
    const [assignments,targets]=await Promise.all([
      client.from('gcse_assignments').select('id,title,adaptive_mode,adaptive_topic_id,adaptive_config,adaptive_support_max,adaptive_stretch_min').eq('teacher_id',uid()).eq('adaptive_mode',true),
      client.from('gcse_assignment_targets').select('assignment_id,student_id,adaptive_pathway,adaptive_override').eq('teacher_id',uid()).not('adaptive_pathway','is',null)
    ]);
    if(assignments.error||targets.error)return;
    state.teacherAssignments=assignments.data||[]; state.teacherTargets=targets.data||[];
  }

  function routeCounts(assignmentId){
    const counts={support:0,core:0,stretch:0};
    state.teacherTargets.filter(t=>t.assignment_id===assignmentId).forEach(t=>{if(counts[t.adaptive_pathway]!=null)counts[t.adaptive_pathway]++;});
    return counts;
  }

  async function decorateTeacherCards(){
    if(!eligible())return;
    await loadTeacherAdaptive();
    for(const a of state.teacherAssignments){
      const toggle=document.querySelector(`#gcseTeacherHomeworkModal [data-assignment-toggle="${CSS.escape(a.id)}"]`);
      const card=toggle?.closest('.teacher-homework-card'); if(!card)continue;
      const counts=routeCounts(a.id);
      let summary=card.querySelector('[data-adaptive-summary]');
      if(!summary){summary=document.createElement('div');summary.dataset.adaptiveSummary='true';summary.className='adaptive-card-summary';card.querySelector('.teacher-homework-progress')?.insertAdjacentElement('beforebegin',summary);}
      summary.innerHTML=`<span class="adaptive-badge">Adaptive</span><span><b>${counts.support}</b> Support</span><span><b>${counts.core}</b> Core</span><span><b>${counts.stretch}</b> Stretch</span>`;
      const actions=card.querySelector('.teacher-homework-card-actions');
      if(actions&&!actions.querySelector('[data-adaptive-manage]')){
        const btn=document.createElement('button');btn.type='button';btn.className='button';btn.dataset.adaptiveManage=a.id;btn.textContent='Manage routes';btn.addEventListener('click',()=>openManage(a.id));actions.prepend(btn);
      }
    }
  }

  function ensureManageModal(){
    let modal=document.getElementById('gcseAdaptiveHomeworkModal'); if(modal)return modal;
    modal=document.createElement('div');modal.id='gcseAdaptiveHomeworkModal';modal.className='adaptive-manage-modal';modal.hidden=true;
    modal.innerHTML='<div class="adaptive-manage-backdrop" data-adaptive-close></div><section class="adaptive-manage-shell" role="dialog" aria-modal="true" aria-labelledby="adaptiveManageTitle"><header><div><span class="adaptive-kicker">Adaptive homework</span><h2 id="adaptiveManageTitle">Manage student routes</h2></div><button type="button" data-adaptive-close aria-label="Close">×</button></header><div class="adaptive-manage-body" data-adaptive-manage-body></div></section>';
    document.body.appendChild(modal);modal.querySelectorAll('[data-adaptive-close]').forEach(x=>x.addEventListener('click',()=>{modal.hidden=true;}));return modal;
  }

  async function openManage(assignmentId){
    const modal=ensureManageModal(); const body=modal.querySelector('[data-adaptive-manage-body]');modal.hidden=false;body.innerHTML='<div class="teacher-loading">Loading personalised routes…</div>';
    const {data,error}=await sb().rpc('gcse_teacher_adaptive_assignment',{p_assignment_id:assignmentId});
    if(error){body.innerHTML=`<div class="teacher-empty"><strong>Routes could not be loaded.</strong><p>${esc(error.message||'Try again.')}</p></div>`;return;}
    renderManage(data);
  }

  function renderManage(data){
    const body=document.querySelector('#gcseAdaptiveHomeworkModal [data-adaptive-manage-body]');if(!body)return;
    const students=Array.isArray(data?.students)?data.students:[];
    const counts={support:0,core:0,stretch:0};students.forEach(s=>counts[s.pathway]=(counts[s.pathway]||0)+1);
    body.innerHTML=`<div class="adaptive-manage-summary"><div><strong>${esc(data?.title||'Adaptive homework')}</strong><span>${esc(data?.topicTitle||data?.topicId||'')}</span></div><div><b>${counts.support||0}</b> Support · <b>${counts.core||0}</b> Core · <b>${counts.stretch||0}</b> Stretch</div></div>
      <p class="adaptive-manage-note">Routes are recommendations from recent learning evidence, not permanent ability groups. Change any route whenever your professional judgement says a different level is more appropriate.</p>
      <div class="adaptive-manage-list">${students.map(s=>`<article data-manage-student="${esc(s.studentId)}"><div><strong>${esc(s.displayName||s.email||'Student')}</strong><span>${esc(evidenceText(s))}</span><small>${s.teacherOverride?'Teacher override':'Recommended route'} · ${esc(titleCase(s.submissionStatus||'not_started'))}</small></div><label>Current route<select data-manage-path><option value="support" ${s.pathway==='support'?'selected':''}>Support</option><option value="core" ${s.pathway==='core'?'selected':''}>Core</option><option value="stretch" ${s.pathway==='stretch'?'selected':''}>Stretch</option></select></label></article>`).join('')||'<div class="adaptive-empty">No students are linked to this assignment.</div>'}</div>`;
    body.querySelectorAll('[data-manage-path]').forEach(select=>select.addEventListener('change',async()=>{
      const row=select.closest('[data-manage-student]');select.disabled=true;
      const {error}=await sb().rpc('gcse_set_adaptive_pathway',{p_assignment_id:data.assignmentId,p_student_id:row.dataset.manageStudent,p_pathway:select.value});
      select.disabled=false;
      if(error){setMessage(error.message||'Route could not be changed.','error');await openManage(data.assignmentId);return;}
      setMessage('Student route updated.','success');await openManage(data.assignmentId);scheduleDecorate();
    }));
  }

  async function decorateStudentCards(){
    if(eligible()||!uid()||!sb())return;
    const panel=document.querySelector('[data-student-homework]');if(!panel)return;
    const client=sb();
    const [assignments,targets]=await Promise.all([
      client.from('gcse_assignments').select('id,adaptive_mode,adaptive_config').eq('adaptive_mode',true),
      client.from('gcse_assignment_targets').select('assignment_id,adaptive_pathway,adaptive_override').eq('student_id',uid()).not('adaptive_pathway','is',null)
    ]);
    if(assignments.error||targets.error)return;
    const targetMap=new Map((targets.data||[]).map(t=>[t.assignment_id,t]));
    for(const a of (assignments.data||[])){
      const button=panel.querySelector(`[data-homework-start="${CSS.escape(a.id)}"],[data-homework-submit="${CSS.escape(a.id)}"]`);
      const card=button?.closest('.student-homework-card');if(!card||card.querySelector('[data-student-adaptive-route]'))continue;
      const target=targetMap.get(a.id);const path=target?.adaptive_pathway||'core';const route=a.adaptive_config?.[path]||DEFAULT_ROUTES.core;
      const box=document.createElement('div');box.dataset.studentAdaptiveRoute='true';box.className='student-adaptive-route';
      box.innerHTML=`<span>Personalised practice</span><strong>${esc(route.studentTitle||'Your practice route')}</strong><p>${esc(route.instructions||DEFAULT_ROUTES.core.instructions)}</p><small>Chosen from recent learning evidence and teacher judgement. This route can change as you progress.</small>`;
      card.querySelector('.student-homework-actions')?.insertAdjacentElement('beforebegin',box);
    }
  }

  let decorateTimer=0;
  function scheduleDecorate(){
    clearTimeout(decorateTimer);decorateTimer=setTimeout(async()=>{
      if(state.decorating)return;state.decorating=true;
      try{ensureAdaptiveForm();await decorateTeacherCards();await decorateStudentCards();}catch(error){console.warn('[Adaptive Homework]',error);}finally{state.decorating=false;}
    },30);
  }

  document.addEventListener('submit',event=>{
    const form=event.target?.matches?.('#gcseTeacherHomeworkModal [data-homework-form]')?event.target:null;
    if(!form||form.elements.assignment_type?.value!=='adaptive')return;
    event.preventDefault();event.stopImmediatePropagation();createAdaptive(form);
  },true);

  function boot(){
    ensureAdaptiveForm();scheduleDecorate();
    window.addEventListener('gcse-auth-changed',scheduleDecorate);
    window.addEventListener('gcse-access-changed',scheduleDecorate);
    window.addEventListener('gcse-auth-account-rendered',scheduleDecorate);
    const observer=new MutationObserver(scheduleDecorate);observer.observe(document.body,{childList:true,subtree:true});
  }

  window.GCSE_ADAPTIVE_HOMEWORK={preview:previewRecommendations,openManage,refresh:scheduleDecorate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
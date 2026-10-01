(() => {
  'use strict';

  const state = {
    classes: [],
    members: [],
    activeClassId: null,
    loading: false,
    message: ''
  };

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const client = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const teacherEligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const activeClasses = () => state.classes.filter(c => !c.archived);
  const classById = id => state.classes.find(c => c.id === id) || null;
  const membersFor = id => state.members.filter(m => m.class_id === id);
  const titleCase = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  function setStatus(message = '', kind = 'info') {
    state.message = message;
    const box = document.querySelector('[data-teacher-status]');
    if (!box) return;
    box.hidden = !message;
    box.className = `teacher-status ${kind}`;
    box.textContent = message;
  }

  function randomCode(length = 8) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
  }

  function ensureTeacherButton() {
    const topbar = document.querySelector('.topbar-inner');
    if (!topbar) return;
    let button = document.getElementById('gcseTeacherPlatformButton');
    if (!teacherEligible()) {
      button?.remove();
      return;
    }
    if (button) return;
    button = document.createElement('button');
    button.id = 'gcseTeacherPlatformButton';
    button.type = 'button';
    button.className = 'teacher-platform-button';
    button.innerHTML = '<span aria-hidden="true">🏫</span><span>Teacher</span>';
    button.addEventListener('click', openTeacherPlatform);
    const accountControls = document.querySelector('.gcse-auth-controls');
    (accountControls || topbar).insertAdjacentElement(accountControls ? 'beforebegin' : 'beforeend', button);
  }

  function ensureTeacherModal() {
    let modal = document.getElementById('gcseTeacherPlatformModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'gcseTeacherPlatformModal';
    modal.className = 'teacher-platform-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="teacher-platform-backdrop" data-teacher-close></div>
      <section class="teacher-platform-shell" role="dialog" aria-modal="true" aria-labelledby="teacherPlatformTitle">
        <header class="teacher-platform-header">
          <div><span class="teacher-eyebrow">GCSE Science</span><h2 id="teacherPlatformTitle">Teacher Platform</h2><p>Classes, joining codes and student rosters.</p></div>
          <button type="button" class="teacher-close" data-teacher-close aria-label="Close teacher platform">×</button>
        </header>
        <div class="teacher-platform-body" data-teacher-body></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-teacher-close]').forEach(el => el.addEventListener('click', closeTeacherPlatform));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) closeTeacherPlatform();
    });
    return modal;
  }

  async function openTeacherPlatform() {
    if (!session()) {
      window.GCSE_AUTH?.open?.();
      return;
    }
    if (!teacherEligible()) {
      window.GCSE_ACCESS?.showUpgrade?.('teacher_tools', 'Teacher Platform');
      return;
    }
    const modal = ensureTeacherModal();
    modal.hidden = false;
    document.body.classList.add('teacher-platform-open');
    renderLoading();
    await loadTeacherData();
  }

  function closeTeacherPlatform() {
    const modal = document.getElementById('gcseTeacherPlatformModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('teacher-platform-open');
  }

  function renderLoading() {
    const body = document.querySelector('[data-teacher-body]');
    if (body) body.innerHTML = '<div class="teacher-loading">Loading your classes…</div>';
  }

  async function loadTeacherData() {
    const sb = client();
    const user = session()?.user;
    if (!sb || !user?.id) return;
    state.loading = true;
    const [classResult, memberResult] = await Promise.all([
      sb.from('gcse_classes').select('id,teacher_id,name,year_group,subject,course_type,join_code,archived,created_at,updated_at').eq('teacher_id', user.id).order('archived', { ascending:true }).order('created_at', { ascending:false }),
      sb.from('gcse_class_members').select('id,class_id,teacher_id,student_id,student_email,display_name,status,source,joined_at,created_at,updated_at').eq('teacher_id', user.id).order('display_name', { ascending:true }).order('student_email', { ascending:true })
    ]);
    state.loading = false;
    if (classResult.error || memberResult.error) {
      console.error('[Teacher Platform] load failed', classResult.error || memberResult.error);
      renderTeacherError('Teacher data could not be loaded. Check your account has Teacher access.');
      return;
    }
    state.classes = classResult.data || [];
    state.members = memberResult.data || [];
    if (state.activeClassId && !classById(state.activeClassId)) state.activeClassId = null;
    renderTeacherPlatform();
  }

  function renderTeacherError(message) {
    const body = document.querySelector('[data-teacher-body]');
    if (body) body.innerHTML = `<div class="teacher-empty"><strong>Could not open Teacher Platform</strong><p>${esc(message)}</p></div>`;
  }

  function renderTeacherPlatform() {
    const body = document.querySelector('[data-teacher-body]');
    if (!body) return;
    if (state.activeClassId) renderClassWorkspace(body, classById(state.activeClassId));
    else renderTeacherOverview(body);
  }

  function renderTeacherOverview(body) {
    const classes = state.classes;
    const active = activeClasses();
    const joined = state.members.filter(m => m.status === 'joined');
    const uniqueStudents = new Set(joined.map(m => m.student_id || m.student_email)).size;
    const invites = state.members.filter(m => m.status === 'invited').length;

    body.innerHTML = `
      <div class="teacher-summary-grid">
        <article><span>Active classes</span><strong>${active.length}</strong><small>${classes.filter(c => c.archived).length} archived</small></article>
        <article><span>Students</span><strong>${uniqueStudents}</strong><small>Joined across your classes</small></article>
        <article><span>Pending</span><strong>${invites}</strong><small>Invited roster entries</small></article>
      </div>
      <div class="teacher-toolbar">
        <div><h3>Your classes</h3><p>Create multiple classes and give students a joining code.</p></div>
        <button type="button" class="button primary" data-create-class>+ Create class</button>
      </div>
      <div data-teacher-status class="teacher-status" hidden></div>
      <div class="teacher-class-grid">
        ${classes.length ? classes.map(c => {
          const roster = membersFor(c.id);
          const joinedCount = roster.filter(m => m.status === 'joined').length;
          return `<button type="button" class="teacher-class-card ${c.archived ? 'archived' : ''}" data-open-class="${c.id}">
            <span class="teacher-class-subject">${esc(titleCase(c.subject))}</span>
            <strong>${esc(c.name)}</strong>
            <small>${esc(c.year_group)} · ${esc(titleCase(c.course_type))}</small>
            <div><span>${joinedCount} student${joinedCount===1?'':'s'}</span><span>${c.archived ? 'Archived' : `Code ${esc(c.join_code)}`}</span></div>
          </button>`;
        }).join('') : '<div class="teacher-empty"><strong>No classes yet</strong><p>Create your first GCSE Science class to generate a student joining code.</p></div>'}
      </div>
      <div class="teacher-create-panel" data-create-panel hidden>
        <form data-create-class-form class="teacher-form-grid">
          <label>Class name<input name="name" required maxlength="100" placeholder="Year 10A Science"></label>
          <label>Year group<select name="year_group"><option>Year 9</option><option selected>Year 10</option><option>Year 11</option><option>Other</option></select></label>
          <label>Subject<select name="subject"><option value="science">Science</option><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
          <label>Course<select name="course_type"><option value="combined">Combined Science</option><option value="triple">Triple / Separate Sciences</option><option value="mixed">Mixed</option></select></label>
          <div class="teacher-form-actions"><button class="button primary" type="submit">Create class</button><button class="button" type="button" data-cancel-create>Cancel</button></div>
        </form>
      </div>`;

    body.querySelector('[data-create-class]')?.addEventListener('click', () => { body.querySelector('[data-create-panel]').hidden = false; body.querySelector('[name="name"]')?.focus(); });
    body.querySelector('[data-cancel-create]')?.addEventListener('click', () => { body.querySelector('[data-create-panel]').hidden = true; });
    body.querySelector('[data-create-class-form]')?.addEventListener('submit', createClass);
    body.querySelectorAll('[data-open-class]').forEach(button => button.addEventListener('click', () => { state.activeClassId = button.dataset.openClass; renderTeacherPlatform(); }));
  }

  async function createClass(event) {
    event.preventDefault();
    const sb = client();
    const user = session()?.user;
    if (!sb || !user?.id) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      teacher_id:user.id,
      name:String(data.get('name') || '').trim(),
      year_group:String(data.get('year_group') || 'Year 10'),
      subject:String(data.get('subject') || 'science'),
      course_type:String(data.get('course_type') || 'combined')
    };
    const button = form.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Creating…'; }
    const { data:created, error } = await sb.from('gcse_classes').insert(payload).select('id').single();
    if (error) {
      if (button) { button.disabled = false; button.textContent = 'Create class'; }
      setStatus(error.message || 'Could not create the class.', 'error');
      return;
    }
    await loadTeacherData();
    if (created?.id) { state.activeClassId = created.id; renderTeacherPlatform(); }
  }

  function renderClassWorkspace(body, klass) {
    if (!klass) { state.activeClassId = null; return renderTeacherOverview(body); }
    const roster = membersFor(klass.id);
    const activeOptions = activeClasses().filter(c => c.id !== klass.id);
    body.innerHTML = `
      <button type="button" class="teacher-back" data-back-classes>← All classes</button>
      <div class="teacher-class-header">
        <div><span class="teacher-eyebrow">${esc(titleCase(klass.subject))}</span><h3>${esc(klass.name)}</h3><p>${esc(klass.year_group)} · ${esc(titleCase(klass.course_type))}</p></div>
        <div class="teacher-code-card"><span>Student joining code</span><strong>${esc(klass.join_code)}</strong><div><button type="button" data-copy-code>Copy</button><button type="button" data-regenerate-code>New code</button></div></div>
      </div>
      <div data-teacher-status class="teacher-status" hidden></div>
      <div class="teacher-class-actions">
        <button type="button" class="button" data-toggle-manual>+ Add student</button>
        <label class="button teacher-file-button">Import CSV / Excel<input type="file" accept=".csv,.xlsx,.xls" data-roster-file hidden></label>
        <button type="button" class="button" data-toggle-archive>${klass.archived ? 'Restore class' : 'Archive class'}</button>
      </div>
      <div class="teacher-add-student" data-manual-panel hidden>
        <form data-manual-student-form>
          <label>Student name<input name="display_name" placeholder="Student name"></label>
          <label>Email address<input name="student_email" type="email" required placeholder="student@school.org"></label>
          <button class="button primary" type="submit">Add to roster</button>
        </form>
        <p>The student will be linked automatically when they sign in with this email, or they can use the joining code.</p>
      </div>
      <div class="teacher-roster-head"><div><h3>Class roster</h3><p>${roster.filter(m=>m.status==='joined').length} joined · ${roster.filter(m=>m.status==='invited').length} pending</p></div></div>
      <div class="teacher-roster">
        ${roster.length ? roster.map(member => `<article class="teacher-student-row" data-member-id="${member.id}">
          <div class="teacher-student-avatar">${esc((member.display_name || member.student_email || '?').charAt(0).toUpperCase())}</div>
          <div class="teacher-student-main"><strong>${esc(member.display_name || member.student_email.split('@')[0])}</strong><span>${esc(member.student_email)}</span></div>
          <span class="teacher-member-status ${member.status}">${member.status === 'joined' ? 'Joined' : 'Pending'}</span>
          ${activeOptions.length ? `<label class="teacher-move-label">Move<select data-move-member><option value="">Choose class…</option>${activeOptions.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>` : ''}
          <button type="button" class="teacher-remove" data-remove-member>Remove</button>
        </article>`).join('') : '<div class="teacher-empty"><strong>No students yet</strong><p>Add students manually, import a roster, or share the joining code.</p></div>'}
      </div>`;

    body.querySelector('[data-back-classes]')?.addEventListener('click', () => { state.activeClassId = null; renderTeacherPlatform(); });
    body.querySelector('[data-copy-code]')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(klass.join_code); setStatus('Joining code copied.', 'success'); }
      catch { setStatus(`Joining code: ${klass.join_code}`, 'info'); }
    });
    body.querySelector('[data-regenerate-code]')?.addEventListener('click', () => regenerateJoinCode(klass));
    body.querySelector('[data-toggle-manual]')?.addEventListener('click', () => { const panel=body.querySelector('[data-manual-panel]'); panel.hidden=!panel.hidden; });
    body.querySelector('[data-manual-student-form]')?.addEventListener('submit', event => addStudent(event, klass));
    body.querySelector('[data-roster-file]')?.addEventListener('change', event => importRoster(event, klass));
    body.querySelector('[data-toggle-archive]')?.addEventListener('click', () => toggleArchive(klass));
    body.querySelectorAll('[data-member-id]').forEach(row => {
      row.querySelector('[data-remove-member]')?.addEventListener('click', () => removeMember(row.dataset.memberId));
      row.querySelector('[data-move-member]')?.addEventListener('change', event => { if (event.target.value) moveMember(row.dataset.memberId, event.target.value); });
    });
  }

  async function regenerateJoinCode(klass) {
    const sb = client();
    if (!sb) return;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = randomCode();
      const { error } = await sb.from('gcse_classes').update({ join_code:code, updated_at:new Date().toISOString() }).eq('id', klass.id);
      if (!error) { await loadTeacherData(); setStatus('A new joining code has been created.', 'success'); return; }
      if (!String(error.message || '').toLowerCase().includes('duplicate')) { setStatus(error.message, 'error'); return; }
    }
    setStatus('Could not generate a unique joining code.', 'error');
  }

  async function addStudent(event, klass) {
    event.preventDefault();
    const sb = client();
    const user = session()?.user;
    if (!sb || !user?.id) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('student_email') || '').trim().toLowerCase();
    const name = String(data.get('display_name') || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setStatus('Enter a valid student email address.', 'error'); return; }
    const payload = { class_id:klass.id, teacher_id:user.id, student_email:email, display_name:name || null, status:'invited', source:'manual', updated_at:new Date().toISOString() };
    const { error } = await sb.from('gcse_class_members').upsert(payload, { onConflict:'class_id,student_email_key', ignoreDuplicates:false });
    if (error) { setStatus(error.message || 'Could not add the student.', 'error'); return; }
    event.currentTarget.reset();
    await loadTeacherData();
    setStatus('Student added to the roster.', 'success');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i=0; i<text.length; i+=1) {
      const ch=text[i], next=text[i+1];
      if (ch==='"' && quoted && next==='"') { cell+='"'; i+=1; continue; }
      if (ch==='"') { quoted=!quoted; continue; }
      if (ch===',' && !quoted) { row.push(cell); cell=''; continue; }
      if ((ch==='\n' || ch==='\r') && !quoted) {
        if (ch==='\r' && next==='\n') i+=1;
        row.push(cell); if (row.some(v=>String(v).trim())) rows.push(row); row=[]; cell=''; continue;
      }
      cell+=ch;
    }
    row.push(cell); if (row.some(v=>String(v).trim())) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows.shift().map(h => String(h).trim().toLowerCase());
    return rows.map(values => Object.fromEntries(headers.map((h,i)=>[h, values[i] ?? ''])));
  }

  async function ensureXlsx() {
    if (window.XLSX) return window.XLSX;
    await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-teacher-xlsx]');
      if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',reject,{once:true}); return; }
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.dataset.teacherXlsx='true'; script.onload=resolve; script.onerror=reject; document.head.appendChild(script);
    });
    return window.XLSX;
  }

  function rosterRows(rawRows) {
    const value = (row, keys) => { for (const key of keys) if (row[key] != null && String(row[key]).trim()) return String(row[key]).trim(); return ''; };
    const seen = new Set();
    return rawRows.map(row => {
      const normal = Object.fromEntries(Object.entries(row).map(([k,v]) => [String(k).trim().toLowerCase(), v]));
      const email = value(normal, ['email','email address','student email','school email','e-mail']).toLowerCase();
      const explicitName = value(normal, ['name','student','student name','full name']);
      const first = value(normal, ['first name','firstname','forename']);
      const last = value(normal, ['last name','lastname','surname']);
      return { email, name:explicitName || `${first} ${last}`.trim() };
    }).filter(item => /^\S+@\S+\.\S+$/.test(item.email) && !seen.has(item.email) && seen.add(item.email));
  }

  async function importRoster(event, klass) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatus('Reading roster…', 'info');
    try {
      let rawRows = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        rawRows = parseCsv(await file.text());
      } else {
        const XLSX = await ensureXlsx();
        const workbook = XLSX.read(await file.arrayBuffer(), { type:'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(sheet, { defval:'' });
      }
      const rows = rosterRows(rawRows);
      if (!rows.length) { setStatus('No valid student email addresses were found. Use columns such as Student Name and Email.', 'error'); return; }
      const sb=client(), user=session()?.user;
      const payload = rows.map(item => ({ class_id:klass.id, teacher_id:user.id, student_email:item.email, display_name:item.name || null, status:'invited', source:'csv', updated_at:new Date().toISOString() }));
      const { error } = await sb.from('gcse_class_members').upsert(payload, { onConflict:'class_id,student_email_key', ignoreDuplicates:false });
      if (error) throw error;
      await loadTeacherData();
      setStatus(`${rows.length} student${rows.length===1?'':'s'} imported.`, 'success');
    } catch (error) {
      console.error('[Teacher Platform] roster import failed', error);
      setStatus('The roster could not be imported. Check the file has a student email column.', 'error');
    }
  }

  async function moveMember(memberId, newClassId) {
    const sb=client();
    if(!sb) return;
    const { error } = await sb.from('gcse_class_members').update({ class_id:newClassId, updated_at:new Date().toISOString() }).eq('id', memberId);
    if(error){ setStatus(error.message?.includes('duplicate') ? 'That student is already in the selected class.' : (error.message || 'Could not move the student.'), 'error'); return; }
    await loadTeacherData(); setStatus('Student moved to the new class.', 'success');
  }

  async function removeMember(memberId) {
    if (!confirm('Remove this student from the class?')) return;
    const sb=client();
    if(!sb) return;
    const { error } = await sb.from('gcse_class_members').delete().eq('id', memberId);
    if(error){ setStatus(error.message || 'Could not remove the student.', 'error'); return; }
    await loadTeacherData(); setStatus('Student removed from the class.', 'success');
  }

  async function toggleArchive(klass) {
    const sb=client();
    if(!sb) return;
    const archived=!klass.archived;
    const { error } = await sb.from('gcse_classes').update({ archived, updated_at:new Date().toISOString() }).eq('id',klass.id);
    if(error){ setStatus(error.message || 'Could not update the class.', 'error'); return; }
    await loadTeacherData(); setStatus(archived ? 'Class archived.' : 'Class restored.', 'success');
  }

  async function edgeAction(action, body={}) {
    const sb=client();
    if(!sb) return { data:null, error:new Error('Supabase is unavailable.') };
    return await sb.functions.invoke('gcse-teacher-platform', { body:{ action, ...body } });
  }

  async function claimInvites() {
    if (!session()?.user) return;
    try { await edgeAction('claim_invites'); } catch (_) {}
  }

  async function loadStudentClasses() {
    const sb=client(), user=session()?.user;
    if(!sb || !user?.id) return [];
    const membership = await sb.from('gcse_class_members').select('class_id,status').eq('student_id',user.id).eq('status','joined');
    if(membership.error || !membership.data?.length) return [];
    const ids=[...new Set(membership.data.map(m=>m.class_id))];
    const classes=await sb.from('gcse_classes').select('id,name,year_group,subject,course_type,archived').in('id',ids).order('name');
    return classes.error ? [] : (classes.data || []);
  }

  async function renderStudentClassPanel() {
    const content=document.getElementById('gcseAuthContent');
    if(!content || !session()?.user || teacherEligible()) return;
    content.querySelector('[data-student-class-panel]')?.remove();
    const panel=document.createElement('section');
    panel.className='student-class-panel';
    panel.dataset.studentClassPanel='true';
    panel.innerHTML=`<div class="student-class-head"><div><span class="gcse-auth-eyebrow">School classes</span><h3>Join your teacher's class</h3></div></div><form data-join-class-form><input name="join_code" maxlength="12" autocomplete="off" placeholder="Enter class code" required><button type="submit" class="gcse-auth-secondary">Join class</button></form><div data-student-class-message class="teacher-status" hidden></div><div data-student-classes class="student-class-list"><span>Loading classes…</span></div>`;
    const signout=content.querySelector('#gcseSignOut');
    signout?.insertAdjacentElement('beforebegin',panel);
    panel.querySelector('[data-join-class-form]')?.addEventListener('submit', async event=>{
      event.preventDefault();
      const form=event.currentTarget; const code=String(new FormData(form).get('join_code')||'').trim().toUpperCase();
      const message=panel.querySelector('[data-student-class-message]');
      message.hidden=false; message.className='teacher-status info'; message.textContent='Joining class…';
      const { data,error }=await edgeAction('join_class',{join_code:code});
      if(error || data?.error){ message.className='teacher-status error'; message.textContent=(data?.error==='class_not_found'?'That joining code was not found.':data?.error==='invalid_join_code'?'Enter a valid joining code.':'Could not join the class.'); return; }
      form.reset(); message.className='teacher-status success'; message.textContent=`Joined ${data.class?.name || 'class'}.`;
      await refreshStudentClassList(panel);
    });
    await refreshStudentClassList(panel);
  }

  async function refreshStudentClassList(panel) {
    const list=panel.querySelector('[data-student-classes]');
    if(!list) return;
    const classes=await loadStudentClasses();
    list.innerHTML=classes.length ? classes.map(c=>`<article><div><strong>${esc(c.name)}</strong><span>${esc(c.year_group)} · ${esc(titleCase(c.subject))}</span></div><button type="button" data-leave-class="${c.id}">Leave</button></article>`).join('') : '<span>You have not joined a class yet.</span>';
    list.querySelectorAll('[data-leave-class]').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Leave this class?')) return;
      await edgeAction('leave_class',{class_id:button.dataset.leaveClass});
      await refreshStudentClassList(panel);
    }));
  }

  async function onAuthChanged(event) {
    ensureTeacherButton();
    if(event.detail?.signedIn){ await claimInvites(); }
    if(document.getElementById('gcseAuthModal') && !document.getElementById('gcseAuthModal').hidden) renderStudentClassPanel();
  }

  function boot() {
    ensureTeacherModal();
    ensureTeacherButton();
    window.addEventListener('gcse-auth-changed', onAuthChanged);
    window.addEventListener('gcse-access-changed', () => { ensureTeacherButton(); renderStudentClassPanel(); });
    window.addEventListener('gcse-auth-account-rendered', () => renderStudentClassPanel());
  }

  window.GCSE_TEACHER_PLATFORM = {
    open: openTeacherPlatform,
    refresh: loadTeacherData,
    isEligible: teacherEligible
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

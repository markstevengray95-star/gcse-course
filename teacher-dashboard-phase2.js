(() => {
  'use strict';

  const state = {
    classes: [],
    members: [],
    students: {},
    loadedAt: 0,
    loading: false,
    observer: null
  };

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const eligible = () => Boolean(window.GCSE_AUTH?.getProfile?.()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const course = () => window.GCSE_COURSE_DATA || { topics:[] };
  const day = 86400000;
  const now = () => Date.now();
  const pct = (n, d) => d ? Math.max(0, Math.min(100, Math.round((n / d) * 100))) : 0;
  const titleCase = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const topicById = id => course().topics?.find(t => t.id === id) || null;
  const membersFor = classId => state.members.filter(m => m.class_id === classId);
  const joinedFor = classId => membersFor(classId).filter(m => m.status === 'joined' && m.student_id);

  function stableLessonKey(topicId, title) {
    return `lesson:${topicId}:${encodeURIComponent(title || 'untitled')}`;
  }

  function relevantTopics(klass) {
    return (course().topics || []).filter(topic => klass.subject === 'science' || topic.subject === klass.subject);
  }

  function relevantLessonKeys(klass) {
    const keys = [];
    for (const topic of relevantTopics(klass)) {
      for (const lesson of (topic.lessons || [])) {
        const title = Array.isArray(lesson) ? lesson[0] : lesson?.title;
        const scope = Array.isArray(lesson) ? lesson[1] : lesson?.scope;
        if (!title) continue;
        if (klass.course_type === 'combined' && scope === 'triple') continue;
        keys.push(stableLessonKey(topic.id, title));
      }
    }
    return keys;
  }

  function studentProgress(studentId, klass) {
    const data = state.students[studentId];
    if (!data) return 0;
    const relevant = relevantLessonKeys(klass);
    if (!relevant.length) return 0;
    const completed = new Set(data.completed_lessons || []);
    return pct(relevant.filter(key => completed.has(key)).length, relevant.length);
  }

  function classProgress(klass) {
    const joined = joinedFor(klass.id);
    if (!joined.length) return 0;
    return Math.round(joined.reduce((sum, member) => sum + studentProgress(member.student_id, klass), 0) / joined.length);
  }

  function activityTime(studentId) {
    const value = state.students[studentId]?.last_activity;
    return value ? new Date(value).getTime() : 0;
  }

  function classActive7d(klass) {
    const threshold = now() - (7 * day);
    return joinedFor(klass.id).filter(member => activityTime(member.student_id) >= threshold).length;
  }

  function topicEvidenceForClass(klass) {
    const allowed = new Set(relevantTopics(klass).map(t => t.id));
    const aggregate = new Map();
    for (const member of joinedFor(klass.id)) {
      const scores = state.students[member.student_id]?.topic_scores || {};
      for (const [topicId, row] of Object.entries(scores)) {
        if (!allowed.has(topicId) || !Number.isFinite(Number(row?.score))) continue;
        const item = aggregate.get(topicId) || { total:0, count:0, attempts:0 };
        item.total += Number(row.score);
        item.count += 1;
        item.attempts += Number(row.attempts || 0);
        aggregate.set(topicId, item);
      }
    }
    return [...aggregate.entries()].map(([topicId, item]) => ({
      topicId,
      score:Math.round(item.total / item.count),
      students:item.count,
      attempts:item.attempts
    })).sort((a,b) => a.score - b.score || b.students - a.students);
  }

  function weakestTopic(klass) {
    return topicEvidenceForClass(klass)[0] || null;
  }

  function classMistakes(klass) {
    return joinedFor(klass.id).reduce((sum, member) => sum + Number(state.students[member.student_id]?.mistakes?.unresolved || 0), 0);
  }

  function classMockAverage(klass) {
    const values = [];
    for (const member of joinedFor(klass.id)) {
      const mocks = state.students[member.student_id]?.mocks || [];
      const relevant = mocks.find(m => klass.subject === 'science' || m.subject === klass.subject);
      if (relevant && Number.isFinite(Number(relevant.percent))) values.push(Number(relevant.percent));
    }
    return values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : null;
  }

  function ragForProgress(value) {
    if (value >= 70) return { label:'Secure', className:'secure' };
    if (value >= 40) return { label:'Developing', className:'developing' };
    return { label:'Needs support', className:'support' };
  }

  function attentionForMember(member, klass) {
    const data = state.students[member.student_id] || {};
    const reasons = [];
    const progress = studentProgress(member.student_id, klass);
    const joinedAt = member.joined_at ? new Date(member.joined_at).getTime() : 0;
    const joinedDays = joinedAt ? (now() - joinedAt) / day : 0;
    const last = activityTime(member.student_id);
    if (joinedDays >= 7 && progress < 20) reasons.push(`Course progress ${progress}%`);
    if (last && now() - last > 14 * day) reasons.push('No recorded activity for 14+ days');
    if (Number(data.mistakes?.unresolved || 0) >= 5) reasons.push(`${data.mistakes.unresolved} unresolved mistakes`);
    const mock = (data.mocks || []).find(m => klass.subject === 'science' || m.subject === klass.subject);
    if (mock && Number(mock.percent) < 50) reasons.push(`Latest mock ${mock.percent}%`);
    const allowed = new Set(relevantTopics(klass).map(t => t.id));
    const weak = Object.entries(data.topic_scores || {})
      .filter(([id,row]) => allowed.has(id) && Number(row?.attempts || 0) >= 2 && Number(row?.score) < 45)
      .sort((a,b)=>Number(a[1]?.score)-Number(b[1]?.score))[0];
    if (weak) {
      const topic = topicById(weak[0]);
      reasons.push(`${topic?.code || weak[0]} ${Number(weak[1]?.score)}% evidence`);
    }
    return reasons;
  }

  function attentionStudents() {
    const rows = [];
    for (const klass of state.classes.filter(c => !c.archived)) {
      for (const member of joinedFor(klass.id)) {
        const reasons = attentionForMember(member, klass);
        if (!reasons.length) continue;
        rows.push({ member, klass, reasons, progress:studentProgress(member.student_id, klass) });
      }
    }
    const seen = new Set();
    return rows.filter(row => {
      const key = row.member.student_id || row.member.id;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a,b) => b.reasons.length - a.reasons.length || a.progress - b.progress);
  }

  function overallProgress() {
    let total = 0, count = 0;
    for (const klass of state.classes.filter(c => !c.archived)) {
      for (const member of joinedFor(klass.id)) {
        total += studentProgress(member.student_id, klass);
        count += 1;
      }
    }
    return count ? Math.round(total / count) : 0;
  }

  function uniqueJoinedStudents() {
    return new Set(state.members.filter(m => m.status === 'joined' && m.student_id).map(m => m.student_id)).size;
  }

  function overallWeakTopics(limit = 5) {
    const aggregate = new Map();
    for (const klass of state.classes.filter(c => !c.archived)) {
      for (const item of topicEvidenceForClass(klass)) {
        const row = aggregate.get(item.topicId) || { weighted:0, students:0 };
        row.weighted += item.score * item.students;
        row.students += item.students;
        aggregate.set(item.topicId, row);
      }
    }
    return [...aggregate.entries()].map(([topicId,row]) => ({ topicId, score:Math.round(row.weighted / row.students), students:row.students }))
      .sort((a,b)=>a.score-b.score || b.students-a.students).slice(0,limit);
  }

  function recentActivity(limit = 6) {
    const rows = [];
    for (const klass of state.classes.filter(c => !c.archived)) {
      for (const member of joinedFor(klass.id)) {
        const time = activityTime(member.student_id);
        if (time) rows.push({ member, klass, time });
      }
    }
    const seen = new Set();
    return rows.sort((a,b)=>b.time-a.time).filter(row => {
      if (seen.has(row.member.student_id)) return false;
      seen.add(row.member.student_id); return true;
    }).slice(0,limit);
  }

  function relativeTime(timestamp) {
    if (!timestamp) return 'No activity yet';
    const delta = Math.max(0, now() - timestamp);
    if (delta < 3600000) return `${Math.max(1,Math.floor(delta/60000))} min ago`;
    if (delta < day) return `${Math.floor(delta/3600000)} hr ago`;
    const days = Math.floor(delta/day);
    return `${days} day${days===1?'':'s'} ago`;
  }

  async function edgeDashboard() {
    const client = sb();
    if (!client) throw new Error('Supabase unavailable');
    const { data, error } = await client.functions.invoke('gcse-teacher-platform', { body:{ action:'teacher_dashboard' } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.students || {};
  }

  async function load(force = false) {
    if (!eligible() || !session()?.user?.id || state.loading) return;
    if (!force && state.loadedAt && now() - state.loadedAt < 45000) return;
    const client = sb();
    if (!client) return;
    state.loading = true;
    try {
      const userId = session().user.id;
      const [classes, members, students] = await Promise.all([
        client.from('gcse_classes').select('id,teacher_id,name,year_group,subject,course_type,join_code,archived,created_at,updated_at').eq('teacher_id',userId).order('archived',{ascending:true}).order('created_at',{ascending:false}),
        client.from('gcse_class_members').select('id,class_id,teacher_id,student_id,student_email,display_name,status,source,joined_at,created_at,updated_at').eq('teacher_id',userId),
        edgeDashboard()
      ]);
      if (classes.error) throw classes.error;
      if (members.error) throw members.error;
      state.classes = classes.data || [];
      state.members = members.data || [];
      state.students = students || {};
      state.loadedAt = now();
    } catch (error) {
      console.error('[Teacher Dashboard Phase 2] load failed', error);
    } finally {
      state.loading = false;
    }
  }

  function classCard(klass) {
    const joined = joinedFor(klass.id);
    const progress = classProgress(klass);
    const weak = weakestTopic(klass);
    const weakTopic = weak ? topicById(weak.topicId) : null;
    const mock = classMockAverage(klass);
    return `<button type="button" class="teacher-insight-class" data-phase2-open-class="${esc(klass.id)}">
      <div class="teacher-insight-class-head"><div><span>${esc(klass.year_group)} · ${esc(titleCase(klass.subject))}</span><strong>${esc(klass.name)}</strong></div><b>${progress}%</b></div>
      <div class="teacher-insight-progress"><i style="width:${progress}%"></i></div>
      <div class="teacher-insight-class-meta"><span>${joined.length} joined</span><span>${classActive7d(klass)} active this week</span><span>${classMistakes(klass)} open mistakes</span></div>
      <div class="teacher-insight-class-foot"><span>${weakTopic ? `Weakest: ${esc(weakTopic.code)} ${esc(weakTopic.title)} (${weak.score}%)` : 'Weakest topic: not enough evidence yet'}</span><span>${mock == null ? 'No mock evidence yet' : `Latest mock average ${mock}%`}</span></div>
    </button>`;
  }

  function renderDashboardBlock() {
    const body = document.querySelector('#gcseTeacherPlatformModal [data-teacher-body]');
    if (!body || body.querySelector('[data-phase2-dashboard]')) return;
    if (body.querySelector('.teacher-back')) return;
    const phase1Summary = body.querySelector('.teacher-summary-grid');
    if (!phase1Summary) return;

    const active = state.classes.filter(c => !c.archived);
    const attention = attentionStudents();
    const weak = overallWeakTopics();
    const recent = recentActivity();
    const block = document.createElement('section');
    block.dataset.phase2Dashboard = 'true';
    block.className = 'teacher-phase2-dashboard';
    block.innerHTML = `
      <div class="teacher-dashboard-heading">
        <div><span class="teacher-eyebrow">Teacher overview</span><h3>Science progress dashboard</h3><p>Live learning evidence from your joined students.</p></div>
        <button type="button" class="button" data-phase2-refresh>Refresh data</button>
      </div>
      <div class="teacher-dashboard-kpis">
        <article><span>Students</span><strong>${uniqueJoinedStudents()}</strong><small>joined accounts</small></article>
        <article><span>Average progress</span><strong>${overallProgress()}%</strong><small>relevant lesson completion</small></article>
        <article><span>Needs attention</span><strong>${attention.length}</strong><small>students with learning signals</small></article>
        <article><span>Active this week</span><strong>${new Set(state.members.filter(m=>m.status==='joined' && m.student_id && activityTime(m.student_id)>=now()-7*day).map(m=>m.student_id)).size}</strong><small>recorded activity</small></article>
      </div>
      <div class="teacher-dashboard-grid">
        <section class="teacher-dashboard-panel teacher-dashboard-classes">
          <div class="teacher-dashboard-panel-head"><div><h4>Class progress</h4><p>Completion, activity and weakest curriculum evidence.</p></div></div>
          <div class="teacher-insight-class-list">${active.length ? active.map(classCard).join('') : '<div class="teacher-empty compact">Create a class to start tracking progress.</div>'}</div>
        </section>
        <section class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel-head"><div><h4>Needs attention</h4><p>Signals only — use professional judgement alongside the data.</p></div><span>${attention.length}</span></div>
          <div class="teacher-attention-list">${attention.length ? attention.slice(0,7).map(row=>{
            const rag=ragForProgress(row.progress);
            return `<article><span class="teacher-rag ${rag.className}">${rag.label}</span><div><strong>${esc(row.member.display_name || row.member.student_email || 'Student')}</strong><small>${esc(row.klass.name)} · ${row.reasons.map(esc).join(' · ')}</small></div><b>${row.progress}%</b></article>`;
          }).join('') : '<div class="teacher-empty compact">No students are currently being flagged by the available learning evidence.</div>'}</div>
        </section>
        <section class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel-head"><div><h4>Weakest topics</h4><p>Class evidence aggregated from quizzes, practice and mocks.</p></div></div>
          <div class="teacher-weak-topic-list">${weak.length ? weak.map(item=>{
            const topic=topicById(item.topicId);
            return `<article><div><strong>${esc(topic?.code || item.topicId)} · ${esc(topic?.title || 'Topic')}</strong><small>${item.students} student${item.students===1?'':'s'} with evidence</small></div><span>${item.score}%</span><div class="teacher-mini-bar"><i style="width:${item.score}%"></i></div></article>`;
          }).join('') : '<div class="teacher-empty compact">Topic strengths will appear once students complete marked practice.</div>'}</div>
        </section>
        <section class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel-head"><div><h4>Recent learning activity</h4><p>Most recent synced GCSE learning activity.</p></div></div>
          <div class="teacher-recent-list">${recent.length ? recent.map(row=>`<article><div class="teacher-student-avatar">${esc((row.member.display_name || row.member.student_email || '?').charAt(0).toUpperCase())}</div><div><strong>${esc(row.member.display_name || row.member.student_email || 'Student')}</strong><small>${esc(row.klass.name)}</small></div><span>${relativeTime(row.time)}</span></article>`).join('') : '<div class="teacher-empty compact">No synced student activity yet.</div>'}</div>
        </section>
      </div>
      <section class="teacher-dashboard-panel teacher-work-overview">
        <div class="teacher-dashboard-panel-head"><div><h4>Homework & assessments</h4><p>The dashboard is ready to surface deadlines and completion as assignment tools are added.</p></div></div>
        <div class="teacher-work-cards"><article><span>Homework due</span><strong>0</strong><small>No homework assignments created yet</small></article><article><span>Assessments upcoming</span><strong>0</strong><small>No assessments scheduled yet</small></article><article><span>Overdue submissions</span><strong>0</strong><small>Submission tracking starts with assignments</small></article></div>
      </section>`;

    phase1Summary.insertAdjacentElement('beforebegin', block);
    phase1Summary.hidden = true;
    block.querySelector('[data-phase2-refresh]')?.addEventListener('click', async event => {
      const button = event.currentTarget; button.disabled=true; button.textContent='Refreshing…';
      await load(true); document.querySelector('[data-phase2-dashboard]')?.remove(); renderDashboardBlock();
    });
    block.querySelectorAll('[data-phase2-open-class]').forEach(button => button.addEventListener('click', () => {
      body.querySelector(`.teacher-class-card[data-open-class="${CSS.escape(button.dataset.phase2OpenClass)}"]`)?.click();
    }));
  }

  function renderClassInsights() {
    const body = document.querySelector('#gcseTeacherPlatformModal [data-teacher-body]');
    if (!body || body.querySelector('[data-phase2-class-insights]')) return;
    const back = body.querySelector('.teacher-back');
    const classHeader = body.querySelector('.teacher-class-header');
    if (!back || !classHeader) return;
    const className = classHeader.querySelector('h3')?.textContent?.trim();
    const klass = state.classes.find(c => c.name === className) || null;
    if (!klass) return;
    const joined = joinedFor(klass.id);
    const progress = classProgress(klass);
    const weak = weakestTopic(klass);
    const weakTopic = weak ? topicById(weak.topicId) : null;
    const mockAverage = classMockAverage(klass);
    const panel = document.createElement('section');
    panel.dataset.phase2ClassInsights = 'true';
    panel.className = 'teacher-class-insights';
    panel.innerHTML = `<article><span>Average progress</span><strong>${progress}%</strong><small>${joined.length} joined student${joined.length===1?'':'s'}</small></article><article><span>Active this week</span><strong>${classActive7d(klass)}</strong><small>students with synced activity</small></article><article><span>Open mistakes</span><strong>${classMistakes(klass)}</strong><small>unresolved across the class</small></article><article><span>Weakest topic</span><strong>${weakTopic ? esc(weakTopic.code) : '—'}</strong><small>${weakTopic ? `${esc(weakTopic.title)} · ${weak.score}%` : 'Not enough evidence yet'}</small></article><article><span>Mock average</span><strong>${mockAverage == null ? '—' : `${mockAverage}%`}</strong><small>${mockAverage == null ? 'No relevant mock results yet' : 'latest available result per student'}</small></article>`;
    classHeader.insertAdjacentElement('afterend', panel);

    body.querySelectorAll('.teacher-student-row[data-member-id]').forEach(row => {
      const member = state.members.find(m => m.id === row.dataset.memberId);
      if (!member || member.status !== 'joined' || !member.student_id) return;
      const value = studentProgress(member.student_id, klass);
      const data = state.students[member.student_id] || {};
      const rag = ragForProgress(value);
      const evidence = document.createElement('div');
      evidence.className = 'teacher-student-evidence';
      evidence.innerHTML = `<span class="teacher-rag ${rag.className}">${rag.label}</span><strong>${value}%</strong><small>${Number(data.mistakes?.unresolved || 0)} mistakes · ${data.mocks?.[0] ? `${data.mocks[0].percent}% mock` : 'no mock'}</small>`;
      row.querySelector('.teacher-student-main')?.appendChild(evidence);
    });
  }

  async function enhance() {
    const modal = document.getElementById('gcseTeacherPlatformModal');
    if (!modal || modal.hidden || !eligible()) return;
    const header = modal.querySelector('.teacher-platform-header p');
    if (header) header.textContent = 'Progress, classes, student activity and learning insights.';
    await load(false);
    renderDashboardBlock();
    renderClassInsights();
  }

  function watch() {
    const modal = document.getElementById('gcseTeacherPlatformModal');
    if (!modal || state.observer) return;
    state.observer = new MutationObserver(() => { window.clearTimeout(watch.timer); watch.timer = window.setTimeout(enhance, 30); });
    state.observer.observe(modal, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
  }
  watch.timer = 0;

  function boot() {
    watch();
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#gcseTeacherPlatformButton')) window.setTimeout(enhance, 40);
    });
    window.addEventListener('gcse-auth-changed', () => { state.loadedAt=0; window.setTimeout(()=>{watch();enhance();},50); });
    window.addEventListener('gcse-access-changed', () => window.setTimeout(()=>{watch();enhance();},50));
  }

  window.GCSE_TEACHER_DASHBOARD = {
    refresh: async () => { await load(true); document.querySelector('[data-phase2-dashboard]')?.remove(); document.querySelector('[data-phase2-class-insights]')?.remove(); enhance(); },
    getSnapshot: () => ({ classes:[...state.classes], members:[...state.members], students:JSON.parse(JSON.stringify(state.students)) })
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
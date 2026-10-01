(() => {
  'use strict';

  const sb = () => window.GCSE_AUTH?.client || null;
  const session = () => window.GCSE_AUTH?.getSession?.() || null;
  const profile = () => window.GCSE_AUTH?.getProfile?.() || null;
  const uid = () => session()?.user?.id || '';
  const teacherEligible = () => Boolean(profile()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  const now = () => Date.now();
  let dashboardBusy = false;
  let decorateTimer = null;

  function studentMessage(text, kind = 'error') {
    const box = document.querySelector('[data-student-homework-message]');
    if (!box) return;
    box.hidden = !text;
    box.className = `teacher-status ${kind}`;
    box.textContent = text;
  }

  async function secureHomeworkStatus(assignmentId, status, button) {
    const client = sb();
    if (!client || !uid()) return;
    const oldText = button?.textContent || '';
    if (button) {
      button.disabled = true;
      button.textContent = status === 'submitted' ? 'Submitting…' : 'Starting…';
    }
    const { error } = await client.rpc('gcse_set_assignment_submission_status', {
      p_assignment_id: assignmentId,
      p_status: status
    });
    if (button) {
      button.disabled = false;
      button.textContent = oldText;
    }
    if (error) {
      const friendly = error.message?.includes('assignment_unavailable')
        ? 'This assignment is not currently available.'
        : error.message?.includes('assignment_not_assigned')
          ? 'This assignment is not assigned to your account.'
          : 'Your homework status could not be saved. Please try again.';
      studentMessage(friendly, 'error');
      return false;
    }
    studentMessage(status === 'submitted' ? 'Homework marked as submitted.' : '', 'success');
    window.dispatchEvent(new CustomEvent('gcse-homework-status-changed', { detail: { assignmentId, status } }));
    window.dispatchEvent(new Event('gcse-auth-account-rendered'));
    return true;
  }

  function interceptOrdinaryHomework(event) {
    const button = event.target.closest?.('[data-homework-start],[data-homework-submit]');
    if (!button || button.dataset.auditHandling === 'true') return;

    // Phase 6 registers its capture listener before this script. Intervention buttons are
    // consumed there with stopImmediatePropagation, so only ordinary homework reaches here.
    const assignmentId = button.dataset.homeworkStart || button.dataset.homeworkSubmit;
    if (!assignmentId) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.dataset.auditHandling = 'true';

    const isSubmit = Boolean(button.dataset.homeworkSubmit);
    if (isSubmit && !window.confirm('Mark this homework as submitted?')) {
      button.dataset.auditHandling = '';
      return;
    }

    secureHomeworkStatus(assignmentId, isSubmit ? 'submitted' : 'in_progress', button)
      .then(ok => {
        if (ok && !isSubmit) {
          // Re-use the existing course-opening behaviour only after the secure status write.
          const card = button.closest('.student-homework-card');
          const title = card?.querySelector('strong')?.textContent?.trim();
          if (title) {
            const openButton = card.querySelector('[data-homework-start]');
            openButton?.setAttribute('data-secure-start-complete', 'true');
          }
        }
      })
      .finally(() => { button.dataset.auditHandling = ''; });
  }

  function assignmentRecipients(assignment, members, targets) {
    const joined = members.filter(m => m.class_id === assignment.class_id && m.status === 'joined' && m.student_id);
    if (assignment.audience_mode !== 'selected') return joined;
    const ids = new Set(targets.filter(t => t.assignment_id === assignment.id).map(t => t.student_id));
    return joined.filter(m => ids.has(m.student_id));
  }

  async function syncWorkOverview() {
    if (dashboardBusy || !teacherEligible() || !uid()) return;
    const overview = document.querySelector('[data-phase2-dashboard] .teacher-work-overview');
    if (!overview) return;
    dashboardBusy = true;
    try {
      const client = sb();
      if (!client) return;
      const userId = uid();
      const [assignments, targets, submissions, members, assessments] = await Promise.all([
        client.from('gcse_assignments').select('id,class_id,audience_mode,status,due_at,available_from').eq('teacher_id', userId),
        client.from('gcse_assignment_targets').select('assignment_id,student_id').eq('teacher_id', userId),
        client.from('gcse_assignment_submissions').select('assignment_id,student_id,status,submitted_at').eq('teacher_id', userId),
        client.from('gcse_class_members').select('class_id,student_id,status').eq('teacher_id', userId),
        client.from('gcse_assessments').select('id,status,opens_at,closes_at').eq('teacher_id', userId)
      ]);
      const error = assignments.error || targets.error || submissions.error || members.error || assessments.error;
      if (error) throw error;

      const assignmentRows = assignments.data || [];
      const targetRows = targets.data || [];
      const submissionRows = submissions.data || [];
      const memberRows = members.data || [];
      const assessmentRows = assessments.data || [];
      const submissionMap = new Map(submissionRows.map(s => [`${s.assignment_id}:${s.student_id}`, s]));
      const published = assignmentRows.filter(a => a.status === 'published');
      const dueSoon = published.filter(a => {
        const due = new Date(a.due_at).getTime();
        return due >= now() && due <= now() + 7 * 86400000;
      }).length;
      let overdue = 0;
      for (const a of published) {
        if (new Date(a.due_at).getTime() >= now()) continue;
        for (const m of assignmentRecipients(a, memberRows, targetRows)) {
          const s = submissionMap.get(`${a.id}:${m.student_id}`);
          if (s?.status !== 'submitted') overdue += 1;
        }
      }
      const upcoming = assessmentRows.filter(a => a.status === 'published' && new Date(a.closes_at).getTime() >= now()).length;

      const head = overview.querySelector('.teacher-dashboard-panel-head p');
      if (head) head.textContent = 'Live homework deadlines, completion and assessment windows from your classes.';
      const cards = overview.querySelector('.teacher-work-cards');
      if (cards) {
        cards.innerHTML = `
          <article data-phase3-homework-due><span>Homework due</span><strong>${dueSoon}</strong><small>${dueSoon ? 'due within 7 days' : 'No homework due this week'}</small></article>
          <article data-phase3-homework-published><span>Published homework</span><strong>${published.length}</strong><small>${published.length ? 'live assignments' : 'No assignments published'}</small></article>
          <article data-phase3-homework-overdue><span>Overdue submissions</span><strong>${overdue}</strong><small>${overdue ? 'student submissions overdue' : 'No overdue submissions'}</small></article>
          <article data-phase4-assessments><span>Assessments upcoming</span><strong>${upcoming}</strong><small>${upcoming ? 'published assessment windows' : 'No assessments scheduled'}</small></article>`;
      }
    } catch (error) {
      console.warn('[Teacher Platform Audit] Could not sync work overview', error);
    } finally {
      dashboardBusy = false;
    }
  }

  function clarifyHomeworkForm() {
    document.querySelectorAll('[data-homework-form]').forEach(form => {
      if (form.dataset.auditClarified === 'true') return;
      form.dataset.auditClarified = 'true';
      const score = form.querySelector('[name="min_score"]')?.closest('label');
      if (score?.firstChild) score.firstChild.textContent = 'Target score % (optional)';
      const attempts = form.querySelector('[name="max_attempts"]')?.closest('label');
      if (attempts?.firstChild) attempts.firstChild.textContent = 'Attempt limit (where supported)';
    });
  }

  function decorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => {
      clarifyHomeworkForm();
      syncWorkOverview();
    }, 80);
  }

  function boot() {
    // Capture phase ensures the legacy direct-write handler never performs the mutation.
    document.addEventListener('click', interceptOrdinaryHomework, true);
    window.addEventListener('gcse-auth-account-rendered', decorate);
    window.addEventListener('gcse-auth-changed', decorate);
    window.addEventListener('gcse-access-changed', decorate);
    window.addEventListener('gcse-homework-status-changed', decorate);
    const observer = new MutationObserver(records => {
      if (records.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (
        n.matches?.('[data-phase2-dashboard],[data-homework-form]') ||
        n.querySelector?.('[data-phase2-dashboard],[data-homework-form]')
      )))) decorate();
    });
    observer.observe(document.body, { childList:true, subtree:true });
    decorate();
  }

  window.GCSE_TEACHER_PLATFORM_AUDIT = { refreshDashboard: syncWorkOverview };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
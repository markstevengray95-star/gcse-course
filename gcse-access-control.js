(() => {
  'use strict';

  const FREE_PREVIEW = Object.freeze({
    topicIds: ['b1'],
    lessonIndexes: { b1: [0, 1, 2] },
    textbookTopicIds: ['b1'],
    simulationTopicIds: ['b1']
  });

  const DEFAULT_ENTITLEMENTS = Object.freeze({
    plan: 'free', access_active: false, is_admin: false, free_preview: true,
    full_course: false, textbook: false, notebook: false, simulations: false,
    presentations: false, progress_tools: false, revision_tools: false,
    required_practicals: false, exam_tools: false, exam_marker: false,
    question_generator: false, ai_coach: false, auto_marking: false,
    mastery_assessments: false, expert_challenges: false, advanced_progression: false,
    teacher_tools: false, teaching_plans: false, differentiation: false,
    classroom_controls: false
  });

  const TIER_RANK = { free: 0, plus: 1, pro: 2, teacher: 3 };
  const FEATURE_PLAN = {
    full_course: 'Plus', textbook: 'Plus', notebook: 'Plus', simulations: 'Plus',
    presentations: 'Plus', progress_tools: 'Plus', revision_tools: 'Plus',
    required_practicals: 'Pro', exam_tools: 'Pro', exam_marker: 'Pro',
    question_generator: 'Pro', ai_coach: 'Pro', auto_marking: 'Pro',
    mastery_assessments: 'Pro', expert_challenges: 'Pro', advanced_progression: 'Pro',
    teacher_tools: 'Teacher', teaching_plans: 'Teacher', differentiation: 'Teacher',
    classroom_controls: 'Teacher'
  };

  let entitlements = { ...DEFAULT_ENTITLEMENTS };
  let ready = false;
  let observer = null;
  let modal = null;

  const normalisePlan = value => {
    const raw = String(value || '').trim().toLowerCase().replace(/[_\s-]+/g, '');
    if (['teacher', 'school', 'schoolplan'].includes(raw)) return 'teacher';
    if (['pro', 'premium'].includes(raw)) return 'pro';
    if (['plus', 'full', 'fullcourse'].includes(raw)) return 'plus';
    return 'free';
  };

  const currentPlan = () => entitlements.is_admin ? 'teacher' : (entitlements.access_active ? normalisePlan(entitlements.plan) : 'free');
  const hasTier = required => (TIER_RANK[currentPlan()] || 0) >= (TIER_RANK[normalisePlan(required)] || 0);
  const can = feature => feature === 'free_preview' ? true : Boolean(entitlements.is_admin || entitlements[feature]);
  const activeTopicId = () => window.state?.activeTopicId || new URLSearchParams(location.search).get('topic') || null;
  const isFreeTopic = topicId => FREE_PREVIEW.topicIds.includes(String(topicId || ''));
  const isFreeLesson = (topicId, index) => (FREE_PREVIEW.lessonIndexes[String(topicId || '')] || []).includes(Number(index));

  function requirementForTab(tab, topicId = activeTopicId()) {
    if (tab === 'overview' || tab === 'quiz') return null;
    if (tab === 'lessons') return isFreeTopic(topicId) ? null : 'full_course';
    if (tab === 'textbook') return FREE_PREVIEW.textbookTopicIds.includes(String(topicId)) ? null : 'textbook';
    if (tab === 'simulation') return FREE_PREVIEW.simulationTopicIds.includes(String(topicId)) ? null : 'simulations';
    if (tab === 'practicals') return 'required_practicals';
    if (tab === 'exam') return 'exam_tools';
    if (tab === 'coach') return 'revision_tools';
    if (tab === 'activities' || tab === 'equations') return 'full_course';
    return 'full_course';
  }

  function requiredPlan(feature) {
    return FEATURE_PLAN[feature] || 'Plus';
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'gcse-access-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="gcse-access-backdrop" data-access-close></div>
      <section class="gcse-access-dialog" role="dialog" aria-modal="true" aria-labelledby="gcseAccessTitle">
        <button type="button" class="gcse-access-close" data-access-close aria-label="Close">×</button>
        <span class="gcse-access-lock-icon" aria-hidden="true">🔒</span>
        <span class="eyebrow">Plan access</span>
        <h2 id="gcseAccessTitle">Upgrade required</h2>
        <p data-access-message>This feature is not included in the Free plan.</p>
        <div class="gcse-access-actions">
          <button type="button" class="button primary" data-access-upgrade>View upgrade options</button>
          <button type="button" class="button" data-access-close>Not now</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-access-close]').forEach(button => button.addEventListener('click', closeLock));
    modal.querySelector('[data-access-upgrade]')?.addEventListener('click', () => {
      closeLock();
      window.GCSE_PLANS_AND_PAPERS?.openPlans?.();
    });
    return modal;
  }

  function showLock(feature = 'full_course', label = 'This feature') {
    const shell = ensureModal();
    const plan = requiredPlan(feature);
    shell.querySelector('[data-access-message]').textContent = `${label} requires the ${plan} plan or higher. Upgrade to unlock it.`;
    shell.hidden = false;
    document.body.classList.add('gcse-access-open');
    shell.querySelector('[data-access-upgrade]')?.focus();
  }

  function closeLock() {
    if (modal) modal.hidden = true;
    document.body.classList.remove('gcse-access-open');
  }

  function clearLock(el) {
    if (!el) return;
    el.classList.remove('gcse-access-locked');
    el.removeAttribute('aria-disabled');
    el.removeAttribute('data-gcse-required-feature');
    el.removeAttribute('data-gcse-required-plan');
    const badge = el.querySelector(':scope > .gcse-lock-badge');
    badge?.remove();
  }

  function markLock(el, feature, label) {
    if (!el) return;
    if (can(feature)) return clearLock(el);
    el.classList.add('gcse-access-locked');
    el.setAttribute('aria-disabled', 'true');
    el.dataset.gcseRequiredFeature = feature;
    el.dataset.gcseRequiredPlan = requiredPlan(feature);
    el.dataset.gcseLockedLabel = label || 'This feature';
    if (!el.querySelector(':scope > .gcse-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'gcse-lock-badge';
      badge.textContent = `🔒 ${requiredPlan(feature)}`;
      badge.setAttribute('aria-hidden', 'true');
      el.appendChild(badge);
    }
  }

  function decorateTopicCards() {
    document.querySelectorAll('[data-topic].topic-card').forEach(card => {
      const allowed = can('full_course') || isFreeTopic(card.dataset.topic);
      if (allowed) clearLock(card);
      else markLock(card, 'full_course', 'This topic');
    });
  }

  function decorateTabs() {
    const topicId = activeTopicId();
    document.querySelectorAll('#contentTabs [data-tab]').forEach(button => {
      const feature = requirementForTab(button.dataset.tab, topicId);
      if (!feature || can(feature)) clearLock(button);
      else markLock(button, feature, `${button.textContent.replace(/🔒\s*(Plus|Pro|Teacher)/g, '').trim()} section`);
    });
  }

  function decorateLessonControls() {
    const topicId = activeTopicId();
    document.querySelectorAll('[data-open-lesson]').forEach(button => {
      const allowed = can('full_course') || isFreeLesson(topicId, button.dataset.openLesson);
      if (allowed) clearLock(button);
      else markLock(button, 'full_course', 'This lesson');
    });
    document.querySelectorAll('[data-lesson]').forEach(input => {
      if (can('progress_tools')) clearLock(input);
      else markLock(input, 'progress_tools', 'Saving lesson progress');
    });
  }

  const selectorRules = [
    ['#notebookButton, #topicNotebookButton, #saveNote', 'notebook', 'Science notebook'],
    ['#completeTopicButton', 'progress_tools', 'Progress tracking'],
    ['.revision-mode, [data-revision-mode], [data-revision-root]', 'revision_tools', 'Revision tools'],
    ['.equation-coach, [data-equation-coach]', 'full_course', 'Equation Coach'],
    ['.practical-lesson, [data-practical-lesson], .practical-source-shell, [data-practical-source]', 'required_practicals', 'Required practical tools'],
    ['.lesson-exam-studio, [data-exam-studio], [data-exam-generator], [data-exam-marker]', 'exam_tools', 'Exam tools'],
    ['.phase24-expert-challenges, [data-expert-challenges], [data-expert-challenge]', 'expert_challenges', 'Expert challenges'],
    ['.course-completion-hub, [data-course-completion-hub], [data-certification]', 'advanced_progression', 'Course completion and certification'],
    ['.lesson-differentiation, [data-differentiation]', 'differentiation', 'Differentiation tools'],
    ['.lesson-teacher-mode, [data-teacher-mode], [data-teacher-controls]', 'teacher_tools', 'Teacher tools'],
    ['.presentation-teaching-tools, [data-presentation-teaching-tools], [data-presenter-controls]', 'classroom_controls', 'Presenter controls'],
    ['.phase23-team-quiz, [data-team-quiz]', 'classroom_controls', 'Live Team Quiz'],
    ['.lesson-mastery-actions, [data-mastery-actions], [data-mastery-assessment]', 'mastery_assessments', 'Mastery tools']
  ];

  function decorateFeatureShells() {
    selectorRules.forEach(([selector, feature, label]) => {
      document.querySelectorAll(selector).forEach(el => can(feature) ? clearLock(el) : markLock(el, feature, label));
    });
  }

  function decorate() {
    decorateTopicCards();
    decorateTabs();
    decorateLessonControls();
    decorateFeatureShells();
    document.documentElement.dataset.gcsePlan = currentPlan();
    document.documentElement.dataset.gcseAccessReady = ready ? 'true' : 'false';
  }

  function enforceCurrentView() {
    if (!ready) return;
    const topicId = activeTopicId();
    const topicView = document.getElementById('topicView');
    if (topicView && !topicView.hidden && topicId && !can('full_course') && !isFreeTopic(topicId)) {
      if (typeof window.closeTopic === 'function') window.closeTopic();
      showLock('full_course', 'This topic');
      return;
    }
    const tab = window.state?.activeTab;
    const feature = tab ? requirementForTab(tab, topicId) : null;
    if (feature && !can(feature)) {
      if (window.state) window.state.activeTab = 'overview';
      if (typeof window.renderTopic === 'function') window.renderTopic();
      showLock(feature, 'That section');
    }
  }

  function lockedTarget(target) {
    return target?.closest?.('.gcse-access-locked[data-gcse-required-feature]') || null;
  }

  function gateEvent(event) {
    const locked = lockedTarget(event.target);
    if (!locked) return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showLock(locked.dataset.gcseRequiredFeature, locked.dataset.gcseLockedLabel || 'This feature');
    return true;
  }

  document.addEventListener('click', gateEvent, true);
  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    gateEvent(event);
  }, true);

  // Guard direct calls and URL navigation as well as visible buttons.
  const wrapGlobals = () => {
    if (typeof window.openTopic === 'function' && !window.openTopic.__gcseAccessWrapped) {
      const original = window.openTopic;
      const wrapped = function(id) {
        if (!can('full_course') && !isFreeTopic(id)) {
          showLock('full_course', 'This topic');
          return;
        }
        return original.apply(this, arguments);
      };
      wrapped.__gcseAccessWrapped = true;
      window.openTopic = wrapped;
    }
    if (typeof window.renderTopicContent === 'function' && !window.renderTopicContent.__gcseAccessWrapped) {
      const original = window.renderTopicContent;
      const wrapped = function(topic) {
        const tab = window.state?.activeTab || 'overview';
        const feature = requirementForTab(tab, topic?.id);
        if (feature && !can(feature)) {
          if (window.state) window.state.activeTab = 'overview';
          showLock(feature, 'That section');
        }
        return original.call(this, topic);
      };
      wrapped.__gcseAccessWrapped = true;
      window.renderTopicContent = wrapped;
    }
  };

  async function refreshEntitlements(session) {
    ready = false;
    entitlements = { ...DEFAULT_ENTITLEMENTS };
    const client = window.GCSE_AUTH?.client;
    const signedIn = Boolean(session || window.GCSE_AUTH?.getSession?.());
    if (client && signedIn) {
      const { data, error } = await client.rpc('gcse_get_entitlements');
      if (error) {
        console.warn('[GCSE Access] Could not verify entitlements; defaulting to Free.', error.message);
      } else if (data && typeof data === 'object') {
        entitlements = { ...DEFAULT_ENTITLEMENTS, ...data };
      }
    }
    ready = true;
    wrapGlobals();
    decorate();
    enforceCurrentView();
    window.dispatchEvent(new CustomEvent('gcse-access-changed', { detail: { entitlements: { ...entitlements }, plan: currentPlan() } }));
  }

  window.addEventListener('gcse-auth-changed', event => refreshEntitlements(event.detail?.signedIn ? window.GCSE_AUTH?.getSession?.() : null));
  window.addEventListener('gcse-home-rendered', decorate);
  window.addEventListener('gcse-plan-changed', () => refreshEntitlements(window.GCSE_AUTH?.getSession?.()));

  function boot() {
    ensureModal();
    wrapGlobals();
    observer = new MutationObserver(() => decorate());
    observer.observe(document.body, { childList: true, subtree: true });
    refreshEntitlements(window.GCSE_AUTH?.getSession?.());
  }

  window.GCSE_ACCESS = {
    getEntitlements: () => ({ ...entitlements }),
    getCurrentPlan: currentPlan,
    can,
    hasTier,
    freePreview: FREE_PREVIEW,
    refresh: () => refreshEntitlements(window.GCSE_AUTH?.getSession?.()),
    showUpgrade: showLock
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

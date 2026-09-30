(() => {
  const data = window.GCSE_COURSE_DATA;
  if (!data?.topics) return;

  const PLANS = [
    {
      id: 'free', name: 'Free', monthly: '£0', annual: '£0',
      strap: 'Try the course before upgrading.',
      features: ['A selection of GCSE Science lessons', 'Limited textbook previews', 'A small selection of simulations', 'Basic course navigation']
    },
    {
      id: 'plus', name: 'Plus', monthly: '£4.99/month', annual: '£39.99/year',
      strap: 'The complete student learning course.',
      features: ['Full Biology, Chemistry and Physics course', 'Full digital textbook', 'Science notebook', 'All standard simulations', 'Progress and revision tools']
    },
    {
      id: 'pro', name: 'Pro', monthly: '£7.99/month', annual: '£59.99/year',
      strap: 'Everything for independent exam preparation.',
      features: ['Everything in Plus', 'Exam marking tools', 'Exam-question generator', 'Advanced feedback and practice tools', 'New premium student features']
    },
    {
      id: 'teacher', name: 'Teacher', monthly: null, annual: '£89/year',
      strap: 'Pro access plus classroom teaching tools.',
      features: ['Everything in Pro', 'Teacher toolkit', 'Teaching plans', 'Differentiation and questioning resources', 'Classroom and presenter controls']
    }
  ];
  const rank = Object.fromEntries(PLANS.map((p, i) => [p.id, i]));
  const normalisePlan = value => {
    const raw = String(value || '').trim().toLowerCase().replace(/[_\s-]+/g, '');
    if (['teacher', 'teacherplan', 'school', 'schoolplan'].includes(raw)) return 'teacher';
    if (['pro', 'premium', 'studentpro'].includes(raw)) return 'pro';
    if (['plus', 'full', 'fullcourse', 'student'].includes(raw)) return 'plus';
    return 'free';
  };
  const readStoredPlan = () => {
    const keys = ['gcse-science-entitlement', 'gcse-science-plan', 'subscription_plan'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return parsed;
        if (parsed?.plan || parsed?.tier || parsed?.subscriptionPlan) return parsed.plan || parsed.tier || parsed.subscriptionPlan;
      } catch { return raw; }
    }
    return null;
  };
  const detectPlan = () => normalisePlan(
    window.GCSE_AUTH?.getProfile?.()?.plan ||
    window.GCSE_ACCOUNT?.plan ||
    window.GCSE_ACCOUNT?.tier ||
    window.GCSE_AUTH?.currentUser?.plan ||
    window.GCSE_AUTH?.user?.plan ||
    window.currentUser?.subscriptionPlan ||
    window.currentUser?.plan ||
    readStoredPlan()
  );

  let currentPlan = detectPlan();
  let activePaper = 'biology-1';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const planById = id => PLANS.find(p => p.id === id) || PLANS[0];

  function ensureTopPlanBadge() {
    const top = document.querySelector('.topbar-inner');
    if (!top) return;
    let button = top.querySelector('[data-plan-badge]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'account-plan-badge';
      button.dataset.planBadge = 'true';
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', openPlans);
      const progress = top.querySelector('.top-progress');
      if (progress) top.insertBefore(button, progress); else top.appendChild(button);
    }
    const plan = planById(currentPlan);
    button.innerHTML = `<span>${esc(plan.name)}</span><small>Plan</small><b aria-hidden="true">›</b>`;
    button.setAttribute('aria-label', `${plan.name} plan. View plan options.`);
  }

  function planCardsHtml() {
    return PLANS.map(plan => {
      const isCurrent = plan.id === currentPlan;
      const isBelow = rank[plan.id] < rank[currentPlan];
      const price = plan.monthly ? `<strong>${esc(plan.monthly)}</strong><span>or ${esc(plan.annual)}</span>` : `<strong>${esc(plan.annual)}</strong>`;
      return `<article class="plan-card ${isCurrent ? 'current' : ''}" data-plan-card="${plan.id}">
        <div class="plan-card-head"><div><span class="plan-name">${esc(plan.name)}</span>${isCurrent ? '<em>Current plan</em>' : ''}</div><div class="plan-price">${price}</div></div>
        <p>${esc(plan.strap)}</p>
        <ul>${plan.features.map(f => `<li>✓ ${esc(f)}</li>`).join('')}</ul>
        <button type="button" data-plan-action="${plan.id}" ${isCurrent || isBelow ? 'disabled' : ''}>${isCurrent ? 'Current plan' : isBelow ? 'Included already' : `View ${esc(plan.name)}`}</button>
      </article>`;
    }).join('');
  }

  function ensurePlanModal() {
    let modal = document.querySelector('[data-plan-modal]');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'plan-modal-shell';
    modal.dataset.planModal = 'true';
    modal.hidden = true;
    modal.innerHTML = `<div class="plan-modal-backdrop" data-plan-close></div><section class="plan-modal" role="dialog" aria-modal="true" aria-labelledby="planModalTitle">
      <header><div><span class="eyebrow">Your GCSE Science access</span><h2 id="planModalTitle">Choose the plan that fits you</h2><p>Your current access is highlighted. Moving to a paid plan must be confirmed through the account billing system.</p></div><button type="button" class="plan-close" data-plan-close aria-label="Close plans">×</button></header>
      <div class="plan-grid" data-plan-grid></div>
      <p class="plan-action-status" data-plan-status aria-live="polite"></p>
    </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-plan-close]').forEach(el => el.addEventListener('click', closePlans));
    modal.addEventListener('click', event => {
      const button = event.target.closest('[data-plan-action]');
      if (!button || button.disabled) return;
      requestUpgrade(button.dataset.planAction, modal);
    });
    return modal;
  }

  function renderPlans() {
    const modal = ensurePlanModal();
    const grid = modal.querySelector('[data-plan-grid]');
    if (grid) grid.innerHTML = planCardsHtml();
  }
  function openPlans() {
    renderPlans();
    const modal = ensurePlanModal();
    modal.hidden = false;
    document.body.classList.add('plan-modal-open');
    modal.querySelector('.plan-close')?.focus();
  }
  function closePlans() {
    const modal = document.querySelector('[data-plan-modal]');
    if (modal) modal.hidden = true;
    document.body.classList.remove('plan-modal-open');
    document.querySelector('[data-plan-badge]')?.focus();
  }
  function requestUpgrade(planId, modal) {
    const status = modal.querySelector('[data-plan-status]');
    const plan = planById(planId);
    window.dispatchEvent(new CustomEvent('gcse-plan-upgrade-request', { detail: { plan: planId } }));
    if (typeof window.GCSE_SUBSCRIPTIONS?.checkout === 'function') {
      window.GCSE_SUBSCRIPTIONS.checkout(planId);
      return;
    }
    if (typeof window.GCSE_BILLING?.checkout === 'function') {
      window.GCSE_BILLING.checkout(planId);
      return;
    }
    if (status) status.textContent = `${plan.name} selected. Complete the change through your signed-in account billing page when checkout is available.`;
    modal.querySelector(`[data-plan-card="${planId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const subjectMeta = {
    biology: { name: 'Biology', icon: '🧬' }, chemistry: { name: 'Chemistry', icon: '⚗️' }, physics: { name: 'Physics', icon: '⚡' }
  };
  function paperModel(subject, paper) {
    const topicList = data.topics.filter(t => t.subject === subject && Number(t.paper) === Number(paper));
    const lessons = topicList.reduce((n, t) => n + (t.lessons?.length || 0), 0);
    const tripleLessons = topicList.reduce((n, t) => n + (t.lessons || []).filter(x => x[1] === 'triple').length, 0);
    const practicals = topicList.reduce((n, t) => n + (t.practicals?.length || 0), 0);
    return { subject, paper, topics: topicList, lessons, tripleLessons, practicals };
  }
  const PAPERS = ['biology','chemistry','physics'].flatMap(subject => [1,2].map(paper => paperModel(subject, paper)));

  function paperTabsHtml() {
    return PAPERS.map(p => {
      const meta = subjectMeta[p.subject];
      const id = `${p.subject}-${p.paper}`;
      return `<button type="button" data-paper-tab="${id}" class="${id === activePaper ? 'active' : ''}">${meta.icon} ${meta.name} P${p.paper}</button>`;
    }).join('');
  }
  function paperDetailHtml() {
    const selected = PAPERS.find(p => `${p.subject}-${p.paper}` === activePaper) || PAPERS[0];
    const meta = subjectMeta[selected.subject];
    return `<article class="paper-detail-card">
      <div class="paper-detail-head"><div><span class="eyebrow">${meta.icon} ${meta.name}</span><h3>Paper ${selected.paper}</h3></div><div class="paper-stats"><span><strong>${selected.topics.length}</strong> topics</span><span><strong>${selected.lessons}</strong> lessons</span><span><strong>${selected.practicals}</strong> practical links</span></div></div>
      <div class="paper-topic-list">${selected.topics.map(topic => {
        const combinedCount = (topic.lessons || []).filter(x => x[1] !== 'triple').length;
        const tripleCount = (topic.lessons || []).filter(x => x[1] === 'triple').length;
        return `<section><div><span>${esc(topic.code)}</span><strong>${esc(topic.title)}</strong></div><p>${esc(topic.summary)}</p><small>${combinedCount} Combined/Shared lesson${combinedCount === 1 ? '' : 's'}${tripleCount ? ` · ${tripleCount} Separate Science-only lesson${tripleCount === 1 ? '' : 's'}` : ''}${topic.practicals?.length ? ` · ${topic.practicals.length} practical${topic.practicals.length === 1 ? '' : 's'}` : ''}</small></section>`;
      }).join('')}</div>
      ${selected.tripleLessons ? `<p class="paper-scope-note"><strong>Separate Science:</strong> this paper includes ${selected.tripleLessons} additional lesson${selected.tripleLessons === 1 ? '' : 's'} marked as Separate / Triple content in the course.</p>` : ''}
    </article>`;
  }
  function paperGuideHtml() {
    return `<section class="paper-breakdown panel" data-paper-breakdown><div class="section-head"><div><span class="eyebrow">Paper breakdown</span><h2>Exactly what is in each GCSE Science paper?</h2><p class="muted">Switch between the six papers to see the topics, lesson coverage and required-practical links used by this course.</p></div></div><nav class="paper-breakdown-tabs" aria-label="Choose exam paper">${paperTabsHtml()}</nav><div data-paper-detail>${paperDetailHtml()}</div></section>`;
  }
  function ensurePaperGuide() {
    const home = document.getElementById('homeView');
    if (!home || home.querySelector('[data-paper-breakdown]')) return;
    const existingMap = home.querySelector('.paper-map');
    if (existingMap) existingMap.insertAdjacentHTML('beforebegin', paperGuideHtml());
    else home.insertAdjacentHTML('beforeend', paperGuideHtml());
    const guide = home.querySelector('[data-paper-breakdown]');
    guide?.addEventListener('click', event => {
      const button = event.target.closest('[data-paper-tab]');
      if (!button) return;
      activePaper = button.dataset.paperTab;
      guide.querySelectorAll('[data-paper-tab]').forEach(b => b.classList.toggle('active', b === button));
      const detail = guide.querySelector('[data-paper-detail]');
      if (detail) detail.innerHTML = paperDetailHtml();
    });
  }

  function refreshPlan(plan) {
    currentPlan = normalisePlan(plan);
    ensureTopPlanBadge();
    if (!document.querySelector('[data-plan-modal]')?.hidden) renderPlans();
  }

  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !document.querySelector('[data-plan-modal]')?.hidden) closePlans(); });
  window.addEventListener('gcse-plan-changed', event => refreshPlan(event.detail?.plan));
  window.addEventListener('gcse-auth-changed', event => refreshPlan(event.detail?.signedIn ? event.detail?.profile?.plan : 'free'));
  window.GCSE_PLANS_AND_PAPERS = { plans: PLANS, papers: PAPERS, getCurrentPlan: () => currentPlan, setPlanFromAccount: refreshPlan, openPlans, openPaper: id => { activePaper = id; ensurePaperGuide(); const guide = document.querySelector('[data-paper-breakdown]'); guide?.scrollIntoView({behavior:'smooth',block:'start'}); } };

  const boot = () => { currentPlan = detectPlan(); ensureTopPlanBadge(); ensurePaperGuide(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  new MutationObserver(() => { ensureTopPlanBadge(); ensurePaperGuide(); }).observe(document.body, { childList: true, subtree: true });
})();

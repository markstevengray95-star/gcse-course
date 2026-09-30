(() => {
  'use strict';

  const SUPABASE_URL = 'https://emjmvgginijkupwuflla.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_axgWqbWx-24V2b9s7mE1Fw__N3Ce61f';

  if (!window.supabase?.createClient) {
    console.error('[GCSE Auth] Supabase client failed to load.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const state = {
    session: null,
    profile: null,
    mode: 'signin'
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const planLabel = plan => ({
    free: 'Free',
    full: 'Full Course',
    premium: 'Premium',
    school: 'School'
  }[plan] || 'Free');

  const statusLabel = status => ({
    free: 'Free account',
    trialing: 'Trial active',
    active: 'Active',
    past_due: 'Payment issue',
    canceled: 'Cancelled'
  }[status] || 'Free account');

  function getProgressSummary() {
    try {
      const topicStats = typeof courseStats === 'function' ? courseStats() : null;
      const topicDone = topicStats?.done ?? Object.values(typeof progress === 'object' && progress ? progress : {}).filter(Boolean).length;
      const topicTotal = topicStats?.total ?? (window.GCSE_COURSE_DATA?.topics?.length || 0);
      const lessonDone = Object.values(typeof lessonProgress === 'object' && lessonProgress ? lessonProgress : {}).filter(Boolean).length;
      const percent = topicStats?.percent ?? (topicTotal ? Math.round((topicDone / topicTotal) * 100) : 0);
      return { topicDone, topicTotal, lessonDone, percent };
    } catch {
      return { topicDone: 0, topicTotal: 0, lessonDone: 0, percent: 0 };
    }
  }

  function mountUi() {
    const topbar = document.querySelector('.topbar-inner');
    if (!topbar || document.getElementById('gcseAccountButton')) return;

    const controls = document.createElement('div');
    controls.className = 'gcse-auth-controls';
    controls.innerHTML = '<button class="gcse-account-button" id="gcseAccountButton" type="button"><span class="gcse-account-icon" aria-hidden="true">●</span><span id="gcseAccountButtonText">Sign in</span></button>';
    topbar.appendChild(controls);

    const modal = document.createElement('div');
    modal.className = 'gcse-auth-modal';
    modal.id = 'gcseAuthModal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'gcseAuthTitle');
    modal.innerHTML = `
      <div class="gcse-auth-shell">
        <button class="gcse-auth-close" id="gcseAuthClose" type="button" aria-label="Close account window">×</button>
        <div id="gcseAuthContent"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('gcseAccountButton').addEventListener('click', () => openModal(state.session ? 'account' : 'signin'));
    document.getElementById('gcseAuthClose').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  }

  function openModal(mode) {
    state.mode = mode;
    const modal = document.getElementById('gcseAuthModal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('gcse-auth-open');
    renderModal();
  }

  function closeModal() {
    const modal = document.getElementById('gcseAuthModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('gcse-auth-open');
  }

  function setMessage(message, kind = 'info') {
    const box = document.getElementById('gcseAuthMessage');
    if (!box) return;
    box.className = `gcse-auth-message ${kind}`;
    box.textContent = message;
    box.hidden = !message;
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.label;
  }

  function authForm(mode) {
    const signup = mode === 'signup';
    return `
      <div class="gcse-auth-brand"><span class="gcse-auth-brand-mark">S</span><div><strong>GCSE Science</strong><span>Your learning account</span></div></div>
      <span class="gcse-auth-eyebrow">${signup ? 'Create account' : 'Welcome back'}</span>
      <h2 id="gcseAuthTitle">${signup ? 'Sign up to GCSE Science' : 'Sign in to your account'}</h2>
      <p class="gcse-auth-lead">${signup ? 'Use your email address and create a password. Your account will be ready for progress, subscriptions and future course features.' : 'Sign in with the email and password you used when you created your account.'}</p>
      <div class="gcse-auth-switch" role="tablist" aria-label="Account action">
        <button type="button" data-auth-mode="signin" class="${signup ? '' : 'active'}">Sign in</button>
        <button type="button" data-auth-mode="signup" class="${signup ? 'active' : ''}">Sign up</button>
      </div>
      <form id="gcseAuthForm" class="gcse-auth-form" novalidate>
        <label>Email address<input id="gcseAuthEmail" type="email" autocomplete="email" required placeholder="you@example.com"></label>
        <label>Password<input id="gcseAuthPassword" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="8" placeholder="At least 8 characters"></label>
        ${signup ? '<label>Confirm password<input id="gcseAuthPasswordConfirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Re-enter your password"></label>' : ''}
        <div id="gcseAuthMessage" class="gcse-auth-message" hidden></div>
        <button id="gcseAuthSubmit" class="gcse-auth-submit" type="submit">${signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p class="gcse-auth-fineprint">Passwords are handled by secure authentication and are never stored in the GCSE course code.</p>`;
  }

  function accountView() {
    const user = state.session?.user;
    const profile = state.profile;
    const stats = getProgressSummary();
    const email = user?.email || profile?.email || 'Signed-in user';
    const plan = planLabel(profile?.plan || 'free');
    const status = statusLabel(profile?.subscription_status || 'free');
    const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return `
      <div class="gcse-auth-brand"><span class="gcse-auth-brand-mark">S</span><div><strong>GCSE Science</strong><span>My account</span></div></div>
      <span class="gcse-auth-eyebrow">Signed in</span>
      <h2 id="gcseAuthTitle">Your account</h2>
      <div class="gcse-account-identity"><div class="gcse-account-avatar">${escapeHtml(email.charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(email)}</strong><span>${escapeHtml(plan)} · ${escapeHtml(status)}</span></div></div>
      <div class="gcse-account-grid">
        <article><span>Course plan</span><strong>${escapeHtml(plan)}</strong><small>${escapeHtml(status)}</small></article>
        <article><span>Topic progress</span><strong>${stats.topicDone} / ${stats.topicTotal}</strong><small>${stats.percent}% complete</small></article>
        <article><span>Lessons checked</span><strong>${stats.lessonDone}</strong><small>On this device</small></article>
        <article><span>Account created</span><strong>${escapeHtml(joined)}</strong><small>Email/password account</small></article>
      </div>
      <div class="gcse-account-progress"><div><span>Overall course progress</span><strong>${stats.percent}%</strong></div><div class="gcse-account-progress-track"><i style="width:${Math.max(0, Math.min(100, stats.percent))}%"></i></div></div>
      <div id="gcseAuthMessage" class="gcse-auth-message" hidden></div>
      <button id="gcseSignOut" class="gcse-auth-secondary" type="button">Sign out</button>`;
  }

  function renderModal() {
    const content = document.getElementById('gcseAuthContent');
    if (!content) return;

    if (state.mode === 'account' && state.session) {
      content.innerHTML = accountView();
      document.getElementById('gcseSignOut')?.addEventListener('click', signOut);
      return;
    }

    content.innerHTML = authForm(state.mode === 'signup' ? 'signup' : 'signin');
    content.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => {
      state.mode = button.dataset.authMode;
      renderModal();
    }));
    document.getElementById('gcseAuthForm')?.addEventListener('submit', handleAuthSubmit);
    setTimeout(() => document.getElementById('gcseAuthEmail')?.focus(), 0);
  }

  async function ensureProfile(user) {
    if (!user?.id) return null;

    const existing = await client
      .from('gcse_profiles')
      .select('user_id,email,plan,subscription_status,trial_ends_at,created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing.error) {
      console.warn('[GCSE Auth] Profile lookup failed', existing.error.message);
      return null;
    }
    if (existing.data) return existing.data;

    const inserted = await client
      .from('gcse_profiles')
      .insert({ user_id: user.id, email: user.email || '' })
      .select('user_id,email,plan,subscription_status,trial_ends_at,created_at')
      .single();

    if (inserted.error) {
      console.warn('[GCSE Auth] Profile creation failed', inserted.error.message);
      return null;
    }
    return inserted.data;
  }

  async function applySession(session) {
    state.session = session || null;
    state.profile = session?.user ? await ensureProfile(session.user) : null;
    updateAccountButton();
    if (!document.getElementById('gcseAuthModal')?.hidden && state.mode === 'account') renderModal();
    window.dispatchEvent(new CustomEvent('gcse-auth-changed', { detail: { signedIn: !!state.session, user: state.session?.user || null, profile: state.profile } }));
  }

  function updateAccountButton() {
    const text = document.getElementById('gcseAccountButtonText');
    const button = document.getElementById('gcseAccountButton');
    if (!text || !button) return;
    if (state.session?.user) {
      const email = state.session.user.email || 'My account';
      text.textContent = email.includes('@') ? email.split('@')[0] : 'My account';
      button.classList.add('signed-in');
      button.setAttribute('aria-label', `Open account for ${email}`);
    } else {
      text.textContent = 'Sign in';
      button.classList.remove('signed-in');
      button.setAttribute('aria-label', 'Sign in or create an account');
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('gcseAuthEmail')?.value.trim();
    const password = document.getElementById('gcseAuthPassword')?.value || '';
    const submit = document.getElementById('gcseAuthSubmit');

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setMessage('Enter a valid email address.', 'error');
      return;
    }
    if (password.length < 8) {
      setMessage('Your password must be at least 8 characters long.', 'error');
      return;
    }

    if (state.mode === 'signup') {
      const confirm = document.getElementById('gcseAuthPasswordConfirm')?.value || '';
      if (password !== confirm) {
        setMessage('The two passwords do not match.', 'error');
        return;
      }
      setBusy(submit, true, 'Creating account…');
      const { data, error } = await client.auth.signUp({ email, password });
      setBusy(submit, false);
      if (error) {
        setMessage(error.message || 'We could not create that account.', 'error');
        return;
      }
      if (data.session) {
        await applySession(data.session);
        state.mode = 'account';
        renderModal();
        setMessage('Account created. You are signed in.', 'success');
      } else {
        setMessage('Account created. Check your email to confirm the address, then return here and sign in.', 'success');
      }
      return;
    }

    setBusy(submit, true, 'Signing in…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(submit, false);
    if (error) {
      setMessage(error.message || 'Sign in failed. Check your email and password.', 'error');
      return;
    }
    await applySession(data.session);
    state.mode = 'account';
    renderModal();
  }

  async function signOut() {
    const button = document.getElementById('gcseSignOut');
    setBusy(button, true, 'Signing out…');
    const { error } = await client.auth.signOut();
    if (error) {
      setBusy(button, false);
      setMessage(error.message || 'Could not sign out.', 'error');
      return;
    }
    await applySession(null);
    state.mode = 'signin';
    closeModal();
  }

  async function initialise() {
    mountUi();
    const { data, error } = await client.auth.getSession();
    if (error) console.warn('[GCSE Auth] Could not restore session', error.message);
    await applySession(data?.session || null);

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => applySession(session), 0);
    });
  }

  window.GCSE_AUTH = {
    open: () => openModal(state.session ? 'account' : 'signin'),
    openSignUp: () => openModal('signup'),
    getSession: () => state.session,
    getProfile: () => state.profile,
    client
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();

(() => {
  'use strict';

  let authProfile = null;
  let billingProfile = null;
  let promos = [];
  let keyConfigured = false;
  let observer = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const planLabel = plan => ({free:'Free',full:'Plus',full_course:'Plus',plus:'Plus',premium:'Pro',pro:'Pro',school:'Teacher',teacher:'Teacher'}[String(plan||'').toLowerCase()] || 'Free');
  const statusLabel = status => ({free:'Free account',trialing:'Trial active',active:'Active',past_due:'Payment issue',canceled:'Cancelled',unpaid:'Payment required',paused:'Paused'}[String(status||'').toLowerCase()] || 'Free account');
  const dateLabel = value => value ? new Date(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';

  function client(){ return window.GCSE_AUTH?.client || null; }

  async function loadBillingProfile(){
    const c = client();
    if(!c) return null;
    const {data,error} = await c.rpc('gcse_get_billing_profile');
    if(error){ console.warn('[GCSE Billing] Profile load failed', error.message); return null; }
    billingProfile = Array.isArray(data) ? data[0] || null : data || null;
    return billingProfile;
  }

  async function billingCall(action, payload={}){
    const c = client();
    if(!c) throw new Error('Sign in first.');
    const {data,error} = await c.functions.invoke('gcse-billing-control',{body:{action,...payload}});
    if(error) throw new Error(error.message || 'Billing action failed.');
    if(data?.error) throw new Error(data.error);
    return data;
  }

  async function loadAdminState(){
    const c = client();
    if(!c || !billingProfile?.is_admin) return;
    const key = await c.rpc('gcse_has_stripe_admin_key');
    keyConfigured = Boolean(key.data);
    try{
      const result = await billingCall('list_promos');
      promos = Array.isArray(result?.promos) ? result.promos : [];
    }catch(err){
      console.warn('[GCSE Billing] Promo list failed', err);
      promos = [];
    }
  }

  function subscriptionHtml(){
    const p = billingProfile || authProfile || {};
    const paid = Boolean(p.stripe_subscription_id) && !['free','canceled'].includes(String(p.subscription_status || 'free'));
    const canceling = Boolean(p.cancel_at_period_end);
    const periodText = canceling ? `Access ends ${dateLabel(p.current_period_end)}` : (p.current_period_end ? `Renews ${dateLabel(p.current_period_end)}` : (p.trial_ends_at ? `Trial ends ${dateLabel(p.trial_ends_at)}` : 'No paid subscription'));
    return `<section class="gcse-subscription-panel" data-gcse-subscription-panel>
      <div class="gcse-subscription-head"><div><span class="gcse-auth-eyebrow">Subscription</span><h3>${esc(planLabel(p.plan))} plan</h3><p>${esc(statusLabel(p.subscription_status))} · ${esc(periodText)}</p></div><span class="gcse-subscription-pill ${canceling?'warning':''}">${canceling?'Cancelling':'Current'}</span></div>
      <div class="gcse-subscription-details">
        <div><span>Billing</span><strong>${esc(p.billing_interval === 'year' ? 'Annual' : p.billing_interval === 'month' ? 'Monthly' : '—')}</strong></div>
        <div><span>Next date</span><strong>${esc(dateLabel(p.current_period_end || p.trial_ends_at))}</strong></div>
        <div><span>Status</span><strong>${esc(statusLabel(p.subscription_status))}</strong></div>
      </div>
      <div class="gcse-subscription-actions">
        <button type="button" data-open-plans>View plans</button>
        ${paid ? `<button type="button" class="${canceling?'':'danger'}" data-subscription-action="${canceling?'resume_subscription':'cancel_subscription'}">${canceling?'Undo cancellation':'Cancel subscription'}</button>` : ''}
      </div>
      ${canceling ? `<p class="gcse-subscription-note">Your paid access remains active until ${esc(dateLabel(p.current_period_end))}. You can undo the cancellation before then.</p>` : ''}
      <div class="gcse-billing-message" data-billing-message hidden></div>
    </section>`;
  }

  function promoRows(){
    if(!promos.length) return '<p class="gcse-admin-empty">No GCSE promo codes created yet.</p>';
    return `<div class="gcse-promo-list">${promos.map(item=>`<article><div><strong>${esc(item.code)}</strong><span>${esc(item.percent_off)}% off · ${esc(item.duration)}</span></div><small>${item.max_redemptions ? `${esc(item.max_redemptions)} max uses · ` : ''}${item.expires_at ? `expires ${esc(dateLabel(item.expires_at))}` : 'no expiry'}</small></article>`).join('')}</div>`;
  }

  function adminHtml(){
    if(!billingProfile?.is_admin) return '';
    return `<section class="gcse-admin-terminal" data-gcse-admin-terminal>
      <div class="gcse-admin-title"><div><span class="gcse-auth-eyebrow">Admin terminal</span><h3>Subscription & promo controls</h3></div><span class="gcse-admin-key-status ${keyConfigured?'ready':''}">${keyConfigured?'Billing connected':'Billing key required'}</span></div>
      <details ${keyConfigured?'':'open'}><summary>Stripe billing connection</summary><p>Use a live Stripe restricted key with coupon, promotion-code and subscription write permissions. It is stored server-side only.</p><div class="gcse-admin-inline"><input type="password" autocomplete="off" placeholder="rk_live_…" data-stripe-admin-key><button type="button" data-save-stripe-key>Save restricted key</button></div></details>
      <form class="gcse-promo-form" data-promo-form>
        <h4>Create promo code</h4>
        <div class="gcse-promo-grid"><label>Code<input type="text" maxlength="32" required placeholder="WELCOME20" data-promo-code></label><label>Discount %<input type="number" min="1" max="100" required value="20" data-promo-percent></label><label>Duration<select data-promo-duration><option value="once">Once</option><option value="forever">Forever</option><option value="repeating">Repeating</option></select></label><label>Months<input type="number" min="1" value="1" data-promo-months></label><label>Max uses<input type="number" min="1" placeholder="Unlimited" data-promo-max></label><label>Expiry<input type="date" data-promo-expiry></label></div>
        <button type="submit" ${keyConfigured?'':'disabled'}>Create promo code</button>
      </form>
      <div class="gcse-admin-message" data-admin-message hidden></div>
      <div class="gcse-admin-promos"><h4>Promo codes</h4>${promoRows()}</div>
    </section>`;
  }

  function setMessage(selector, text, kind='info'){
    const box = document.querySelector(selector);
    if(!box) return;
    box.hidden = !text;
    box.className = `${box.className.split(' ')[0]} ${kind}`;
    box.textContent = text;
  }

  async function refreshAndRender(){
    await loadBillingProfile();
    await loadAdminState();
    inject(true);
  }

  function bind(panel){
    panel.querySelector('[data-open-plans]')?.addEventListener('click',()=>window.GCSE_PLANS_AND_PAPERS?.openPlans?.());
    panel.querySelector('[data-subscription-action]')?.addEventListener('click',async event=>{
      const button=event.currentTarget;
      const action=button.dataset.subscriptionAction;
      if(action==='cancel_subscription' && !window.confirm('Cancel at the end of the current billing period? You will keep access until then.')) return;
      button.disabled=true;
      const original=button.textContent;
      button.textContent=action==='cancel_subscription'?'Scheduling cancellation…':'Restoring subscription…';
      try{
        await billingCall(action);
        await refreshAndRender();
      }catch(err){
        button.disabled=false; button.textContent=original;
        setMessage('[data-billing-message]',String(err.message||err),'error');
      }
    });
    panel.querySelector('[data-save-stripe-key]')?.addEventListener('click',async event=>{
      const input=panel.querySelector('[data-stripe-admin-key]');
      const value=input?.value?.trim()||'';
      if(!value) return;
      const button=event.currentTarget; button.disabled=true; button.textContent='Saving…';
      const c=client();
      const {error}=await c.rpc('gcse_set_stripe_admin_key',{p_value:value});
      if(error){ button.disabled=false; button.textContent='Save restricted key'; setMessage('[data-admin-message]',error.message,'error'); return; }
      if(input) input.value='';
      await refreshAndRender();
    });
    panel.querySelector('[data-promo-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const form=event.currentTarget, button=form.querySelector('button[type="submit"]');
      const payload={
        code:form.querySelector('[data-promo-code]').value,
        percent_off:Number(form.querySelector('[data-promo-percent]').value),
        duration:form.querySelector('[data-promo-duration]').value,
        duration_months:Number(form.querySelector('[data-promo-months]').value||1),
        max_redemptions:form.querySelector('[data-promo-max]').value ? Number(form.querySelector('[data-promo-max]').value) : null,
        expires_at:form.querySelector('[data-promo-expiry]').value || null
      };
      button.disabled=true; button.textContent='Creating…';
      try{
        await billingCall('create_promo',payload);
        form.reset();
        await refreshAndRender();
      }catch(err){
        button.disabled=false; button.textContent='Create promo code';
        setMessage('[data-admin-message]',String(err.message||err),'error');
      }
    });
  }

  function inject(force=false){
    const content=document.getElementById('gcseAuthContent');
    if(!content || !window.GCSE_AUTH?.getSession?.()) return;
    const existing=content.querySelector('[data-gcse-billing-root]');
    if(existing && !force) return;
    existing?.remove();
    const root=document.createElement('div');
    root.dataset.gcseBillingRoot='true';
    root.className='gcse-billing-root';
    root.innerHTML=subscriptionHtml()+adminHtml();
    const signout=content.querySelector('#gcseSignOut');
    if(signout) content.insertBefore(root,signout); else content.appendChild(root);
    bind(root);
  }

  function watchAccountModal(){
    const content=document.getElementById('gcseAuthContent');
    if(!content || observer) return;
    observer=new MutationObserver(()=>{
      if(window.GCSE_AUTH?.getSession?.() && !content.querySelector('[data-gcse-billing-root]')) inject();
    });
    observer.observe(content,{childList:true});
  }

  window.addEventListener('gcse-auth-changed',async event=>{
    authProfile=event.detail?.profile||null;
    if(event.detail?.signedIn){ await refreshAndRender(); watchAccountModal(); }
    else { billingProfile=null; promos=[]; keyConfigured=false; }
  });

  const boot=async()=>{
    watchAccountModal();
    if(window.GCSE_AUTH?.getSession?.()) await refreshAndRender();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
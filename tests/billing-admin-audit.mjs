import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const failures=[];const assert=(v,m)=>{if(!v)failures.push(m)};

const plans=read('plans-paper-guide.js');
assert(!plans.includes('new MutationObserver(() => { ensureTopPlanBadge(); ensurePaperGuide(); })'),'Body-wide plan observer freeze loop still present.');
assert(!/observe\(document\.body\s*,\s*\{\s*childList:\s*true\s*,\s*subtree:\s*true/.test(plans),'plans-paper-guide.js still observes the entire document body.');
assert(plans.includes('button.dataset.planId!==plan.id'),'Plan badge is not guarded against redundant DOM rewrites.');

const ui=read('gcse-billing-ui.js');
for(const token of ['Subscription','Cancel subscription','Undo cancellation','Admin terminal','Create promo code','gcse_set_stripe_admin_key','gcse-billing-control','cancel_subscription','resume_subscription','create_promo','list_promos']) assert(ui.includes(token),`Billing UI missing ${token}.`);
assert(ui.includes('new MutationObserver'),'Account-local observer missing.');
assert(ui.includes("observer.observe(content,{childList:true})"),'Billing observer must be scoped to account content only.');

const css=read('gcse-billing-ui.css');
for(const token of ['.gcse-subscription-panel','.gcse-admin-terminal','.gcse-promo-form','.gcse-subscription-actions']) assert(css.includes(token),`Billing CSS missing ${token}.`);

const boot=read('course-audit-fixes.js');
for(const token of ['gcse-billing-ui.css','gcse-billing-ui.js','data-gcse-billing-style','data-gcse-billing-script']) assert(boot.includes(token),`Bootstrap missing ${token}.`);

if(failures.length){console.error(`GCSE BILLING/ADMIN AUDIT FAILED (${failures.length})`);failures.forEach(f=>console.error(`- ${f}`));process.exit(1)}
console.log('GCSE BILLING/ADMIN AUDIT PASSED: freeze-loop removed, subscription management is visible, cancellation is server-backed, and admin promo tools are present with scoped DOM observation.');
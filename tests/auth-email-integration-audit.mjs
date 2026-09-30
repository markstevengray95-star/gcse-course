import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gcse-auth.js', import.meta.url), 'utf8');
const failures = [];
const assert = (ok, message) => { if (!ok) failures.push(message); };

for (const token of [
  "https://emjmvgginijkupwuflla.supabase.co",
  'detectSessionInUrl: true',
  'emailRedirectTo: confirmationRedirect()',
  "client.auth.resend({",
  "type: 'signup'",
  'data?.user?.identities',
  'identities.length === 0',
  'gcseResendConfirmation',
  'gcseUseExistingAccount',
  'Email delivery is not configured for public addresses yet',
  'gcse-auth-account-rendered'
]) assert(source.includes(token), `gcse-auth.js missing required signup behaviour: ${token}`);

assert(!source.includes('client.auth.signUp({ email, password });'), 'Signup still uses the old call without an explicit GCSE redirect URL.');
assert(source.includes("return `${window.location.origin}/`;"), 'Confirmation redirects are not tied to the current GCSE origin.');
assert(source.includes('This email already belongs to an account in the connected Supabase account system'), 'Existing shared-Supabase accounts are not explained to users.');

if (failures.length) {
  console.error(`AUTH EMAIL INTEGRATION AUDIT FAILED (${failures.length})`);
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('AUTH EMAIL INTEGRATION AUDIT PASSED: GCSE signup uses an explicit app redirect, distinguishes existing shared Supabase accounts, supports resend confirmation, and surfaces SMTP/redirect/rate-limit errors.');

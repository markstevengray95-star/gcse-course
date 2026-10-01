import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
function serviceKey(){
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (keys?.default) return String(keys.default); } catch (_) {}
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const SERVICE_KEY = serviceKey();
const CORS = {
  "access-control-allow-origin":"*",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "content-type":"application/json"
};
const reply = (status:number, body:unknown) => new Response(JSON.stringify(body), { status, headers:CORS });

function serviceHeaders(extra:Record<string,string> = {}){
  const headers:Record<string,string> = { apikey:SERVICE_KEY, "content-type":"application/json", ...extra };
  if (!SERVICE_KEY.startsWith("sb_secret_")) headers.Authorization = `Bearer ${SERVICE_KEY}`;
  return headers;
}
async function rest(path:string, init:RequestInit = {}){
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers:{ ...serviceHeaders(), ...(init.headers || {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text.slice(0,300)}`);
  return text ? JSON.parse(text) : null;
}
async function authedUser(req:Request){
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers:{ apikey:SERVICE_KEY, authorization:auth } });
  if (!response.ok) return null;
  return await response.json();
}
const cleanEmail = (value:unknown) => String(value || "").trim().toLowerCase();
const cleanCode = (value:unknown) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

async function findClassByCode(code:string){
  const rows = await rest(`gcse_classes?select=id,teacher_id,name,year_group,subject,course_type,archived&join_code=eq.${encodeURIComponent(code)}&archived=eq.false&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}
async function findMembership(classId:string, email:string){
  const rows = await rest(`gcse_class_members?select=id,class_id,student_id,status,display_name,student_email&class_id=eq.${encodeURIComponent(classId)}&student_email_key=eq.${encodeURIComponent(email)}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}
async function claimMembership(member:any, user:any){
  if (member?.student_id && String(member.student_id) !== String(user.id)) throw new Error("membership_email_in_use");
  const payload = { student_id:user.id, student_email:cleanEmail(user.email), status:"joined", joined_at:new Date().toISOString(), updated_at:new Date().toISOString() };
  await rest(`gcse_class_members?id=eq.${encodeURIComponent(String(member.id))}`, { method:"PATCH", headers:{ Prefer:"return=minimal" }, body:JSON.stringify(payload) });
}

Deno.serve(async (req:Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status:204, headers:CORS });
  if (req.method !== "POST") return reply(405, { error:"method_not_allowed" });
  if (!SERVICE_KEY) return reply(500, { error:"server_configuration_error" });

  const user = await authedUser(req);
  if (!user?.id || !user?.email) return reply(401, { error:"not_authenticated" });
  let body:any = {};
  try { body = await req.json(); } catch { return reply(400, { error:"invalid_json" }); }

  try {
    const action = String(body?.action || "");
    const email = cleanEmail(user.email);

    if (action === "join_class") {
      const code = cleanCode(body?.join_code);
      if (!/^[A-Z0-9]{6,12}$/.test(code)) return reply(400, { error:"invalid_join_code" });
      const klass = await findClassByCode(code);
      if (!klass) return reply(404, { error:"class_not_found" });

      const existing = await findMembership(String(klass.id), email);
      if (existing) {
        await claimMembership(existing, user);
      } else {
        await rest("gcse_class_members", {
          method:"POST",
          headers:{ Prefer:"return=minimal" },
          body:JSON.stringify({
            class_id:klass.id,
            teacher_id:klass.teacher_id,
            student_id:user.id,
            student_email:email,
            display_name:null,
            status:"joined",
            source:"join_code",
            joined_at:new Date().toISOString()
          })
        });
      }
      return reply(200, { ok:true, class:{ id:klass.id, name:klass.name, year_group:klass.year_group, subject:klass.subject, course_type:klass.course_type } });
    }

    if (action === "claim_invites") {
      const invited = await rest(`gcse_class_members?select=id,class_id,student_id,status&student_email_key=eq.${encodeURIComponent(email)}&status=eq.invited&limit=50`);
      let claimed = 0;
      for (const member of (Array.isArray(invited) ? invited : [])) {
        if (member?.student_id && String(member.student_id) !== String(user.id)) continue;
        await claimMembership(member, user);
        claimed += 1;
      }
      return reply(200, { ok:true, claimed });
    }

    if (action === "leave_class") {
      const classId = String(body?.class_id || "");
      if (!/^[0-9a-f-]{36}$/i.test(classId)) return reply(400, { error:"invalid_class_id" });
      await rest(`gcse_class_members?class_id=eq.${encodeURIComponent(classId)}&student_id=eq.${encodeURIComponent(String(user.id))}`, { method:"DELETE", headers:{ Prefer:"return=minimal" } });
      return reply(200, { ok:true });
    }

    return reply(400, { error:"unknown_action" });
  } catch (error) {
    const message = String((error as Error)?.message || error).slice(0,300);
    if (message === "membership_email_in_use") return reply(409, { error:message });
    return reply(500, { error:message });
  }
});
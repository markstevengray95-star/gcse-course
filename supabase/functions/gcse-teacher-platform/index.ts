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
const unique = <T>(values:T[]) => [...new Set(values)];

async function profile(userId:string){
  const rows = await rest(`gcse_profiles?select=user_id,role,is_admin,plan,subscription_status,trial_ends_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}
function teacherAccess(p:any){
  if (!p) return false;
  if (p.is_admin) return true;
  if (["teacher","school_admin","platform_admin"].includes(String(p.role || "").toLowerCase())) return true;
  const plan = String(p.plan || "").toLowerCase();
  const status = String(p.subscription_status || "").toLowerCase();
  const active = status === "active" || (status === "trialing" && p.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now());
  return active && ["teacher","school"].includes(plan);
}
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

function parseRaw(value:any){
  try {
    const raw = value && typeof value === "object" && typeof value.raw === "string" ? value.raw : value;
    if (typeof raw === "string") {
      if (raw.length > 2_000_000) return null;
      return JSON.parse(raw);
    }
    return raw ?? null;
  } catch (_) { return null; }
}
function normaliseTopicScores(value:any){
  const parsed = parseRaw(value);
  const topics = parsed?.topics && typeof parsed.topics === "object" ? parsed.topics : {};
  const output:Record<string,unknown> = {};
  for (const [topicId, item] of Object.entries(topics)) {
    const row:any = item || {};
    const possible = Math.max(0, Number(row.possible || 0));
    const earned = Math.max(0, Number(row.earned || 0));
    const attempts = Math.max(0, Number(row.attempts || 0));
    if (!possible && !attempts) continue;
    output[String(topicId)] = {
      earned,
      possible,
      attempts,
      score:possible ? Math.max(0, Math.min(100, Math.round((earned / possible) * 100))) : null,
      lastAttempt:Number(row.lastAttempt || 0) || null
    };
  }
  return output;
}
function normaliseMistakes(value:any){
  const parsed = parseRaw(value);
  const rows = Array.isArray(parsed) ? parsed : [];
  const unresolved = rows.filter((item:any) => item && item.status !== "mastered");
  const byTopic:Record<string,number> = {};
  let due = 0;
  const time = Date.now();
  for (const item of unresolved) {
    const topicId = String(item.topicId || "");
    if (topicId) byTopic[topicId] = (byTopic[topicId] || 0) + 1;
    if (!Number(item.nextReview || 0) || Number(item.nextReview || 0) <= time) due += 1;
  }
  return { unresolved:unresolved.length, due, byTopic };
}
function normaliseMocks(value:any){
  const parsed = parseRaw(value);
  const rows = Array.isArray(parsed) ? parsed : [];
  return rows
    .filter((item:any) => item && Number(item.totalMarks || 0) > 0)
    .map((item:any) => ({
      subject:String(item.subject || "science"),
      paper:Number(item.paper || 1),
      tier:String(item.tier || ""),
      qualification:String(item.qualification || ""),
      score:Number(item.score || 0),
      totalMarks:Number(item.totalMarks || 0),
      percent:Math.max(0, Math.min(100, Math.round((Number(item.score || 0) / Number(item.totalMarks || 1)) * 100))),
      finishedAt:Number(item.finishedAt || 0) || null,
      timedOut:Boolean(item.timedOut)
    }))
    .sort((a:any,b:any)=>(b.finishedAt || 0) - (a.finishedAt || 0))
    .slice(0,5);
}
function completedLessons(value:any){
  const parsed = parseRaw(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  return Object.entries(parsed).filter(([,done]) => done === true).map(([key]) => key).slice(0,1000);
}
async function stateRowsForUsers(userIds:string[], stateKey:string){
  const all:any[] = [];
  for (let i=0; i<userIds.length; i+=40) {
    const chunk = userIds.slice(i,i+40);
    const filter = chunk.map(id=>encodeURIComponent(id)).join(",");
    const rows = await rest(`gcse_user_state?select=user_id,state_key,state_value,updated_at&user_id=in.(${filter})&state_key=eq.${encodeURIComponent(stateKey)}&limit=1000`);
    if (Array.isArray(rows)) all.push(...rows);
  }
  return all;
}
async function teacherDashboard(userId:string){
  const p = await profile(userId);
  if (!teacherAccess(p)) return { denied:true };
  const memberships = await rest(`gcse_class_members?select=class_id,student_id,joined_at&teacher_id=eq.${encodeURIComponent(userId)}&status=eq.joined&student_id=not.is.null&limit=2000`);
  const joined = Array.isArray(memberships) ? memberships : [];
  const studentIds = unique(joined.map((m:any)=>String(m.student_id || "")).filter(Boolean));
  if (!studentIds.length) return { denied:false, students:{}, generated_at:new Date().toISOString() };
  const keys = ["gcse-science-lessons-v1","gcse-revision-performance-v1","gcse-mistake-bank-v1","gcse-real-exam-history-v1"];
  const groups = await Promise.all(keys.map(key=>stateRowsForUsers(studentIds,key)));
  const byUser:Record<string,any> = {};
  for (const id of studentIds) byUser[id] = { completed_lessons:[], topic_scores:{}, mistakes:{ unresolved:0,due:0,byTopic:{} }, mocks:[], last_activity:null };
  const touch = (id:string, updated:string) => {
    const time = updated ? new Date(updated).getTime() : 0;
    const prev = byUser[id]?.last_activity ? new Date(byUser[id].last_activity).getTime() : 0;
    if (time > prev) byUser[id].last_activity = updated;
  };
  for (const rows of groups) for (const row of rows) {
    const id = String(row.user_id || "");
    if (!byUser[id]) continue;
    touch(id, String(row.updated_at || ""));
    if (row.state_key === "gcse-science-lessons-v1") byUser[id].completed_lessons = completedLessons(row.state_value);
    if (row.state_key === "gcse-revision-performance-v1") byUser[id].topic_scores = normaliseTopicScores(row.state_value);
    if (row.state_key === "gcse-mistake-bank-v1") byUser[id].mistakes = normaliseMistakes(row.state_value);
    if (row.state_key === "gcse-real-exam-history-v1") byUser[id].mocks = normaliseMocks(row.state_value);
  }
  return { denied:false, students:byUser, generated_at:new Date().toISOString() };
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

    if (action === "teacher_dashboard") {
      const dashboard = await teacherDashboard(String(user.id));
      if (dashboard.denied) return reply(403, { error:"teacher_access_required" });
      return reply(200, { ok:true, ...dashboard });
    }

    return reply(400, { error:"unknown_action" });
  } catch (error) {
    const message = String((error as Error)?.message || error).slice(0,300);
    if (message === "membership_email_in_use") return reply(409, { error:message });
    return reply(500, { error:message });
  }
});
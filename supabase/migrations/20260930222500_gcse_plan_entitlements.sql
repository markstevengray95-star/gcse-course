create or replace function public.gcse_subscription_entitlements(p public.gcse_profiles)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with normalized as (
  select
    case
      when p.is_admin then 'teacher'
      when lower(coalesce(p.plan,'free')) in ('teacher','school') then 'teacher'
      when lower(coalesce(p.plan,'free')) in ('pro','premium') then 'pro'
      when lower(coalesce(p.plan,'free')) in ('plus','full','full_course','fullcourse') then 'plus'
      else 'free'
    end as plan_name,
    (
      p.is_admin
      or (lower(coalesce(p.subscription_status,'free')) = 'active' and lower(coalesce(p.plan,'free')) <> 'free')
      or (lower(coalesce(p.subscription_status,'free')) = 'trialing' and p.trial_ends_at is not null and p.trial_ends_at > now())
    ) as paid_access
)
select jsonb_build_object(
  'plan', n.plan_name,
  'access_active', (p.is_admin or n.paid_access),
  'is_admin', coalesce(p.is_admin,false),
  'free_preview', true,
  'full_course', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'textbook', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'notebook', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'simulations', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'presentations', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'progress_tools', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'revision_tools', (p.is_admin or (n.paid_access and n.plan_name in ('plus','pro','teacher'))),
  'required_practicals', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'exam_tools', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'exam_marker', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'question_generator', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'ai_coach', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'auto_marking', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'mastery_assessments', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'expert_challenges', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'advanced_progression', (p.is_admin or (n.paid_access and n.plan_name in ('pro','teacher'))),
  'teacher_tools', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'teaching_plans', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'differentiation', (p.is_admin or (n.paid_access and n.plan_name = 'teacher')),
  'classroom_controls', (p.is_admin or (n.paid_access and n.plan_name = 'teacher'))
)
from normalized n;
$$;

create or replace function public.gcse_get_entitlements()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.gcse_subscription_entitlements(p),
    jsonb_build_object(
      'plan','free','access_active',false,'is_admin',false,'free_preview',true,
      'full_course',false,'textbook',false,'notebook',false,'simulations',false,'presentations',false,
      'progress_tools',false,'revision_tools',false,'required_practicals',false,'exam_tools',false,
      'exam_marker',false,'question_generator',false,'ai_coach',false,'auto_marking',false,
      'mastery_assessments',false,'expert_challenges',false,'advanced_progression',false,
      'teacher_tools',false,'teaching_plans',false,'differentiation',false,'classroom_controls',false
    )
  )
  from (select 1) seed
  left join public.gcse_profiles p on p.user_id = auth.uid();
$$;

revoke all on function public.gcse_get_entitlements() from public;
grant execute on function public.gcse_get_entitlements() to authenticated;

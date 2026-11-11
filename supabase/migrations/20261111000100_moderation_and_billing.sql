-- Plus entitlement mirror (written only by the RevenueCat webhook / service role).
create table public.entitlements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  is_plus boolean not null default false,
  billing_issue boolean not null default false,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
create policy entitlements_self on public.entitlements for select to authenticated using (user_id = auth.uid());

-- Private bucket for data exports (signed links only).
insert into storage.buckets (id, name, public) values ('exports', 'exports', false) on conflict (id) do nothing;

-- Human review queue for moderators (admin web page reads this).
create or replace view public.moderation_queue with (security_invoker = true) as
select r.id as report_id, r.created_at, r.reason, r.details, r.status,
       r.reporter_id, r.reported_id, p.first_name as reported_name, p.status as reported_status,
       m.body as message_body,
       (select count(*) from public.reports r2 where r2.reported_id = r.reported_id) as total_reports
from public.reports r
join public.profiles p on p.id = r.reported_id
left join public.messages m on m.id = r.message_id
where r.status = 'open'
order by (r.reason = 'underage') desc, total_reports desc, r.created_at asc;

grant select on public.moderation_queue to authenticated;

-- Appeals queue for moderators.
create or replace view public.appeals_queue with (security_invoker = true) as
select a.id, a.created_at, a.body, a.status, a.user_id, p.first_name, p.status as account_status
from public.appeals a join public.profiles p on p.id = a.user_id
where a.status = 'open'
order by a.created_at;
grant select on public.appeals_queue to authenticated;

-- Moderators decide appeals.
create policy appeals_admin_update on public.appeals for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

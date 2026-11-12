-- Gaps found against the design package (GAP_REPORT.md):
-- identity (gender), "Who you meet" preferences, support inbox, notification inbox,
-- appeal outcomes, and preferences applied to daily introductions. RLS on every new table.

alter table public.profiles
  add column gender text check (gender in ('woman', 'man', 'nonbinary', 'self_described')),
  add column gender_text text check (char_length(gender_text) <= 40),
  add column intention_note text check (char_length(intention_note) <= 120);
grant update (gender, gender_text, intention_note) on public.profiles to authenticated;

alter table public.appeals add column outcome_note text;

-- ---------- preferences (owner only) ----------
create table public.preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  genders text[] not null default '{}',
  age_min smallint not null default 18 check (age_min >= 18),
  age_max smallint not null default 99 check (age_max >= age_min),
  max_km smallint not null default 50 check (max_km between 1 and 500),
  intentions intention[] not null default '{long_term,life_partner,figuring_out}',
  verified_only boolean not null default false,
  presets jsonb not null default '[]'::jsonb, -- Plus: saved preference presets
  updated_at timestamptz not null default now()
);
alter table public.preferences enable row level security;
create policy preferences_owner on public.preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- support ----------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reference text not null default ('NE-' || lpad((floor(random() * 1000000))::int::text, 6, '0')),
  topic text not null check (topic in ('account', 'safety', 'billing', 'other')),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  attachment_path text,
  created_at timestamptz not null default now()
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender text not null check (sender in ('user', 'support')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy support_tickets_owner_select on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy support_tickets_owner_insert on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');
create policy support_tickets_admin_update on public.support_tickets for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.owns_ticket(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from support_tickets where id = t and user_id = auth.uid());
$$;
create policy support_messages_select on public.support_messages for select to authenticated
  using (public.owns_ticket(ticket_id) or public.is_admin());
create policy support_messages_user_insert on public.support_messages for insert to authenticated
  with check (sender = 'user' and public.owns_ticket(ticket_id));
create policy support_messages_admin_insert on public.support_messages for insert to authenticated
  with check (sender = 'support' and public.is_admin());

-- ---------- notification inbox (written only by triggers / service role) ----------
create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.inbox_items enable row level security;
create policy inbox_owner_select on public.inbox_items for select to authenticated using (user_id = auth.uid());
create policy inbox_owner_mark_read on public.inbox_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.inbox_items from authenticated;
grant update (read) on public.inbox_items to authenticated;

-- Report outcome → reporter's inbox (never reveals the action taken against the other person).
create or replace function public.notify_report_outcome() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.report_id is not null then
    insert into inbox_items (user_id, kind, title, body)
    select r.reporter_id, 'report_outcome', 'We reviewed your report',
           'Thank you for telling us. We’ve taken action where it breaks our community rules.'
    from reports r where r.id = new.report_id;
  end if;
  return new;
end $$;
create trigger on_mod_action_notify after insert on public.moderation_actions
  for each row execute function public.notify_report_outcome();

-- Appeal outcome → appellant's inbox.
create or replace function public.notify_appeal_outcome() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and new.status in ('upheld', 'overturned') then
    insert into inbox_items (user_id, kind, title, body, href)
    values (new.user_id, 'appeal_outcome',
            case when new.status = 'overturned' then 'Your appeal was successful' else 'Your appeal was reviewed' end,
            coalesce(new.outcome_note, case when new.status = 'overturned' then 'Your account is active again.' else 'The original decision stays in place.' end),
            '/appeals');
  end if;
  return new;
end $$;
create trigger on_appeal_decided after update on public.appeals
  for each row execute function public.notify_appeal_outcome();

-- Photo request decided → requester's inbox.
create or replace function public.notify_photo_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status and new.status in ('shared', 'declined') then
    insert into inbox_items (user_id, kind, title, body)
    select new.viewer_id,
           case when new.status = 'shared' then 'photo_request_shared' else 'photo_request_declined' end,
           'Photo request',
           case when new.status = 'shared' then p.first_name || ' shared their photos with you.'
                else p.first_name || ' chose to keep their photos private for now.' end
    from profiles p where p.id = new.owner_id;
  end if;
  return new;
end $$;
create trigger on_photo_access_decided after update on public.photo_access
  for each row execute function public.notify_photo_request();

-- Owner can grant access directly (e.g. "Share photos" from a chat).
create policy photo_access_owner_grant on public.photo_access for insert to authenticated
  with check (owner_id = auth.uid() and status = 'shared' and public.can_see_profile(viewer_id));

-- ---------- account review (status + latest moderation reason, for the user themselves) ----------
create or replace function public.my_account_review()
returns table (status account_status, reason text)
language sql stable security definer set search_path = public as $$
  select p.status,
         (select note from moderation_actions m where m.target_user = p.id order by created_at desc limit 1)
  from profiles p where p.id = auth.uid();
$$;

-- ---------- introductions honour "Who you meet" ----------
create or replace function public.daily_introductions(lim int default 8)
returns table (id uuid, distance_km int)
language sql stable security definer set search_path = public as $$
  with me as (
    select pr.* from preferences pr where pr.user_id = auth.uid()
  )
  select p.id, rounded_distance_km(p.id)
  from profiles p
  left join me on true
  where p.id <> auth.uid()
    and p.status = 'active'
    and not is_blocked_between(auth.uid(), p.id)
    and not exists (select 1 from likes l where l.from_id = auth.uid() and l.to_id = p.id)
    and not exists (select 1 from passes s where s.from_id = auth.uid() and s.to_id = p.id)
    and (p.discoverability = 'everyone'
         or exists (select 1 from likes l2 where l2.from_id = p.id and l2.to_id = auth.uid()))
    and not exists (
      select 1 from profile_private mine, profile_private theirs
      where mine.user_id = auth.uid() and theirs.user_id = p.id
        and (encode(digest(theirs.phone, 'sha256'), 'hex') = any (mine.contact_hashes)
          or encode(digest(mine.phone, 'sha256'), 'hex') = any (theirs.contact_hashes)))
    -- preferences (no row = no filter)
    and (me.user_id is null or cardinality(me.genders) = 0 or p.gender = any (me.genders))
    and (me.user_id is null or extract(year from age(p.dob)) between me.age_min and me.age_max)
    and (me.user_id is null or p.intention = any (me.intentions))
    and (me.user_id is null or not me.verified_only or p.verified)
    and (me.user_id is null or coalesce(rounded_distance_km(p.id), 0) <= me.max_km)
  order by p.verified desc, p.created_at desc
  limit least(lim, 8);
$$;

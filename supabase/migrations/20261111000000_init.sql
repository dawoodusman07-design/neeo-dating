-- Neeo schema. Row Level Security is enabled on EVERY table.
-- Principles:
--   * Exact location never leaves the server: only rounded distance via RPC.
--   * Blocks are symmetric: neither side can see the other anywhere.
--   * Photos/voice live in PRIVATE buckets; read access is enforced by storage RLS
--     and clients only ever receive short-lived signed URLs.

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type intention as enum ('long_term', 'life_partner', 'figuring_out');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type account_status as enum ('active', 'paused', 'under_review', 'suspended', 'banned', 'deleted');
create type discoverability as enum ('everyone', 'liked_only');
create type message_kind as enum ('text', 'voice', 'date_proposal', 'system', 'photo');
create type report_reason as enum ('fake_profile', 'inappropriate_photos', 'harassment', 'underage', 'scam', 'offline_behaviour', 'other');
create type report_status as enum ('open', 'actioned', 'dismissed');
create type mod_action as enum ('warn', 'suspend', 'ban', 'dismiss', 'reinstate');
create type access_status as enum ('pending', 'shared', 'declined', 'revoked');
create type checkin_status as enum ('scheduled', 'checked_in', 'escalated', 'cancelled');

-- ---------- core tables ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 30),
  dob date not null check (dob <= (current_date - interval '18 years')),
  pronouns text check (char_length(pronouns) <= 30),
  intention intention not null,
  city text,
  verified boolean not null default false,
  status account_status not null default 'active',
  chaperone_enabled boolean not null default false,
  basics text[] not null default '{}',
  date_ideas text[] not null default '{}' check (cardinality(date_ideas) <= 3),
  blur_photos boolean not null default true,
  screenshot_protection boolean not null default true,
  discoverability discoverability not null default 'everyone',
  created_at timestamptz not null default now()
);

-- Owner-only data. Never readable by other users.
create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  lat double precision,
  lng double precision,
  contact_hashes text[] not null default '{}',
  quiet_hours jsonb,
  notification_prefs jsonb,
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,       -- photos/<user_id>/<uuid>.jpg
  blurred_path text,                -- photos/<user_id>/blurred/<uuid>.jpg (generated server-side)
  position smallint not null default 0,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  answer text not null check (char_length(answer) between 1 and 200),
  voice_path text,
  voice_duration_sec smallint,
  position smallint not null default 0
);

create table public.friends_takes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) <= 200),
  approved boolean not null default false
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  target_kind text check (target_kind in ('photo', 'prompt')),
  target_id uuid,
  comment text check (char_length(comment) <= 200),
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);

create table public.passes (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  closed_by uuid[] not null default '{}',
  unmatched_at timestamptz,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind message_kind not null default 'text',
  body text not null check (char_length(body) <= 2000),
  voice_path text,
  voice_duration_sec smallint,
  date_proposal jsonb,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index on public.messages (match_id, created_at);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason report_reason not null,
  details text check (char_length(details) <= 1000),
  message_id uuid references public.messages (id) on delete set null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete set null,
  target_user uuid not null references public.profiles (id) on delete cascade,
  action mod_action not null,
  note text,
  moderator_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  status text not null default 'open' check (status in ('open', 'upheld', 'overturned')),
  created_at timestamptz not null default now()
);

create table public.photo_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  status access_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (owner_id, viewer_id)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  place text not null,
  starts_at timestamptz not null,
  check_in_at timestamptz not null,
  contact_name text not null,
  contact_phone text not null,
  status checkin_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  primary key (user_id, token)
);

create table public.admins (user_id uuid primary key references auth.users (id) on delete cascade);

-- ---------- helper functions (security definer, fixed search_path) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.is_match_member(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches
    where id = m and unmatched_at is null and auth.uid() in (user_a, user_b)
      and not is_blocked_between(user_a, user_b)
  );
$$;

create or replace function public.are_matched(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches
    where user_a = least(a, b) and user_b = greatest(a, b) and unmatched_at is null
  );
$$;

-- Can the current user see this profile at all?
create or replace function public.can_see_profile(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select target = auth.uid() or (
    exists (select 1 from profiles p where p.id = target and p.status = 'active')
    and not is_blocked_between(auth.uid(), target)
    and exists (select 1 from profiles me where me.id = auth.uid() and me.status in ('active', 'paused'))
  );
$$;

-- Can the current user see UNBLURRED photos of target?
create or replace function public.can_see_clear_photos(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select target = auth.uid() or (
    can_see_profile(target) and (
      not (select blur_photos from profiles where id = target)
      or are_matched(auth.uid(), target)
      or exists (select 1 from photo_access where owner_id = target and viewer_id = auth.uid() and status = 'shared')
    )
  );
$$;

-- Rounded distance only. Exact coordinates are never returned.
create or replace function public.rounded_distance_km(target uuid) returns integer
language plpgsql stable security definer set search_path = public as $$
declare
  a profile_private; b profile_private; km double precision;
begin
  if not can_see_profile(target) then return null; end if;
  select * into a from profile_private where user_id = auth.uid();
  select * into b from profile_private where user_id = target;
  if a.lat is null or b.lat is null then return null; end if;
  km := 6371 * 2 * asin(sqrt(
    power(sin(radians(b.lat - a.lat) / 2), 2) +
    cos(radians(a.lat)) * cos(radians(b.lat)) * power(sin(radians(b.lng - a.lng) / 2), 2)));
  return case
    when km < 2 then 1
    when km < 10 then round(km)
    when km < 50 then round(km / 5) * 5
    else round(km / 10) * 10 end;
end $$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.photos enable row level security;
alter table public.prompts enable row level security;
alter table public.friends_takes enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.appeals enable row level security;
alter table public.photo_access enable row level security;
alter table public.check_ins enable row level security;
alter table public.push_tokens enable row level security;
alter table public.admins enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (can_see_profile(id) or is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Users may not self-verify or self-reinstate: these columns are server-managed.
revoke update on public.profiles from authenticated;
grant update (first_name, pronouns, intention, city, chaperone_enabled, basics, date_ideas, blur_photos, screenshot_protection, discoverability) on public.profiles to authenticated;

-- profile_private: owner only
create policy private_all on public.profile_private for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- photos: approved photos of visible profiles; owner sees all of their own
create policy photos_select on public.photos for select to authenticated
  using (user_id = auth.uid() or is_admin() or (status = 'approved' and can_see_profile(user_id)));
create policy photos_insert on public.photos for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy photos_update on public.photos for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy photos_delete on public.photos for delete to authenticated
  using (user_id = auth.uid());
revoke update on public.photos from authenticated;
grant update (position) on public.photos to authenticated;

-- prompts
create policy prompts_select on public.prompts for select to authenticated
  using (user_id = auth.uid() or can_see_profile(user_id));
create policy prompts_write on public.prompts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy friends_takes_select on public.friends_takes for select to authenticated
  using (user_id = auth.uid() or (approved and can_see_profile(user_id)));
create policy friends_takes_owner on public.friends_takes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- likes: sender and recipient can see; only sender creates
create policy likes_select on public.likes for select to authenticated
  using ((from_id = auth.uid() or to_id = auth.uid()) and not is_blocked_between(from_id, to_id));
create policy likes_insert on public.likes for insert to authenticated
  with check (from_id = auth.uid() and can_see_profile(to_id));
create policy likes_delete on public.likes for delete to authenticated
  using (from_id = auth.uid());

create policy passes_owner on public.passes for all to authenticated
  using (from_id = auth.uid()) with check (from_id = auth.uid());

-- matches: members only. Created by trigger, never directly by clients.
create policy matches_select on public.matches for select to authenticated
  using (auth.uid() in (user_a, user_b) and not is_blocked_between(user_a, user_b));
create policy matches_update on public.matches for update to authenticated
  using (auth.uid() in (user_a, user_b)) with check (auth.uid() in (user_a, user_b));
revoke update on public.matches from authenticated;
grant update (closed_by, unmatched_at) on public.matches to authenticated;

-- messages: match members only
create policy messages_select on public.messages for select to authenticated
  using (is_match_member(match_id) or is_admin());
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and is_match_member(match_id) and kind <> 'system');
create policy messages_mark_read on public.messages for update to authenticated
  using (is_match_member(match_id) and sender_id <> auth.uid());
revoke update on public.messages from authenticated;
grant update (read_at, date_proposal) on public.messages to authenticated;

-- blocks: owner only (the blocked person never learns they were blocked)
create policy blocks_owner on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- reports: reporter can create and see their own; admins see all
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (is_admin()) with check (is_admin());

create policy mod_actions_admin on public.moderation_actions for all to authenticated
  using (is_admin()) with check (is_admin() and moderator_id = auth.uid());
create policy mod_actions_target on public.moderation_actions for select to authenticated
  using (target_user = auth.uid());

create policy appeals_owner on public.appeals for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

create policy photo_access_select on public.photo_access for select to authenticated
  using (owner_id = auth.uid() or viewer_id = auth.uid());
create policy photo_access_request on public.photo_access for insert to authenticated
  with check (viewer_id = auth.uid() and status = 'pending' and can_see_profile(owner_id));
create policy photo_access_owner_update on public.photo_access for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy check_ins_owner on public.check_ins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy push_tokens_owner on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------- triggers ----------
-- Mutual like => match (with system message).
create or replace function public.handle_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare m uuid;
begin
  if exists (select 1 from likes where from_id = new.to_id and to_id = new.from_id) then
    insert into matches (user_a, user_b)
      values (least(new.from_id, new.to_id), greatest(new.from_id, new.to_id))
      on conflict (user_a, user_b) do nothing
      returning id into m;
    if m is not null then
      insert into messages (match_id, sender_id, kind, body) values (m, new.from_id, 'system', 'matched');
      if new.comment is not null then
        insert into messages (match_id, sender_id, kind, body) values (m, new.from_id, 'text', new.comment);
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger on_like after insert on public.likes for each row execute function public.handle_like();

-- Blocking removes the match.
create or replace function public.handle_block() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update matches set unmatched_at = now()
    where user_a = least(new.blocker_id, new.blocked_id) and user_b = greatest(new.blocker_id, new.blocked_id);
  delete from photo_access where (owner_id = new.blocker_id and viewer_id = new.blocked_id)
                              or (owner_id = new.blocked_id and viewer_id = new.blocker_id);
  return new;
end $$;
create trigger on_block after insert on public.blocks for each row execute function public.handle_block();

-- Moderation actions update account status.
create or replace function public.apply_mod_action() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set status = case new.action
      when 'suspend' then 'suspended'::account_status
      when 'ban' then 'banned'::account_status
      when 'reinstate' then 'active'::account_status
      else status end
    where id = new.target_user;
  if new.report_id is not null then
    update reports set status = case when new.action = 'dismiss' then 'dismissed'::report_status else 'actioned'::report_status end
      where id = new.report_id;
  end if;
  return new;
end $$;
create trigger on_mod_action after insert on public.moderation_actions for each row execute function public.apply_mod_action();

-- ---------- RPCs ----------
-- Daily introductions: limited, excludes blocked, already-acted, hidden-by-contacts
-- and liked_only profiles that haven't liked me.
create or replace function public.daily_introductions(lim int default 8)
returns table (id uuid, distance_km int)
language sql stable security definer set search_path = public as $$
  select p.id, rounded_distance_km(p.id)
  from profiles p
  where p.id <> auth.uid()
    and p.status = 'active'
    and not is_blocked_between(auth.uid(), p.id)
    and not exists (select 1 from likes l where l.from_id = auth.uid() and l.to_id = p.id)
    and not exists (select 1 from passes s where s.from_id = auth.uid() and s.to_id = p.id)
    and (p.discoverability = 'everyone'
         or exists (select 1 from likes l2 where l2.from_id = p.id and l2.to_id = auth.uid()))
    -- Block contacts: hide people whose phone hash is in either side's contact list.
    and not exists (
      select 1 from profile_private mine, profile_private theirs
      where mine.user_id = auth.uid() and theirs.user_id = p.id
        and (encode(digest(theirs.phone, 'sha256'), 'hex') = any (mine.contact_hashes)
          or encode(digest(mine.phone, 'sha256'), 'hex') = any (theirs.contact_hashes)))
  order by p.verified desc, p.created_at desc
  limit least(lim, 8);
$$;

-- Account deletion (Apple 5.1.1(v) / Google Play): removes the auth user, which
-- cascades to every table. Storage objects are removed by the delete-account Edge Function.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- storage (private buckets) ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', false), ('voice', 'voice', false)
  on conflict (id) do nothing;

-- Paths: photos/<owner_uuid>/<file> (clear) and photos/<owner_uuid>/blurred/<file>
create policy photos_owner_write on storage.objects for insert to authenticated
  with check (bucket_id in ('photos', 'voice') and (storage.foldername(name))[1] = auth.uid()::text
              and coalesce((storage.foldername(name))[2], '') <> 'blurred');
create policy photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id in ('photos', 'voice') and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_read on storage.objects for select to authenticated
  using (
    bucket_id = 'photos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or ((storage.foldername(name))[2] = 'blurred' and can_see_profile(((storage.foldername(name))[1])::uuid))
      or ((storage.foldername(name))[2] is distinct from 'blurred' and can_see_clear_photos(((storage.foldername(name))[1])::uuid))
    )
  );
-- voice/<owner>/prompts/<file> : anyone who can see the profile
-- voice/<owner>/chat/<match_id>/<file> : only members of that match
create policy voice_read on storage.objects for select to authenticated
  using (bucket_id = 'voice' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[2] = 'prompts' and can_see_profile(((storage.foldername(name))[1])::uuid))
    or ((storage.foldername(name))[2] = 'chat' and is_match_member(((storage.foldername(name))[3])::uuid))
  ));

-- ---------- realtime ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

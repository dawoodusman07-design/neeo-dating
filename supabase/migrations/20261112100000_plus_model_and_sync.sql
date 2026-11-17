-- Decisions (2026-11-12):
--  * Seeing and replying to likes is FREE (no server change needed: likes_select already lets
--    the recipient read their likes; nothing in the database ever restricted it).
--  * Neeo Plus = advanced filters (verified only, voice prompts only), saved preference presets,
--    travel mode. Enforced here, not just in the app.
--  * Saved profiles, saved date plans and private notes sync across devices (owner-only RLS).

-- ---------- Plus entitlement ----------
create or replace function public.has_plus(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from entitlements e
    where e.user_id = uid and e.is_plus and (e.expires_at is null or e.expires_at > now())
  );
$$;

alter table public.preferences
  add column voice_only boolean not null default false,
  add column travel_city text check (char_length(travel_city) between 2 and 60);

-- Free users may turn Plus features OFF (and delete presets) but never turn them ON.
-- When Plus ends, existing values stay stored but are ignored by daily_introductions().
create or replace function public.guard_plus_preferences() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  old_verified boolean := false;
  old_voice boolean := false;
  old_travel text := null;
  old_presets int := 0;
begin
  if tg_op = 'UPDATE' then
    old_verified := old.verified_only;
    old_voice := old.voice_only;
    old_travel := old.travel_city;
    old_presets := jsonb_array_length(old.presets);
  end if;
  if (new.verified_only and not old_verified)
     or (new.voice_only and not old_voice)
     or (new.travel_city is not null and new.travel_city is distinct from old_travel)
     or (jsonb_array_length(new.presets) > old_presets) then
    if not has_plus(new.user_id) then
      raise exception 'plus_required' using errcode = '42501', hint = 'Advanced filters, presets and travel mode need Neeo Plus';
    end if;
  end if;
  return new;
end $$;
create trigger preferences_plus_guard before insert or update on public.preferences
  for each row execute function public.guard_plus_preferences();

-- ---------- introductions: Plus filters only apply while Plus is active ----------
create or replace function public.daily_introductions(lim int default 8)
returns table (id uuid, distance_km int)
language sql stable security definer set search_path = public as $$
  with me as (
    select pr.*, has_plus(auth.uid()) as plus from preferences pr where pr.user_id = auth.uid()
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
    -- free preferences
    and (me.user_id is null or cardinality(me.genders) = 0 or p.gender = any (me.genders))
    and (me.user_id is null or extract(year from age(p.dob)) between me.age_min and me.age_max)
    and (me.user_id is null or p.intention = any (me.intentions))
    -- Plus: advanced filters
    and (me.user_id is null or not me.plus or not me.verified_only or p.verified)
    and (me.user_id is null or not me.plus or not me.voice_only
         or exists (select 1 from prompts pr2 where pr2.user_id = p.id and pr2.voice_path is not null))
    -- Plus: travel mode replaces the distance limit with the chosen city
    and (case
           when me.user_id is not null and me.plus and me.travel_city is not null
             then lower(p.city) = lower(me.travel_city)
           else me.user_id is null or coalesce(rounded_distance_km(p.id), 0) <= me.max_km
         end)
  order by p.verified desc, p.created_at desc
  limit least(lim, 8);
$$;

-- ---------- synced personal lists (owner only) ----------
create table public.saved_profiles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, profile_id),
  check (user_id <> profile_id)
);
create table public.date_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  partner_name text not null check (char_length(partner_name) <= 30),
  idea text not null check (char_length(idea) between 1 and 120),
  when_text text check (char_length(when_text) <= 80),
  place text check (char_length(place) <= 120),
  created_at timestamptz not null default now()
);
create table public.profile_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);
alter table public.saved_profiles enable row level security;
alter table public.date_plans enable row level security;
alter table public.profile_notes enable row level security;

-- Saving requires being able to see the profile (no saving blocked / suspended people).
create policy saved_profiles_select on public.saved_profiles for select to authenticated using (user_id = auth.uid());
create policy saved_profiles_insert on public.saved_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.can_see_profile(profile_id));
create policy saved_profiles_delete on public.saved_profiles for delete to authenticated using (user_id = auth.uid());

-- A plan may only reference one of your own matches.
create policy date_plans_owner on public.date_plans for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (match_id is null or exists (
    select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b))));

create policy profile_notes_owner on public.profile_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

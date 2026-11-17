-- QA pass (2026-11-17): chaperone invites, Friend's Take invites, check-in "I need help".

-- ---------------------------------------------------------------- check-ins
alter type checkin_status add value if not exists 'help_requested';

-- Owners may answer their own check-in (okay / need help / cancel) but never mark it escalated:
-- only the escalation job (service role, no auth.uid()) does that after texting the contact.
create or replace function public.check_ins_status_guard() returns trigger
language plpgsql as $$
begin
  if auth.uid() is null then return new; end if; -- service role / jobs
  if tg_op = 'INSERT' and new.status <> 'scheduled' then
    raise exception 'new check-ins start as scheduled' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status <> 'scheduled' or new.status::text not in ('checked_in', 'help_requested', 'cancelled') then
      raise exception 'check-in status change not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists check_ins_status_guard on public.check_ins;
create trigger check_ins_status_guard before insert or update on public.check_ins
  for each row execute function public.check_ins_status_guard();

-- ---------------------------------------------------------------- invites
-- People outside Neeo (no account) answer through neeo.app/invite?t=<token>, which calls the
-- invite-respond Edge Function (service role). Nobody but the owner can read an invite.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('chaperone', 'friends_take')),
  name text not null check (char_length(name) between 2 and 60),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'sent' check (status in ('sent', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index invites_user_idx on public.invites (user_id, kind);
alter table public.invites enable row level security;

create policy invites_owner_select on public.invites for select to authenticated using (user_id = auth.uid());
create policy invites_owner_insert on public.invites for insert to authenticated with check (user_id = auth.uid() and status = 'sent');
create policy invites_owner_revoke on public.invites for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'revoked');
revoke all on public.invites from authenticated;
grant select, insert (user_id, kind, name, phone) on public.invites to authenticated;
grant update (status) on public.invites to authenticated;

-- ---------------------------------------------------------------- friends' takes
-- Takes are written by the friend (via invite-respond), never by the profile owner.
-- The owner can only approve/hide or delete them.
alter table public.friends_takes add column if not exists created_at timestamptz not null default now();
alter table public.friends_takes add column if not exists invite_id uuid references public.invites (id) on delete set null;
revoke insert, update on public.friends_takes from authenticated;
grant update (approved) on public.friends_takes to authenticated;
grant delete on public.friends_takes to authenticated;

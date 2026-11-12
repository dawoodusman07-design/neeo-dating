-- RLS isolation tests. Run with supabase/tests/run-rls-tests.sh (plain Postgres)
-- or against a local Supabase stack with psql. Any failed assertion aborts with an error.
\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), false);
  execute 'set role authenticated';
end $$;

create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;

-- Fixtures (as superuser)
\set alice '''aaaaaaaa-0000-0000-0000-000000000001'''
\set bob   '''bbbbbbbb-0000-0000-0000-000000000002'''
\set carol '''cccccccc-0000-0000-0000-000000000003'''
\set dave  '''dddddddd-0000-0000-0000-000000000004'''

insert into auth.users (id, phone) values (:alice, '+15550000001'), (:bob, '+15550000002'), (:carol, '+15550000003'), (:dave, '+15550000004');
insert into profiles (id, first_name, dob, intention, blur_photos) values
  (:alice, 'Alice', '1995-01-01', 'long_term', true),
  (:bob,   'Bob',   '1994-01-01', 'long_term', true),
  (:carol, 'Carol', '1996-01-01', 'life_partner', false),
  (:dave,  'Dave',  '1993-01-01', 'figuring_out', true);
insert into profile_private (user_id, phone, lat, lng) values
  (:alice, '+15550000001', 43.6532, -79.3832),
  (:bob,   '+15550000002', 43.6700, -79.3900),
  (:carol, '+15550000003', 43.7000, -79.4000),
  (:dave,  '+15550000004', 43.6000, -79.5000);
insert into photos (user_id, storage_path, blurred_path, status) values
  (:alice, 'aaaaaaaa-0000-0000-0000-000000000001/p1.jpg', 'aaaaaaaa-0000-0000-0000-000000000001/blurred/p1.jpg', 'approved'),
  (:alice, 'aaaaaaaa-0000-0000-0000-000000000001/p2.jpg', null, 'pending');
insert into storage.objects (bucket_id, name) values
  ('photos', 'aaaaaaaa-0000-0000-0000-000000000001/p1.jpg'),
  ('photos', 'aaaaaaaa-0000-0000-0000-000000000001/blurred/p1.jpg'),
  ('voice',  'aaaaaaaa-0000-0000-0000-000000000001/prompts/v1.m4a');

-- ---- Matching via mutual like (through RLS, as the users themselves) ----
select pg_temp.as_user(:alice);
insert into likes (from_id, to_id, comment) values (:alice, :bob, 'Hi Bob');
reset role;
select pg_temp.as_user(:bob);
insert into likes (from_id, to_id) values (:bob, :alice);
select pg_temp.expect((select count(*) from matches) = 1, 'mutual like creates exactly one match visible to Bob');
insert into messages (match_id, sender_id, body) select id, :bob, 'Hello Alice' from matches;
reset role;

insert into storage.objects (bucket_id, name)
  select 'voice', 'aaaaaaaa-0000-0000-0000-000000000001/chat/' || id || '/n1.m4a' from matches;

-- ---- Dave (unrelated) cannot read Alice <-> Bob private data ----
select pg_temp.as_user(:dave);
select pg_temp.expect((select count(*) from matches) = 0, 'outsider sees no matches');
select pg_temp.expect((select count(*) from messages) = 0, 'outsider cannot read chat messages');
select pg_temp.expect((select count(*) from likes) = 0, 'outsider cannot see likes between others');
select pg_temp.expect((select count(*) from profile_private where user_id <> :dave) = 0, 'outsider cannot read anyone else''s private data (phone, location)');
select pg_temp.expect((select count(*) from photos where user_id = :alice) = 1, 'outsider sees only APPROVED photos of Alice');
select pg_temp.expect(not exists (select 1 from storage.objects where name = 'aaaaaaaa-0000-0000-0000-000000000001/p1.jpg'), 'outsider cannot read Alice''s clear (unblurred) photo file');
select pg_temp.expect(exists (select 1 from storage.objects where name = 'aaaaaaaa-0000-0000-0000-000000000001/blurred/p1.jpg'), 'outsider can read Alice''s blurred photo variant');
select pg_temp.expect(exists (select 1 from storage.objects where name like '%/prompts/v1.m4a'), 'outsider can play Alice''s voice prompt');
select pg_temp.expect(not exists (select 1 from storage.objects where name like '%/chat/%'), 'outsider cannot read chat voice notes');
select pg_temp.expect(rounded_distance_km(:alice) between 1 and 100, 'distance is available but only as a rounded integer');

do $$ begin
  insert into messages (match_id, sender_id, body) select id, auth.uid(), 'sneaky' from public.matches;
  -- no visible matches means zero rows inserted; also try a direct insert with a known id:
  perform 1;
end $$;
reset role;
do $$ declare mid uuid; begin
  select id into mid from matches limit 1;
  perform set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000004', false);
  set role authenticated;
  begin
    insert into messages (match_id, sender_id, body) values (mid, 'dddddddd-0000-0000-0000-000000000004', 'sneaky');
    raise exception 'FAIL: outsider inserted a message into another match';
  exception when insufficient_privilege then raise notice 'ok - outsider cannot post into another match';
  end;
  begin
    insert into messages (match_id, sender_id, body) values (mid, 'aaaaaaaa-0000-0000-0000-000000000001', 'spoof');
    raise exception 'FAIL: user spoofed sender_id';
  exception when insufficient_privilege then raise notice 'ok - cannot spoof another sender';
  end;
  reset role;
end $$;

-- ---- Bob (matched) can see clear photos + chat; cannot read Alice's private row ----
select pg_temp.as_user(:bob);
select pg_temp.expect(exists (select 1 from storage.objects where name = 'aaaaaaaa-0000-0000-0000-000000000001/p1.jpg'), 'match can read clear photo');
select pg_temp.expect(exists (select 1 from storage.objects where name like '%/chat/%'), 'match can read chat voice note');
select pg_temp.expect((select count(*) from messages) >= 2, 'match members can read their chat');
select pg_temp.expect((select count(*) from profile_private where user_id = :alice) = 0, 'match still cannot read Alice''s phone or exact location');
select pg_temp.expect((select count(*) from photos where user_id = :alice) = 1, 'match cannot see Alice''s pending (unmoderated) photo');
reset role;

-- ---- Users cannot self-verify, self-reinstate or create matches directly ----
do $$ begin
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
  set role authenticated;
  begin
    update profiles set verified = true where id = auth.uid();
    raise exception 'FAIL: user self-verified';
  exception when insufficient_privilege then raise notice 'ok - users cannot set their own Verified badge';
  end;
  begin
    update profiles set status = 'active' where id = auth.uid();
    raise exception 'FAIL: user changed own status';
  exception when insufficient_privilege then raise notice 'ok - users cannot lift their own suspension';
  end;
  begin
    insert into matches (user_a, user_b) values ('aaaaaaaa-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000004');
    raise exception 'FAIL: user created a match directly';
  exception when insufficient_privilege then raise notice 'ok - matches cannot be forged';
  end;
  begin
    update photos set status = 'approved' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
    raise exception 'FAIL: user approved photos';
  exception when insufficient_privilege then raise notice 'ok - users cannot bypass photo moderation';
  end;
  reset role;
end $$;

-- ---- Blocking is symmetric and removes the match ----
select pg_temp.as_user(:alice);
insert into blocks (blocker_id, blocked_id) values (:alice, :bob);
select pg_temp.expect((select count(*) from profiles where id = :bob) = 0, 'blocker no longer sees blocked profile');
select pg_temp.expect((select count(*) from messages) = 0, 'blocker no longer sees chat');
reset role;
select pg_temp.as_user(:bob);
select pg_temp.expect((select count(*) from profiles where id = :alice) = 0, 'blocked user can no longer see blocker');
select pg_temp.expect((select count(*) from messages) = 0, 'blocked user loses chat access');
select pg_temp.expect((select count(*) from blocks) = 0, 'blocked user cannot see the block record');
select pg_temp.expect(not exists (select 1 from storage.objects where bucket_id = 'photos'), 'blocked user loses access to all of Alice''s photo files');
select pg_temp.expect(rounded_distance_km(:alice) is null, 'blocked user gets no distance');
reset role;

-- ---- Reports and check-ins are private ----
select pg_temp.as_user(:alice);
insert into reports (reporter_id, reported_id, reason) values (:alice, :bob, 'harassment');
insert into check_ins (user_id, place, starts_at, check_in_at, contact_name, contact_phone)
  values (:alice, 'Cafe', now(), now() + interval '2 hours', 'Mum', '+15550009999');
reset role;
select pg_temp.as_user(:dave);
select pg_temp.expect((select count(*) from reports) = 0, 'reports are visible only to the reporter and moderators');
select pg_temp.expect((select count(*) from check_ins) = 0, 'date check-ins (and trusted contact) are private');
reset role;
select pg_temp.as_user(:bob);
select pg_temp.expect((select count(*) from reports) = 0, 'reported user cannot see who reported them');
reset role;

-- ---- Account deletion cascades ----
select pg_temp.as_user(:dave);
select delete_my_account();
reset role;
select pg_temp.expect((select count(*) from profiles where id = :dave) = 0, 'delete_my_account removes the profile');
select pg_temp.expect((select count(*) from profile_private where user_id = :dave) = 0, 'delete_my_account removes private data');
select pg_temp.expect((select count(*) from auth.users where id = :dave) = 0, 'delete_my_account removes the auth user');

select pg_temp.as_user(:carol);
select pg_temp.expect(exists (select 1 from daily_introductions(8) where id = :bob), 'control: Carol is introduced to Bob before any moderation');
reset role;

-- ---- Moderation queue: only admins see it; actions apply account status ----
insert into auth.users (id) values ('eeeeeeee-0000-0000-0000-000000000005');
insert into profiles (id, first_name, dob, intention) values ('eeeeeeee-0000-0000-0000-000000000005', 'Mod', '1990-01-01', 'long_term');
insert into admins (user_id) values ('eeeeeeee-0000-0000-0000-000000000005');
select pg_temp.as_user(:bob);
select pg_temp.expect((select count(*) from moderation_queue) = 0, 'non-admins see an empty moderation queue');
reset role;
select pg_temp.as_user('eeeeeeee-0000-0000-0000-000000000005');
select pg_temp.expect((select count(*) from moderation_queue) >= 1, 'admins see open reports in the queue');
insert into moderation_actions (report_id, target_user, action, moderator_id)
  select report_id, reported_id, 'suspend', auth.uid() from moderation_queue limit 1;
reset role;
select pg_temp.expect((select status from profiles where id = :bob) = 'suspended', 'suspend action suspends the account');
select pg_temp.expect((select count(*) from reports where status = 'open') = 0, 'actioned report leaves the queue');
select pg_temp.as_user(:carol);
select pg_temp.expect((select count(*) from profiles where id = :bob) = 0, 'suspended users disappear for everyone else');
select pg_temp.expect(not exists (select 1 from daily_introductions(8) where id = :bob), 'suspended users are excluded from introductions');
reset role;

-- ---- Package gaps: preferences, support, inbox, appeal outcome ----
select pg_temp.as_user(:carol);
insert into preferences (user_id, genders, age_min, age_max) values (:carol, '{man}', 25, 40);
insert into support_tickets (user_id, topic) values (:carol, 'billing');
insert into support_messages (ticket_id, sender, body) select id, 'user', 'I was charged twice' from support_tickets;
reset role;
update profiles set gender = 'man' where id = :alice;
select pg_temp.as_user(:alice);
select pg_temp.expect((select count(*) from preferences) = 0, 'preferences are private to their owner');
select pg_temp.expect((select count(*) from support_tickets) = 0, 'support tickets are private');
select pg_temp.expect((select count(*) from support_messages) = 0, 'support messages are private');
do $$ begin
  begin
    insert into support_messages (ticket_id, sender, body) select id, 'support', 'fake reply' from public.support_tickets;
    insert into public.inbox_items (user_id, kind, title, body) values (auth.uid(), 'x', 'y', 'z');
    raise exception 'FAIL: user wrote an inbox item';
  exception when insufficient_privilege then raise notice 'ok - users cannot write inbox items or fake support replies';
  end;
end $$;
reset role;
select pg_temp.as_user(:carol);
select pg_temp.expect((select count(*) from support_messages) = 1, 'owner reads their own support conversation');
do $$ begin
  begin
    insert into public.support_messages (ticket_id, sender, body) select id, 'support', 'spoof' from public.support_tickets;
    raise exception 'FAIL: user posted as support';
  exception when insufficient_privilege then raise notice 'ok - users cannot post as support';
  end;
end $$;
select pg_temp.expect(exists (select 1 from daily_introductions(8) where id = :alice), 'preferences: Carol (wants men 25-40) is introduced to Alice (man, 31)');
reset role;
update preferences set genders = '{woman}' where user_id = :carol;
select pg_temp.as_user(:carol);
select pg_temp.expect(not exists (select 1 from daily_introductions(8) where id = :alice), 'preferences: changing "Who you meet" removes non-matching people');
reset role;

-- reporter gets an outcome in their inbox (Alice reported Bob earlier and Bob was suspended)
select pg_temp.as_user(:alice);
select pg_temp.expect(exists (select 1 from inbox_items where kind = 'report_outcome'), 'reporter receives a report outcome in their inbox');
select pg_temp.expect(not exists (select 1 from inbox_items where body ilike '%suspend%'), 'report outcome does not reveal the action taken');
reset role;
select pg_temp.as_user(:bob);
insert into appeals (user_id, body) values (:bob, 'I think this was a mistake.');
select pg_temp.expect((select status from my_account_review()) = 'suspended', 'suspended user can read their own review status');
reset role;
update appeals set status = 'overturned' where user_id = :bob;
select pg_temp.as_user(:bob);
select pg_temp.expect(exists (select 1 from inbox_items where kind = 'appeal_outcome'), 'appeal outcome is delivered to the appellant');
reset role;

\echo 'ALL RLS TESTS PASSED'

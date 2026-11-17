// Public endpoint used by neeo.app/invite?t=<token> (no Neeo account needed).
//   GET  ?t=token                         -> { kind, firstName } of the person who invited them
//   POST { token, action: 'accept' }       -> chaperone accepts
//   POST { token, action: 'take', author, body } -> friend writes a Friend's Take (owner approves it in the app)
// Uses the service role because the invited person has no account; the token is the capability.
import { adminClient, cors, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = adminClient();
  const url = new URL(req.url);
  const input = req.method === 'POST' ? await req.json().catch(() => ({})) : { token: url.searchParams.get('t') };
  const token = String(input.token ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: 'invalid' }, 400);

  const { data: inv } = await db.from('invites').select('id, user_id, kind, status, profiles(first_name)').eq('token', token).maybeSingle();
  if (!inv || inv.status !== 'sent') return json({ error: 'expired' }, 410);
  // deno-lint-ignore no-explicit-any
  const firstName = (inv as any).profiles?.first_name ?? '';
  if (req.method === 'GET') return json({ kind: inv.kind, firstName });

  if (inv.kind === 'chaperone' && input.action === 'accept') {
    await db.from('invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', inv.id);
    await db.from('profiles').update({ chaperone_enabled: true }).eq('id', inv.user_id);
    await db.from('inbox_items').insert({ user_id: inv.user_id, kind: 'chaperone_accepted', title: 'Chaperone added', body: 'Your chaperone accepted. Add them to a chat from the chat’s safety menu.', href: '/settings/chaperone' });
    return json({ ok: true });
  }
  if (inv.kind === 'friends_take' && input.action === 'take') {
    const author = String(input.author ?? '').trim().slice(0, 40);
    const body = String(input.body ?? '').trim();
    if (author.length < 2 || body.length < 10 || body.length > 200) return json({ error: 'invalid' }, 400);
    // Text moderation runs on insert (moderate-text webhook); the owner must approve before anyone sees it.
    await db.from('friends_takes').insert({ user_id: inv.user_id, author_name: author, body, approved: false, invite_id: inv.id });
    await db.from('invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', inv.id);
    await db.from('inbox_items').insert({ user_id: inv.user_id, kind: 'friends_take', title: 'A Friend’s Take arrived', body: `${author} wrote something about you. Read it and choose whether to show it.`, href: '/settings/friends-take' });
    return json({ ok: true });
  }
  return json({ error: 'invalid' }, 400);
});

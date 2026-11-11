// iOS cannot block screenshots; when one is detected the app calls this to add a
// system note to the chat ("A screenshot was taken") visible to both people.
import { adminClient, cors, json, requireUser, userClient } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const { matchId } = await req.json();
    const { data: ok } = await userClient(req).rpc('is_match_member', { m: matchId });
    if (!ok) return json({ error: 'not a member' }, 403);
    await adminClient().from('messages').insert({ match_id: matchId, sender_id: user.id, kind: 'system', body: 'screenshot_taken' });
    return json({ ok: true });
  } catch (e) {
    return e instanceof Response ? e : json({ error: String(e) }, 500);
  }
});

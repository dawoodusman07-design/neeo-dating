// Pause / unpause (status is not user-writable directly, so moderation states
// like 'suspended' can't be overwritten by the client).
import { adminClient, cors, json, requireUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const { action } = await req.json();
    const db = adminClient();
    const { data: p } = await db.from('profiles').select('status').eq('id', user.id).single();
    if (!p || !['active', 'paused'].includes(p.status)) return json({ error: 'not allowed' }, 403);
    await db.from('profiles').update({ status: action === 'pause' ? 'paused' : 'active' }).eq('id', user.id);
    return json({ ok: true });
  } catch (e) {
    return e instanceof Response ? e : json({ error: String(e) }, 500);
  }
});

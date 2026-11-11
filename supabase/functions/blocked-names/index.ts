// Returns first names for the caller's own block list (blocked profiles are
// invisible through RLS by design, so the "Blocked accounts" screen needs this).
import { adminClient, cors, json, requireUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const db = adminClient();
    const { data: blocks } = await db.from('blocks').select('blocked_id').eq('blocker_id', user.id);
    const ids = (blocks ?? []).map((b) => b.blocked_id);
    const { data } = await db.from('profiles').select('id, first_name').in('id', ids);
    return json(Object.fromEntries((data ?? []).map((p) => [p.id, p.first_name])));
  } catch (e) {
    return e instanceof Response ? e : json({ error: String(e) }, 500);
  }
});

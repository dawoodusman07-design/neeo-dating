// "Export my data": builds a JSON archive of the user's own rows (via RLS) and
// returns a signed link valid for 7 days.
import { adminClient, cors, json, requireUser, userClient } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const sb = userClient(req);
    const tables = ['profiles', 'profile_private', 'photos', 'prompts', 'likes', 'matches', 'messages', 'blocks', 'reports', 'appeals', 'check_ins'];
    const dump: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id, phone: user.phone };
    for (const t of tables) dump[t] = (await sb.from(t).select('*')).data;
    const db = adminClient();
    const path = `exports/${user.id}/${Date.now()}.json`;
    await db.storage.from('exports').upload(path, JSON.stringify(dump, null, 2), { contentType: 'application/json' });
    const { data } = await db.storage.from('exports').createSignedUrl(path, 7 * 24 * 3600);
    return json({ status: 'ready', url: data?.signedUrl, expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: String(e) }, 500);
  }
});

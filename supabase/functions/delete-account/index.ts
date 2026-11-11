// In-app account deletion (Apple 5.1.1(v), Google Play). Also used by the public
// web form at neeo.app/delete-account (after phone OTP sign-in on the web page).
import { adminClient, cors, json, requireUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const db = adminClient();
    for (const bucket of ['photos', 'voice']) {
      // remove every object under <uid>/ (recursively, paged)
      const stack = [user.id];
      while (stack.length) {
        const prefix = stack.pop()!;
        const { data } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
        const files = (data ?? []).filter((o) => o.id).map((o) => `${prefix}/${o.name}`);
        (data ?? []).filter((o) => !o.id).forEach((d) => stack.push(`${prefix}/${d.name}`));
        if (files.length) await db.storage.from(bucket).remove(files);
      }
    }
    // Safety reports about this user are retained (anonymised) per the Privacy Policy. [LEGAL REVIEW]
    await db.from('reports').update({ details: null }).eq('reporter_id', user.id);
    // RevenueCat: delete the customer so receipts are no longer linked to this user.
    const rc = Deno.env.get('REVENUECAT_SECRET_KEY');
    if (rc) await fetch(`https://api.revenuecat.com/v1/subscribers/${user.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${rc}` } });
    const { error } = await db.auth.admin.deleteUser(user.id); // cascades to every table
    if (error) throw error;
    return json({ deleted: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: String(e) }, 500);
  }
});

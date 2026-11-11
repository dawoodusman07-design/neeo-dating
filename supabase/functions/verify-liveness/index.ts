// Server side of selfie/face liveness. The app's LivenessVerifier interface
// (src/services/verification.ts) talks to this; this talks to the vendor.
// [VENDOR TBD: FaceTec / AWS Rekognition Face Liveness / Persona / Veriff]
// Only this function can set profiles.verified (column is not user-writable).
import { adminClient, cors, json, requireUser } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await requireUser(req);
    const { sessionId } = await req.json();
    const vendor = Deno.env.get('LIVENESS_API_URL');
    if (!vendor) return json({ status: 'manual_review' }); // never auto-verify without a vendor
    const res = await fetch(`${vendor}/sessions/${sessionId}`, { headers: { authorization: `Bearer ${Deno.env.get('LIVENESS_API_KEY')}` } });
    const out = await res.json();
    if (out.live && out.matchesProfilePhotos) {
      await adminClient().from('profiles').update({ verified: true }).eq('id', user.id);
      return json({ status: 'verified' });
    }
    return json({ status: out.live ? 'manual_review' : 'retry' });
  } catch (e) {
    return e instanceof Response ? e : json({ error: String(e) }, 500);
  }
});

// Automated image check on upload (nudity / violence) + blurred variant generation.
// Triggered by a Storage webhook on photos/* INSERT. [VENDOR TBD: e.g. AWS Rekognition
// DetectModerationLabels, Google Cloud Vision SafeSearch, Hive]. Mocked: approves everything
// unless MODERATION_API_URL is configured.
import { adminClient, json } from '../_shared/client.ts';

async function scan(bytes: Uint8Array): Promise<{ approved: boolean; labels: string[] }> {
  const url = Deno.env.get('MODERATION_API_URL');
  if (!url) return { approved: true, labels: [] };
  const res = await fetch(url, { method: 'POST', body: bytes, headers: { authorization: `Bearer ${Deno.env.get('MODERATION_API_KEY')}` } });
  const out = await res.json();
  return { approved: !out.flagged, labels: out.labels ?? [] };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('Forbidden', { status: 403 });
  const { record } = await req.json(); // storage.objects row
  const path: string = record.name;
  if (path.includes('/blurred/')) return json({ skipped: true });
  const db = adminClient();
  const { data: file } = await db.storage.from('photos').download(path);
  if (!file) return json({ error: 'missing' }, 404);
  const verdict = await scan(new Uint8Array(await file.arrayBuffer()));
  // Blurred variant: use Supabase image transformations (server-side) so clear
  // photos never reach users who aren't allowed to see them.
  const blurredPath = path.replace(/^([^/]+)\//, '$1/blurred/');
  const { data: blurred } = await db.storage.from('photos').download(path, { transform: { width: 64, quality: 30 } });
  if (blurred) await db.storage.from('photos').upload(blurredPath, blurred, { upsert: true, contentType: 'image/jpeg' });
  await db.from('photos').update({ status: verdict.approved ? 'approved' : 'rejected', blurred_path: blurredPath }).eq('storage_path', path);
  if (!verdict.approved) await db.storage.from('photos').remove([path]);
  return json({ ok: true, ...verdict });
});

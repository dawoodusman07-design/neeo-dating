// RevenueCat → Supabase: mirrors the Plus entitlement for server-side checks
// (daily introductions limit, see-who-liked-you) and records billing issues.
import { adminClient, json } from '../_shared/client.ts';

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_AUTH')}`) return new Response('Forbidden', { status: 403 });
  const { event } = await req.json();
  const activeTypes = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE'];
  const row: Record<string, unknown> = { user_id: event.app_user_id, updated_at: new Date().toISOString() };
  if (activeTypes.includes(event.type)) Object.assign(row, { is_plus: true, billing_issue: false, expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null });
  if (event.type === 'EXPIRATION') Object.assign(row, { is_plus: false });
  if (event.type === 'BILLING_ISSUE') Object.assign(row, { billing_issue: true });
  await adminClient().from('entitlements').upsert(row);
  return json({ ok: true });
});

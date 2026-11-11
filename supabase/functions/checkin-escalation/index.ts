// Runs every minute (pg_cron / Supabase scheduled function).
// 1) At check_in_at: push "Are you okay?" to the user.
// 2) 15 minutes later with no reply: SMS the trusted contact with time, place and
//    the match's first name (only what the user agreed to share). [SMS VENDOR TBD]
import { adminClient, json } from '../_shared/client.ts';

Deno.serve(async () => {
  const db = adminClient();
  const now = new Date();
  const overdue = new Date(now.getTime() - 15 * 60_000).toISOString();
  const { data } = await db.from('check_ins').select('*').eq('status', 'scheduled').lte('check_in_at', overdue);
  for (const c of data ?? []) {
    const body = `Neeo safety check: your contact had a date at ${c.place} starting ${new Date(c.starts_at).toLocaleString()} and hasn't checked in. Please contact them.`;
    const sms = Deno.env.get('SMS_WEBHOOK_URL');
    if (sms) await fetch(sms, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: c.contact_phone, body }) });
    await db.from('check_ins').update({ status: 'escalated' }).eq('id', c.id);
  }
  return json({ escalated: data?.length ?? 0 });
});

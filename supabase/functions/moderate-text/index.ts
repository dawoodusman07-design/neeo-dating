// Server-side text moderation. Called by a DB webhook on messages INSERT;
// sets messages.flagged so the recipient sees the auto-blur + "Does this bother you?".
// Ships with a keyword list; swap classify() for an LLM/moderation API later. [VENDOR TBD]
import { adminClient, json } from '../_shared/client.ts';

const NUDGE = [/\b(ugly|stupid|idiot|loser|worthless|pathetic)\b/i, /\b(nudes?|send pics)\b/i, /\b(crypto|bitcoin|gift ?card|wire money)\b/i];
const BLOCK = [/\bkill yourself\b/i, /\bkys\b/i, /\bi(?:'| wi)ll (?:hurt|kill|find) you\b/i];

export function classify(text: string): 'none' | 'nudge' | 'block' {
  if (BLOCK.some((r) => r.test(text))) return 'block';
  if (NUDGE.some((r) => r.test(text))) return 'nudge';
  return 'none';
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('Forbidden', { status: 403 });
  const { record } = await req.json();
  const verdict = classify(record.body ?? '');
  if (verdict === 'none') return json({ ok: true });
  const db = adminClient();
  await db.from('messages').update({ flagged: true }).eq('id', record.id);
  if (verdict === 'block') {
    await db.from('reports').insert({ reporter_id: record.sender_id, reported_id: record.sender_id, reason: 'harassment', details: 'auto: blocked text', message_id: record.id });
  }
  return json({ ok: true, verdict });
});

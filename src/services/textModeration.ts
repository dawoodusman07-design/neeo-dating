/**
 * Harmful-message checks. Ships with a keyword moderator; swap in an LLM-backed
 * implementation (e.g. an Edge Function) by implementing TextModerator.
 */
export type Severity = 'none' | 'nudge' | 'block';
export type ModerationCategory = 'insult' | 'sexual' | 'threat' | 'hate' | 'scam' | 'contact_pressure';
export type ModerationResult = { severity: Severity; categories: ModerationCategory[] };

export interface TextModerator {
  check(text: string): Promise<ModerationResult>;
}

// Kept intentionally small and mild here; the production list lives server-side
// (supabase/functions/moderate-text) so it can be updated without an app release.
const RULES: { category: ModerationCategory; severity: Severity; patterns: RegExp[] }[] = [
  { category: 'threat', severity: 'block', patterns: [/\bi(?:'| wi)ll (?:hurt|kill|find) you\b/i, /\bkill yourself\b/i, /\bkys\b/i] },
  { category: 'insult', severity: 'nudge', patterns: [/\b(?:ugly|stupid|idiot|loser|worthless|pathetic|dumb)\b/i, /\bshut up\b/i] },
  { category: 'sexual', severity: 'nudge', patterns: [/\b(?:nudes?|sexy pics?|send pics|hook ?up tonight)\b/i] },
  { category: 'hate', severity: 'block', patterns: [/\bgo back to your country\b/i] },
  { category: 'scam', severity: 'nudge', patterns: [/\b(?:crypto|bitcoin|investment opportunity|gift ?card|wire (?:me|money)|western union)\b/i] },
  { category: 'contact_pressure', severity: 'nudge', patterns: [/\b(?:why (?:aren't|arent) you (?:replying|answering)|answer me)\b/i] },
];

export class KeywordTextModerator implements TextModerator {
  async check(text: string): Promise<ModerationResult> {
    return checkSync(text);
  }
}

export function checkSync(text: string): ModerationResult {
  const categories: ModerationCategory[] = [];
  let severity: Severity = 'none';
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      categories.push(rule.category);
      if (rule.severity === 'block' || (rule.severity === 'nudge' && severity === 'none')) severity = rule.severity;
    }
  }
  return { severity, categories };
}

export const textModerator: TextModerator = new KeywordTextModerator();

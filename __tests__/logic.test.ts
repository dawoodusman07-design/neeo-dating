import { ageFromDob, isEligible } from '@/lib/age';
import { roundDistanceKm } from '@/lib/distance';
import { chatCapState } from '@/lib/chatCap';
import { checkSync } from '@/services/textModeration';
import { formatDuration } from '@/lib/time';
import { phoneSchema, otpSchema } from '@/data/types';
import type { Match } from '@/data/types';
import { seedProfiles } from '@/data/seed';

describe('age gate', () => {
  const now = new Date(Date.UTC(2026, 10, 11));
  it('computes whole years and respects birthdays', () => {
    expect(ageFromDob('2008-11-11', now)).toBe(18);
    expect(ageFromDob('2008-11-12', now)).toBe(17);
  });
  it('blocks under-18 and invalid dates', () => {
    expect(isEligible('2008-11-12', now)).toBe(false);
    expect(isEligible('2008-11-11', now)).toBe(true);
    expect(isEligible('2001-02-30', now)).toBe(false);
    expect(isEligible('not-a-date', now)).toBe(false);
  });
});

describe('distance privacy', () => {
  it('never shows exact or sub-km distances', () => {
    expect(roundDistanceKm(0.2)).toBe(1);
    expect(roundDistanceKm(3.6)).toBe(4);
    expect(roundDistanceKm(17)).toBe(15);
    expect(roundDistanceKm(73)).toBe(70);
  });
});

describe('soft chat cap', () => {
  const mk = (i: number, daysAgo: number): Match => ({
    id: `m${i}`,
    profile: seedProfiles[0]!,
    matchedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    unread: 0,
  });
  it('flags near/at cap and lists quiet chats oldest first', () => {
    const matches = Array.from({ length: 10 }, (_, i) => mk(i, i));
    const s = chatCapState(matches, 10);
    expect(s.atCap).toBe(true);
    expect(s.stale[0]!.id).toBe('m9');
    expect(chatCapState(matches.slice(0, 7), 10).nearCap).toBe(false);
    expect(chatCapState(matches.slice(0, 8), 10).nearCap).toBe(true);
  });
  it('ignores closed chats', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({ ...mk(i, 0), closed: i < 5 }));
    expect(chatCapState(matches, 10).active).toBe(5);
  });
});

describe('harmful-message nudges', () => {
  it('passes kind messages', () => expect(checkSync('Would you like to get coffee on Saturday?').severity).toBe('none'));
  it('nudges insults', () => expect(checkSync('you are so stupid').severity).toBe('nudge'));
  it('nudges money requests', () => expect(checkSync('can you send a gift card').categories).toContain('scam'));
  it('blocks threats', () => expect(checkSync('kill yourself').severity).toBe('block'));
});

describe('validation', () => {
  it('phone numbers must be E.164', () => {
    expect(phoneSchema.safeParse('+14165550100').success).toBe(true);
    expect(phoneSchema.safeParse('4165550100').success).toBe(false);
  });
  it('OTP is 6 digits', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('12345').success).toBe(false);
  });
  it('formats durations', () => expect(formatDuration(24)).toBe('0:24'));
});

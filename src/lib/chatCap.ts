import type { Match } from '@/data/types';

export const DEFAULT_ACTIVE_CHAT_CAP = 10;

export type ChatCapState = { active: number; cap: number; atCap: boolean; nearCap: boolean; stale: Match[] };

/** Soft cap on simultaneous open chats; suggests the quietest chats to close. */
export function chatCapState(matches: Match[], cap = DEFAULT_ACTIVE_CHAT_CAP, now = Date.now()): ChatCapState {
  const open = matches.filter((m) => !m.closed);
  const lastActivity = (m: Match) => new Date(m.lastMessage?.createdAt ?? m.matchedAt).getTime();
  const stale = open
    .filter((m) => now - lastActivity(m) > 7 * 24 * 3600 * 1000)
    .sort((a, b) => lastActivity(a) - lastActivity(b));
  return { active: open.length, cap, atCap: open.length >= cap, nearCap: open.length >= cap - 2, stale };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';

/**
 * On-device only: unsent message drafts ("Resume draft"). Saved profiles, date plans,
 * private notes and preference presets are synced to Supabase (see src/data/api.ts).
 */
type LocalState = {
  drafts: Record<string, string>;
  setDraft: (matchId: string, text: string) => void;
};

export const useLocal = create<LocalState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (matchId, text) => set((s) => ({ drafts: { ...s.drafts, [matchId]: text } })),
    }),
    { name: 'neeo.local', storage: persistStorage, version: 2, migrate: (s) => ({ drafts: (s as { drafts?: Record<string, string> })?.drafts ?? {} }) as LocalState },
  ),
);

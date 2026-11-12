import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import type { DateProposal, Preferences, PreferencePreset, Profile } from '@/data/types';

/**
 * On-device data: saved profiles, saved date plans, private notes, message drafts,
 * preference presets (Plus). Not synced; documented in GAP_REPORT.md / PROGRESS.md.
 */
export type SavedPlan = DateProposal & { id: string; matchId: string; name: string; savedAt: string };

type LocalState = {
  savedProfiles: Record<string, Pick<Profile, 'id' | 'firstName' | 'age' | 'city' | 'photos' | 'verified'> & { savedAt: string }>;
  plans: SavedPlan[];
  notes: Record<string, string>;
  drafts: Record<string, string>;
  presets: PreferencePreset[];
  saveProfile: (p: Profile) => void;
  unsaveProfile: (id: string) => void;
  savePlan: (p: SavedPlan) => void;
  removePlan: (id: string) => void;
  setNote: (profileId: string, text: string) => void;
  setDraft: (matchId: string, text: string) => void;
  addPreset: (name: string, prefs: Preferences) => void;
  removePreset: (id: string) => void;
};

export const useLocal = create<LocalState>()(
  persist(
    (set) => ({
      savedProfiles: {},
      plans: [],
      notes: {},
      drafts: {},
      presets: [],
      saveProfile: (p) =>
        set((s) => ({
          savedProfiles: { ...s.savedProfiles, [p.id]: { id: p.id, firstName: p.firstName, age: p.age, city: p.city, photos: p.photos.slice(0, 1), verified: p.verified, savedAt: new Date().toISOString() } },
        })),
      unsaveProfile: (id) =>
        set((s) => {
          const next = { ...s.savedProfiles };
          delete next[id];
          return { savedProfiles: next };
        }),
      savePlan: (p) => set((s) => ({ plans: [p, ...s.plans.filter((x) => x.id !== p.id)] })),
      removePlan: (id) => set((s) => ({ plans: s.plans.filter((x) => x.id !== id) })),
      setNote: (profileId, text) => set((s) => ({ notes: { ...s.notes, [profileId]: text } })),
      setDraft: (matchId, text) => set((s) => ({ drafts: { ...s.drafts, [matchId]: text } })),
      addPreset: (name, prefs) => set((s) => ({ presets: [...s.presets, { id: `pre_${Date.now()}`, name, prefs }] })),
      removePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: 'neeo.local', storage: persistStorage },
  ),
);

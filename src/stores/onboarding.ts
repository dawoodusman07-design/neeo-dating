import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import type { Intention } from '@/data/types';

export type DraftPhoto = { id: string; uri: string; status: 'uploading' | 'pending' | 'approved' | 'rejected' | 'failed' };
export type DraftPrompt = { question: string; answer: string; voiceUri?: string; voiceDurationSec?: number };

type OnboardingState = {
  dob?: string; // ISO yyyy-mm-dd
  firstName: string;
  pronouns: string;
  intention?: Intention;
  photos: DraftPhoto[];
  prompts: DraftPrompt[];
  dateIdeas: string[];
  city?: string;
  locationGranted?: boolean;
  agreementAccepted: boolean;
  notificationsAsked: boolean;
  verification: 'none' | 'pending' | 'verified' | 'skipped' | 'failed';
  patch: (p: Partial<Omit<OnboardingState, 'patch' | 'reset'>>) => void;
  reset: () => void;
};

const initial = {
  firstName: '',
  pronouns: '',
  photos: [] as DraftPhoto[],
  prompts: [] as DraftPrompt[],
  dateIdeas: [] as string[],
  agreementAccepted: false,
  notificationsAsked: false,
  verification: 'none' as const,
};

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      patch: (p) => set(p),
      reset: () => set(initial),
    }),
    { name: 'neeo.onboarding', storage: persistStorage },
  ),
);

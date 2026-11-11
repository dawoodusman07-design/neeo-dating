import { create } from 'zustand';

export type SessionStatus = 'unknown' | 'signedOut' | 'onboarding' | 'active' | 'paused' | 'underReview';

type SessionState = {
  status: SessionStatus;
  userId: string | null;
  phone: string | null;
  isPlus: boolean;
  setStatus: (s: SessionStatus) => void;
  signIn: (userId: string, phone: string, onboarded: boolean) => void;
  signOut: () => void;
  setPlus: (v: boolean) => void;
};

export const useSession = create<SessionState>()((set) => ({
  status: 'unknown',
  userId: null,
  phone: null,
  isPlus: false,
  setStatus: (status) => set({ status }),
  signIn: (userId, phone, onboarded) => set({ userId, phone, status: onboarded ? 'active' : 'onboarding' }),
  signOut: () => set({ status: 'signedOut', userId: null, phone: null, isPlus: false }),
  setPlus: (isPlus) => set({ isPlus }),
}));

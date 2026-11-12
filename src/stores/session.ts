import { create } from 'zustand';

export type SessionStatus = 'unknown' | 'signedOut' | 'onboarding' | 'active' | 'paused' | 'underReview';

type SessionState = {
  status: SessionStatus;
  userId: string | null;
  phone: string | null;
  isPlus: boolean;
  /** Last successful reauthentication (ms). Sensitive actions require it within 5 minutes. */
  reauthAt: number;
  setReauth: () => void;
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
  reauthAt: 0,
  setReauth: () => set({ reauthAt: Date.now() }),
  setStatus: (status) => set({ status }),
  signIn: (userId, phone, onboarded) => set({ userId, phone, status: onboarded ? 'active' : 'onboarding' }),
  signOut: () => set({ status: 'signedOut', userId: null, phone: null, isPlus: false, reauthAt: 0 }),
  setPlus: (isPlus) => set({ isPlus }),
}));

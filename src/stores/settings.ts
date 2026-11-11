import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';

export type ThemeOverride = 'system' | 'light' | 'dark';
export type Discoverability = 'everyone' | 'liked_only';

export type NotificationPrefs = {
  newIntroductions: boolean;
  likes: boolean;
  matches: boolean;
  messages: boolean;
  safetyCheckins: boolean; // cannot be turned off while a check-in is active
  productNews: boolean;
};

export type SettingsState = {
  themeOverride: ThemeOverride;
  locale: 'en' | 'ur' | 'ar';
  region: string;
  blurPhotos: boolean;
  screenshotProtection: boolean;
  discoverability: Discoverability;
  blockContacts: boolean;
  aiAssist: boolean; // AI profile feedback + conversation starters (opt-in)
  notifications: NotificationPrefs;
  quietHours: { enabled: boolean; start: string; end: string };
  set: <K extends keyof Omit<SettingsState, 'set' | 'setNotification'>>(key: K, value: SettingsState[K]) => void;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
};

export const defaultSettings = {
  themeOverride: 'system' as ThemeOverride,
  locale: 'en' as const,
  region: 'CA',
  blurPhotos: true,
  screenshotProtection: true,
  discoverability: 'everyone' as Discoverability,
  blockContacts: false,
  aiAssist: false,
  notifications: {
    newIntroductions: true,
    likes: true,
    matches: true,
    messages: true,
    safetyCheckins: true,
    productNews: false,
  },
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      setNotification: (key, value) => set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
    }),
    { name: 'neeo.settings', storage: persistStorage, version: 1 },
  ),
);

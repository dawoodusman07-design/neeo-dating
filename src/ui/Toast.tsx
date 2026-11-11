import React, { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type ToastItem = { id: number; message: string; tone: 'info' | 'success' | 'error' };
const useToastStore = create<{ current: ToastItem | null; show: (m: string, tone?: ToastItem['tone']) => void; hide: () => void }>((set) => ({
  current: null,
  show: (message, tone = 'info') => set({ current: { id: Date.now(), message, tone } }),
  hide: () => set({ current: null }),
}));

/** Show a toast; it is always announced to VoiceOver / TalkBack. */
export const toast = (message: string, tone?: ToastItem['tone']) => useToastStore.getState().show(message, tone);

export function ToastHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { current, hide } = useToastStore();
  useEffect(() => {
    if (!current) return;
    AccessibilityInfo.announceForAccessibility(current.message);
    const timer = setTimeout(hide, 3500);
    return () => clearTimeout(timer);
  }, [current, hide]);
  if (!current) return null;
  const icon = current.tone === 'error' ? 'error' : current.tone === 'success' ? 'check' : 'info';
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', start: t.space[4], end: t.space[4], bottom: insets.bottom + 96, alignItems: 'center' }}
    >
      <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center', backgroundColor: t.c.text, borderRadius: t.radius.md, paddingHorizontal: t.space[4], paddingVertical: t.space[3] }}>
        <Icon name={icon} color={t.c.bg} />
        <Text variant="bodyStrong" style={{ color: t.c.bg, flexShrink: 1 }}>
          {current.message}
        </Text>
      </View>
    </View>
  );
}

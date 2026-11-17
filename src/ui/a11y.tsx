import React from 'react';
import { Platform, Text as RNText } from 'react-native';

/**
 * Accessible name for a pressable whose content is text.
 * Native: an explicit label (VoiceOver/TalkBack read it as one phrase).
 * Web: no aria-label, so the name is computed from the visible text and always contains it
 * (WCAG 2.5.3 Label in Name). Put extra spoken-only detail in <SrOnly> on web.
 */
export function contentName(label: string) {
  return Platform.OS === 'web' ? {} : { accessibilityLabel: label };
}

/** Text for screen readers only (web). Native gets the same words through contentName(). */
export function SrOnly({ children }: { children: string }) {
  if (Platform.OS !== 'web') return null;
  return <RNText style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>{children}</RNText>;
}

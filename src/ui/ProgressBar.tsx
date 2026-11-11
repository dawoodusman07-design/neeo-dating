import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';

/** value 0..1. `segments` renders a segmented bar (e.g. photo progress). */
export function ProgressBar({ value, label, segments, tone = 'default' }: { value: number; label: string; segments?: number; tone?: 'default' | 'onPhoto' }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  const track = tone === 'onPhoto' ? t.c.scrim : t.c.tint;
  const fill = tone === 'onPhoto' ? t.c.onPhoto : t.c.action;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: segments ?? 100, now: segments ? Math.round(pct * segments) : Math.round(pct * 100) }}
      style={{ flexDirection: 'row', gap: segments ? 4 : 0 }}
    >
      {segments ? (
        Array.from({ length: segments }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < Math.round(pct * segments) ? fill : track }} />
        ))
      ) : (
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: track, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: fill, borderRadius: 4 }} />
        </View>
      )}
    </View>
  );
}

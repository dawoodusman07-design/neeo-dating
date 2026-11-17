import React, { useEffect, useState } from 'react';
import { Animated, Platform, View, type DimensionValue } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReduceMotion, useTheme } from '@/theme';

/** Placeholder block. Pulses gently unless Reduce Motion is on. */
export function SkeletonBlock({ width = '100%', height = 16, radius }: { width?: DimensionValue; height?: DimensionValue; radius?: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [v] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(v, { toValue: 0.6, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return <Animated.View style={{ width, height, borderRadius: radius ?? t.radius.sm, backgroundColor: t.c.chip, opacity: reduce ? 0.8 : v }} />;
}

/** Loading layout for a screen. Announced once as "Loading" (status changes are spoken, WCAG 4.1.3). */
export function Skeleton({ variant }: { variant: 'card' | 'rows' | 'grid' | 'profile' }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const row = (k: number) => (
    <View key={k} style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
      <SkeletonBlock width={56} height={56} radius={28} />
      <View style={{ flex: 1, gap: t.space[2] }}>
        <SkeletonBlock width="50%" />
        <SkeletonBlock width="80%" height={12} />
      </View>
    </View>
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={tr('a11y.loading')}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
      style={{ padding: t.space[4], gap: t.space[4] }}
      testID="skeleton"
    >
      {variant === 'card' || variant === 'profile' ? (
        <>
          <View style={{ aspectRatio: 4 / 5 }}>
            <SkeletonBlock height="100%" radius={t.radius.lg} />
          </View>
          <SkeletonBlock width="60%" height={22} />
          <SkeletonBlock width="40%" />
          <SkeletonBlock height={96} radius={t.radius.lg} />
        </>
      ) : variant === 'grid' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} style={{ width: '47%', gap: t.space[1] }}>
              <View style={{ aspectRatio: 4 / 5 }}>
                <SkeletonBlock height="100%" radius={t.radius.md} />
              </View>
              <SkeletonBlock width="60%" />
            </View>
          ))}
        </View>
      ) : (
        [0, 1, 2, 3].map(row)
      )}
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string };

/** Accessible number stepper (adjustable role + increment/decrement actions). */
export function Stepper({ label, value, onChange, min, max, step = 1, suffix = '' }: Props) {
  const t = useTheme();
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], minHeight: 44 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: `${value}${suffix}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step)))}
    >
      <Text style={{ flex: 1 }}>{label}</Text>
      <IconButton icon="dash" label={`Decrease ${label}`} variant="surface" size={36} disabled={value <= min} onPress={() => onChange(clamp(value - step))} />
      <Text variant="bodyStrong" style={{ minWidth: 64, textAlign: 'center' }}>{`${value}${suffix}`}</Text>
      <IconButton icon="add" label={`Increase ${label}`} variant="surface" size={36} disabled={value >= max} onPress={() => onChange(clamp(value + step))} />
    </View>
  );
}

import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

type Props<K extends string> = { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void };

export function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  const t = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: t.c.tint, borderRadius: t.radius.pill, padding: 4 }}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, minHeight: 40, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.c.surface : 'transparent' }}
          >
            <Text variant="caption" color={selected ? 'text' : 'textMuted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

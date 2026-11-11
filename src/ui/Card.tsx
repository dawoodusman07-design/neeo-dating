import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme';

export function Card({ style, tone = 'surface', ...rest }: ViewProps & { tone?: 'surface' | 'tint' }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'tint' ? t.c.tint : t.c.surface,
          borderRadius: t.radius.lg,
          borderWidth: tone === 'surface' ? 1 : 0,
          borderColor: t.c.border,
          padding: t.space[4],
          gap: t.space[3],
        },
        style,
      ]}
      {...rest}
    />
  );
}

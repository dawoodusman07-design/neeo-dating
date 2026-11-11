import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '@/theme';

type Props = { value: boolean; onValueChange: (v: boolean) => void; label: string; disabled?: boolean };

/** Native Switch, themed. `label` is spoken by screen readers. */
export function Toggle({ value, onValueChange, label, disabled }: Props) {
  const t = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      trackColor={{ false: t.c.border, true: t.c.action }}
      thumbColor={t.c.surface}
      ios_backgroundColor={t.c.border}
      // react-native-web only (ignored on native)
      {...({ activeThumbColor: t.c.surface } as object)}
    />
  );
}

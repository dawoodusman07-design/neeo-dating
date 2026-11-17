import React from 'react';
import { Platform, Switch, View } from 'react-native';
import { useTheme } from '@/theme';

type Props = { value: boolean; onValueChange: (v: boolean) => void; label: string; disabled?: boolean; testID?: string; /** Row owns the interaction + a11y (whole row is the switch). */ decorative?: boolean };

/** Native Switch, themed. `label` is spoken by screen readers. */
export function Toggle({ value, onValueChange, label, disabled, testID, decorative }: Props) {
  const t = useTheme();
  if (decorative && Platform.OS === 'web') {
    // Visual only: the row is the switch. Same geometry as the web Switch; the knob position + fill carry the state.
    return (
      <View {...({ 'aria-hidden': true } as object)} style={{ width: 40, height: 22, borderRadius: 11, padding: 2, backgroundColor: value ? t.c.action : t.c.textMuted, opacity: disabled ? 0.45 : 1, alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: t.c.surface }} />
      </View>
    );
  }
  return (
    <Switch
      value={value}
      testID={decorative ? undefined : testID}
      pointerEvents={decorative ? 'none' : undefined}
      accessible={!decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : undefined}
      accessibilityElementsHidden={decorative}
      {...(decorative ? ({ 'aria-hidden': true, tabIndex: -1 } as object) : {})}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={label}
      // web: react-native-web renders a native input[role=switch] inside; an outer role would nest controls
      {...(Platform.OS === 'web' ? {} : { accessibilityRole: 'switch' as const, accessibilityState: { checked: value, disabled: !!disabled } })}
      trackColor={{ false: t.c.textMuted, true: t.c.action }}
      thumbColor={t.c.surface}
      ios_backgroundColor={t.c.textMuted}
      // react-native-web only (ignored on native)
      {...({ activeThumbColor: t.c.surface } as object)}
    />
  );
}

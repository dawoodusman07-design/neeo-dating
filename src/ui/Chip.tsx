import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';

type Props = {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'onPhoto';
};

export function Chip({ label, icon, selected, onPress, disabled, tone = 'default' }: Props) {
  const t = useTheme();
  const content = (pressed = false) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[1],
        minHeight: 32,
        paddingHorizontal: t.space[3],
        paddingVertical: t.space[1],
        borderRadius: t.radius.pill,
        backgroundColor: tone === 'onPhoto' ? t.c.scrim : selected ? t.c.action : pressed ? t.c.tint : t.c.chip,
        borderWidth: 1,
        borderColor: selected ? t.c.action : 'transparent',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {selected ? <Icon name="check" size={16} color={t.c.onAction} /> : icon ? <Icon name={icon} size={16} color={tone === 'onPhoto' ? t.c.onPhoto : t.c.brandDeep} /> : null}
      <Text variant="caption" color={tone === 'onPhoto' ? 'onPhoto' : selected ? 'onAction' : 'text'}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={label}>{content()}</View>;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={{ minHeight: 44, justifyContent: 'center' }}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

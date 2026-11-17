import React from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconName } from './icons';

type Props = Omit<PressableProps, 'style'> & {
  icon: IconName;
  /** Required: icon-only buttons must have a spoken label. */
  label: string;
  variant?: 'plain' | 'surface' | 'onPhoto' | 'action';
  size?: number; // visual size; hit area is always >= 44
  iconSize?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, label, variant = 'plain', size = 44, iconSize, selected, disabled, style, ...rest }: Props) {
  const t = useTheme();
  const bg = { plain: 'transparent', surface: t.c.surface, onPhoto: t.c.scrim, action: t.c.action }[variant];
  const fg = { plain: t.c.text, surface: t.c.text, onPhoto: t.c.onPhoto, action: t.c.onAction }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      style={[{ minWidth: t.size.hit, minHeight: t.size.hit, alignItems: 'center', justifyContent: 'center' }, style]}
      {...rest}
    >
      {({ pressed }) => (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: variant === 'surface' ? 1 : 0,
            borderColor: t.c.border, // the icon (text colour, ≥4.5:1) identifies the control
            opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
          }}
        >
          <Icon name={icon} color={fg} size={iconSize ?? Math.round(size * 0.45)} fill={selected && icon === 'save' ? fg : undefined} />
        </View>
      )}
    </Pressable>
  );
}

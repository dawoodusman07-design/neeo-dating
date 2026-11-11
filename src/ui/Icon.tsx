import React from 'react';
import { I18nManager } from 'react-native';
import { useTheme } from '@/theme';
import { DIRECTIONAL, Icons, type IconName } from './icons';

type Props = { name: IconName; size?: number; color?: string; fill?: string };

/** Decorative by default (hidden from screen readers); label the touchable instead. */
export function Icon({ name, size, color, fill }: Props) {
  const t = useTheme();
  const C = Icons[name];
  const mirror = I18nManager.isRTL && DIRECTIONAL.has(name);
  return (
    <C
      size={size ?? t.size.iconRow}
      color={color ?? t.c.text}
      fill={fill ?? 'none'}
      strokeWidth={t.size.iconStroke}
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

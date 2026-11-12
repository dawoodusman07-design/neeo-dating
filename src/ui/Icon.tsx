import React from 'react';
import { I18nManager, Platform } from 'react-native';
import { useTheme } from '@/theme';
import { DIRECTIONAL, Icons, type IconName } from './icons';

type Props = { name: IconName; size?: number; color?: string; fill?: string };

// Icons are decorative: label the touchable instead. Native screen readers use the RN props;
// on web react-native-svg forwards props straight to the DOM, so use aria-hidden there
// (the RN-only props trigger React "unknown prop" errors in development).
const hidden =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as object)
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

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
      {...hidden}
    />
  );
}

import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { Palette } from '@/theme/tokens';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'small';

type Props = TextProps & {
  variant?: TextVariant;
  color?: keyof Palette;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  const t = useTheme();
  const v: Record<TextVariant, TextStyle> = {
    display: { fontFamily: t.font.extrabold, fontSize: t.type['3xl'], lineHeight: t.type['3xl'] * 1.2 },
    title: { fontFamily: t.font.bold, fontSize: t.type['2xl'], lineHeight: t.type['2xl'] * 1.25 },
    heading: { fontFamily: t.font.semibold, fontSize: t.type.xl, lineHeight: t.type.xl * 1.3 },
    body: { fontFamily: t.font.regular, fontSize: t.type.md, lineHeight: t.type.md * 1.45 },
    bodyStrong: { fontFamily: t.font.semibold, fontSize: t.type.md, lineHeight: t.type.md * 1.45 },
    label: { fontFamily: t.font.semibold, fontSize: t.type.lg, lineHeight: t.type.lg * 1.3 },
    caption: { fontFamily: t.font.medium, fontSize: t.type.sm, lineHeight: t.type.sm * 1.4 },
    small: { fontFamily: t.font.regular, fontSize: t.type.xs, lineHeight: t.type.xs * 1.4 },
  };
  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={2}
      accessibilityRole={variant === 'display' || variant === 'title' || variant === 'heading' ? 'header' : undefined}
      style={[v[variant], { color: t.c[color], textAlign: align ?? 'auto', writingDirection: 'auto' }, style]}
      {...rest}
    />
  );
}

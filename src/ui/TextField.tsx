import React, { forwardRef, useState } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** Native autofill names -> valid HTML autocomplete tokens (web only; WCAG 1.3.5). */
const WEB_AUTOCOMPLETE: Record<string, string> = {
  'sms-otp': 'one-time-code',
  oneTimeCode: 'one-time-code',
  birthdate: 'bday',
  'birthdate-full': 'bday',
  'postal-address-locality': 'address-level2',
  addressCity: 'address-level2',
};

type Props = TextInputProps & { label: string; error?: string; hint?: string; trailing?: React.ReactNode };

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(function TextField({ label, error, hint, trailing, style, editable = true, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const { onFocus, onBlur, autoComplete, textContentType, ...inputProps } = rest;
  const web = Platform.OS === 'web';
  const ac = web ? ((autoComplete && WEB_AUTOCOMPLETE[autoComplete]) ?? (textContentType && WEB_AUTOCOMPLETE[textContentType]) ?? autoComplete) : autoComplete;
  return (
    <View style={{ gap: t.space[1] }}>
      <Text variant="caption" color="text">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 52,
          borderRadius: t.radius.md,
          borderWidth: focused || error ? 2 : 1,
          borderColor: error ? t.c.danger : focused ? t.c.focus : t.c.textMuted, // resting boundary ≥3:1 (WCAG 1.4.11)
          backgroundColor: editable ? t.c.surface : t.c.tint,
          paddingHorizontal: t.space[4],
        }}
      >
        <TextInput
          {...inputProps}
          autoComplete={ac as TextInputProps['autoComplete']}
          textContentType={web ? undefined : textContentType}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled: !editable }}
          aria-invalid={!!error}
          editable={editable}
          allowFontScaling
          placeholderTextColor={t.c.textMuted}
          selectionColor={t.c.action}
          // Handlers come after the caller's props so validate-on-blur never swallows the focus ring reset.
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[{ flex: 1, minWidth: 0, color: t.c.text, fontFamily: t.font.regular, fontSize: t.type.lg, paddingVertical: t.space[3], textAlign: 'auto' }, style]}
        />
        {trailing}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Icon name="error" size={16} color={t.c.danger} />
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

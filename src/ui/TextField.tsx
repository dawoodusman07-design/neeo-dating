import React, { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = TextInputProps & { label: string; error?: string; hint?: string; trailing?: React.ReactNode };

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(function TextField({ label, error, hint, trailing, style, editable = true, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
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
          borderColor: error ? t.c.danger : focused ? t.c.focus : t.c.border,
          backgroundColor: editable ? t.c.surface : t.c.tint,
          paddingHorizontal: t.space[4],
        }}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled: !editable }}
          aria-invalid={!!error}
          editable={editable}
          allowFontScaling
          placeholderTextColor={t.c.textMuted}
          selectionColor={t.c.action}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[{ flex: 1, color: t.c.text, fontFamily: t.font.regular, fontSize: t.type.lg, paddingVertical: t.space[3], textAlign: 'auto' }, style]}
          {...rest}
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

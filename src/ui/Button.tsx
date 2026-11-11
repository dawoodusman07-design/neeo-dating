import React from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', icon, loading, disabled, fullWidth = true, style, ...rest }: Props) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      hitSlop={variant === 'text' ? 8 : undefined}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => {
        const bg =
          variant === 'primary'
            ? pressed ? t.c.actionPressed : t.c.action
            : variant === 'danger'
              ? t.c.danger
              : variant === 'secondary'
                ? pressed ? t.c.tint : t.c.surface
                : 'transparent';
        return [
          {
            minHeight: variant === 'text' ? t.size.hit : t.size.buttonPrimary,
            borderRadius: t.radius.pill,
            paddingHorizontal: variant === 'text' ? t.space[2] : t.space[6],
            backgroundColor: bg,
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: t.c.border,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: fullWidth ? 'stretch' : 'center',
            opacity: isDisabled ? 0.45 : variant === 'text' && pressed ? 0.6 : 1,
          } as ViewStyle,
          focused ? { borderWidth: 2, borderColor: t.c.focus } : null,
          style,
        ];
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? t.c.onAction : t.c.action} accessibilityLabel="Loading" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          {icon ? <Icon name={icon} color={variant === 'primary' || variant === 'danger' ? t.c.onAction : t.c.action} /> : null}
          <Text
            variant="label"
            color={variant === 'primary' || variant === 'danger' ? 'onAction' : variant === 'text' ? 'action' : 'text'}
            numberOfLines={2}
            align="center"
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

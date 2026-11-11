import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';
import { Toggle } from './Toggle';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean };
  selected?: boolean; // radio-style row
  destructive?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function ListRow({ title, subtitle, icon, value, onPress, toggle, selected, destructive, disabled, accessibilityHint }: Props) {
  const t = useTheme();
  const body = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
        minHeight: 56,
        paddingHorizontal: t.space[4],
        paddingVertical: t.space[3],
        backgroundColor: pressed ? t.c.tint : t.c.surface,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon ? <Icon name={icon} color={destructive ? t.c.danger : t.c.brandDeep} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" color="textMuted">
          {value}
        </Text>
      ) : null}
      {toggle ? <Toggle label={title} {...toggle} /> : null}
      {selected !== undefined ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? t.c.action : t.c.textMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.c.action }} /> : null}
        </View>
      ) : null}
      {onPress && !toggle && selected === undefined ? <Icon name="chevron" color={t.c.textMuted} /> : null}
    </View>
  );
  if (toggle) {
    // The Switch itself is the accessible control; row text is its label.
    return body(false);
  }
  if (!onPress) return <View accessible>{body(false)}</View>;
  return (
    <Pressable
      accessibilityRole={selected !== undefined ? 'radio' : 'button'}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected, checked: selected }}
      onPress={onPress}
      disabled={disabled}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

export function ListGroup({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: string }) {
  const t = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: t.space[2] }}>
      {title ? (
        <Text variant="caption" color="textMuted" style={{ paddingHorizontal: t.space[1], textTransform: 'uppercase', letterSpacing: 0.5 }} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={{ borderRadius: t.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface }}>
        {items.map((child, i) => (
          <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.c.border } : undefined}>
            {child}
          </View>
        ))}
      </View>
      {footer ? (
        <Text variant="small" color="textMuted" style={{ paddingHorizontal: t.space[1] }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

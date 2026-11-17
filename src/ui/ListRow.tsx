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
  checked?: boolean; // checkbox-style row
  destructive?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export function ListRow({ title, subtitle, icon, value, onPress, toggle, selected, checked, destructive, disabled, accessibilityHint, testID }: Props) {
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
      {toggle ? <Toggle label={title} decorative {...toggle} /> : null}
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
      {checked !== undefined ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: checked ? t.c.action : t.c.textMuted,
            backgroundColor: checked ? t.c.action : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? <Icon name="check" size={14} color={t.c.onAction} /> : null}
        </View>
      ) : null}
      {onPress && !toggle && selected === undefined && checked === undefined ? <Icon name="chevron" color={t.c.textMuted} /> : null}
    </View>
  );
  if (toggle) {
    // The whole row is the switch: a full-width target, one tab stop, label = row title.
    const off = disabled || toggle.disabled;
    return (
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ checked: !!toggle.value, disabled: !!off }}
        aria-checked={!!toggle.value}
        onPress={() => toggle.onValueChange(!toggle.value)}
        disabled={off}
        testID={testID}
      >
        {({ pressed }) => body(pressed)}
      </Pressable>
    );
  }
  if (!onPress) return <View accessible>{body(false)}</View>;
  return (
    <Pressable
      accessibilityRole={checked !== undefined ? 'checkbox' : selected !== undefined ? 'radio' : 'button'}
      // No explicit label: the name is the row's own visible text (title, subtitle, value), so it always matches what is shown (WCAG 2.5.3).
      accessibilityHint={accessibilityHint}
      accessibilityState={selected === undefined && checked === undefined ? { disabled: !!disabled } : { disabled: !!disabled, checked: checked ?? selected }}
      aria-checked={checked ?? selected}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
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

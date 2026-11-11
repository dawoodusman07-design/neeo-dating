import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';
import type { IconName } from './icons';
import { Text } from './Text';

type Props = {
  icon: IconName;
  title: string;
  body: string;
  action?: { title: string; onPress: () => void; loading?: boolean };
  secondary?: { title: string; onPress: () => void };
  tone?: 'neutral' | 'error';
};

/** icon + title + one sentence + primary action. Used by ~40 edge-case screens. */
export function EmptyState({ icon, title, body, action, secondary, tone = 'neutral' }: Props) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.space[6], gap: t.space[4] }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone === 'error' ? t.c.tint : t.c.chip,
        }}
      >
        <Icon name={icon} size={32} color={tone === 'error' ? t.c.danger : t.c.brandDeep} />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" color="textMuted" align="center" style={{ maxWidth: 340 }}>
        {body}
      </Text>
      {action ? <Button title={action.title} onPress={action.onPress} loading={action.loading} style={{ marginTop: t.space[2] }} /> : null}
      {secondary ? <Button title={secondary.title} variant="text" onPress={secondary.onPress} /> : null}
    </View>
  );
}

export function ErrorState(props: Omit<Props, 'tone' | 'icon'> & { icon?: IconName }) {
  return <EmptyState icon={props.icon ?? 'error'} tone="error" {...props} />;
}

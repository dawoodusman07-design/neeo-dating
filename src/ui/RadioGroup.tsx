import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { ListGroup, ListRow } from './ListRow';
import { Text } from './Text';

type Props<K extends string> = {
  label: string;
  options: { key: K; label: string; subtitle?: string }[];
  value?: K;
  onChange: (k: K) => void;
  error?: string;
};

/** Labelled radio group with error text + icon (never colour alone). */
export function RadioGroup<K extends string>({ label, options, value, onChange, error }: Props<K>) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[1] }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <ListGroup title={label}>
        {options.map((o) => (
          <ListRow key={o.key} title={o.label} subtitle={o.subtitle} selected={value === o.key} onPress={() => onChange(o.key)} />
        ))}
      </ListGroup>
      {error ? (
        <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Icon name="error" size={16} color={t.c.danger} />
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

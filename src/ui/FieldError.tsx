import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** Error line used under non-text controls (chips, checkboxes). Icon + text, announced politely. */
export function FieldError({ message }: { message?: string }) {
  const t = useTheme();
  if (!message) return null;
  return (
    <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }} accessibilityLiveRegion="polite">
      <Icon name="error" size={16} color={t.c.danger} />
      <Text variant="caption" color="danger">
        {message}
      </Text>
    </View>
  );
}

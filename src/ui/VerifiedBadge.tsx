import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** Never colour alone: icon + text (or spoken label when compact). */
export function VerifiedBadge({ compact, onPhoto }: { compact?: boolean; onPhoto?: boolean }) {
  const t = useTheme();
  const color = onPhoto ? t.c.onPhoto : t.c.brandDeep;
  return (
    <View accessible accessibilityLabel="Photo verified" style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Icon name="verified" size={compact ? 18 : 16} color={color} />
      {compact ? null : (
        <Text variant="small" style={{ color, fontFamily: t.font.semibold }}>
          Verified
        </Text>
      )}
    </View>
  );
}

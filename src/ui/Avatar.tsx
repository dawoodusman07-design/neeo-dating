import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { Text } from './Text';

export function Avatar({ uri, name, size = 40, blurred }: { uri?: string; name: string; size?: number; blurred?: boolean }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name}'s photo`}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} blurRadius={blurred ? 20 : 0} contentFit="cover" />
      ) : (
        <Text variant="bodyStrong" color="brandDeep">
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  uri: string;
  /** Required alt text, e.g. "Photo 1 of 3 of Maya" */
  label: string;
  blurred?: boolean;
  pending?: boolean;
  aspectRatio?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode; // overlays (scrim, chips)
};

/**
 * Photo with optional privacy blur. In production, blurred photos are served
 * from a server-generated blurred variant (see supabase storage policy), so
 * the clear image never reaches devices that are not allowed to see it.
 */
export function ProfilePhoto({ uri, label, blurred, pending, aspectRatio = 4 / 5, radius, style, children }: Props) {
  const t = useTheme();
  return (
    <View
      style={[{ aspectRatio, borderRadius: radius ?? t.radius.lg, overflow: 'hidden', backgroundColor: t.c.tint }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={blurred ? `${label}, blurred for privacy` : pending ? `${label}, waiting for review` : label}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        blurRadius={blurred ? 40 : 0}
        transition={150}
        accessibilityIgnoresInvertColors
      />
      {blurred ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: t.space[2] }}>
          <View style={{ backgroundColor: t.c.scrim, borderRadius: t.radius.pill, padding: t.space[3] }}>
            <Icon name="photoPrivacy" color={t.c.onPhoto} size={22} />
          </View>
        </View>
      ) : null}
      {pending ? (
        <View style={{ position: 'absolute', start: t.space[2], top: t.space[2], flexDirection: 'row', gap: t.space[1], backgroundColor: t.c.scrim, borderRadius: t.radius.pill, paddingHorizontal: t.space[2], paddingVertical: 2, alignItems: 'center' }}>
          <Icon name="time" size={14} color={t.c.onPhoto} />
          <Text variant="small" color="onPhoto">In review</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

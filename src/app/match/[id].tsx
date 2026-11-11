import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useReduceMotion } from '@/theme';
import { Avatar, Button, Icon, Text } from '@/ui';
import { useMatch, useMe } from '@/data/hooks';

export default function MatchCelebration() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useMatch(id);
  const me = useMe();
  const reduce = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(0.85));
  const name = match.data?.profile.firstName ?? '';

  useEffect(() => {
    if (!match.data) return;
    AccessibilityInfo.announceForAccessibility(`${tr('match.title')}. ${tr('match.body', { name })}`);
    if (reduce) scale.setValue(1);
    else Animated.timing(scale, { toValue: 1, duration: t.motion.matchScaleIn, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [match.data, reduce, scale, t.motion.matchScaleIn, tr, name]);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + t.space[4], paddingHorizontal: t.space[6], justifyContent: 'center', gap: t.space[6] }}>
      <Animated.View style={{ alignItems: 'center', gap: t.space[4], transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar uri={me.data?.photos[0]?.uri} name={me.data?.firstName ?? 'You'} size={104} />
          <View style={{ marginHorizontal: -t.space[3], zIndex: 1, backgroundColor: t.c.action, borderRadius: 24, padding: t.space[3] }}>
            <Icon name="likes" color={t.c.onAction} fill={t.c.onAction} size={22} />
          </View>
          <Avatar uri={match.data?.profile.photos[0]?.uri} name={name || '?'} size={104} />
        </View>
        <Text variant="display" align="center">
          {tr('match.title')}
        </Text>
        <Text color="textMuted" align="center">
          {tr('match.body', { name })}
        </Text>
      </Animated.View>
      <View style={{ gap: t.space[2] }}>
        <Button title={tr('match.send')} icon="chats" onPress={() => router.replace({ pathname: '/chat/[id]', params: { id } })} testID="match-send" />
        <Button title={tr('match.later')} variant="text" onPress={() => router.back()} />
      </View>
    </View>
  );
}

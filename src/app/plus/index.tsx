import React from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, Screen, Text, type IconName } from '@/ui';
import { isPlusActive } from '@/services/purchases';
import { useMembership } from '@/features/membership/useMembership';

/** Package 30 — Neeo Plus intro. Members are sent to their membership screen instead. */
export default function PlusIntro() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const membership = useMembership();
  if (membership.data && (isPlusActive(membership.data.status) || membership.data.status === 'pending')) return <Redirect href="/membership" />;
  const free: [IconName, string][] = [
    ['discover', tr('plus.f1')],
    ['chats', tr('chats.title')],
    ['photoPrivacy', tr('plus.f2')],
  ];
  return (
    <Screen close={() => router.back()} footer={<Button title={tr('plus.compare')} onPress={() => router.push('/plus/compare')} testID="plus-compare" />}>
      <View style={{ alignItems: 'center', gap: t.space[2], paddingTop: t.space[2] }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={30} color={t.c.brandDeep} />
        </View>
        <Text variant="caption" color="brandDeep">{tr('plus.title')}</Text>
        <Text variant="title" align="center">{tr('plus.headline')}</Text>
        <Text color="textMuted" align="center">{tr('plus.sub')}</Text>
      </View>
      <Card>
        <Text variant="caption" color="textMuted">{tr('plus.free')}</Text>
        {free.map(([icon, label]) => (
          <View key={label} style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
            <Icon name={icon} color={t.c.brandDeep} />
            <Text style={{ flex: 1 }}>{label}</Text>
            <Icon name="check" color={t.c.success} />
          </View>
        ))}
      </Card>
      <Text variant="caption" color="textMuted" align="center">{tr('plus.compareBody')}</Text>
    </Screen>
  );
}

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Chip, Icon, ListGroup, ListRow, ProgressBar, Text, VerifiedBadge, type IconName } from '@/ui';
import { DATA_MODE, type MyProfile } from '@/data';
import { useMe } from '@/data/hooks';
import { aiAssist } from '@/services/aiAssist';
import { useSettings } from '@/stores/settings';
import { useMembership } from '@/features/membership/useMembership';
import { isPlusActive } from '@/services/purchases';

function nextBestAction(me: MyProfile): string | null {
  if (me.photos.length < 4) return 'nb_photos';
  if (!me.prompts.some((p) => p.voice)) return 'nb_voice';
  if (!me.verified) return 'nb_verify';
  if (!me.dateIdeas.length) return 'nb_ideas';
  if (me.basics.length < 3) return 'nb_basics';
  return null;
}

/** Core screen "Your space" (you.svg). */
export default function You() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const membership = useMembership();
  const { aiAssist: aiOn, blurPhotos, quietHours } = useSettings();
  const aiTips = useQuery({ queryKey: ['aiTips', me.data?.completeness], queryFn: () => aiAssist.profileFeedback(me.data!), enabled: aiOn && !!me.data });
  const tips = aiOn ? (aiTips.data ?? []) : [];
  const m = me.data;
  const nb = m ? nextBestAction(m) : null;
  const go = (path: string) => () => router.push(path as never);
  const tile = (icon: IconName, title: string, sub: string, path: string) => (
    <Pressable onPress={go(path)} accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`} style={({ pressed }) => ({ flex: 1, minHeight: 104, padding: t.space[4], gap: t.space[1], borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.border, backgroundColor: pressed ? t.c.tint : t.c.surface })}>
      <Icon name={icon} size={24} color={t.c.brandDeep} />
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="textMuted">{sub}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.c.bg }} contentContainerStyle={{ paddingTop: insets.top + t.space[3], padding: t.space[4], gap: t.space[5], paddingBottom: t.space[12] }}>
      <Text variant="title">{tr('you.title')}</Text>
      <View style={{ flexDirection: 'row', gap: t.space[4], alignItems: 'center' }}>
        <Avatar uri={m?.photos[0]?.uri} name={m?.firstName ?? ' '} size={84} />
        <View style={{ flex: 1, gap: t.space[1] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
            <Text variant="heading">{m ? `${m.firstName}, ${m.age}` : ''}</Text>
            {m?.verified ? <VerifiedBadge compact /> : null}
          </View>
          <Text variant="caption" color="textMuted">{[m?.city, m?.pronouns].filter(Boolean).join(' · ')}</Text>
          {blurPhotos ? (
            <View style={{ flexDirection: 'row' }}>
              <Chip label={tr('you.privatePhotosOn')} icon="photoPrivacy" />
            </View>
          ) : null}
        </View>
      </View>
      <Button title={tr('you.edit')} variant="secondary" onPress={go('/settings/edit-profile')} testID="edit-profile" />
      {m ? (
        <Card>
          <Text variant="bodyStrong">{tr('you.completeness', { pct: Math.round(m.completeness * 100) })}</Text>
          <ProgressBar value={m.completeness} label={tr('a11y.completeness')} />
          {nb ? <Button title={tr('you.nextBest', { action: tr(`you.${nb}`) })} variant="text" fullWidth={false} style={{ alignSelf: 'flex-start' }} onPress={nb === 'nb_verify' ? go('/verify') : nb === 'nb_photos' ? go('/settings/photos') : go('/settings/edit-profile')} /> : null}
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', gap: t.space[3] }}>
        {tile('photoPrivacy', tr('you.privacyTile'), tr('you.privacyTileSub'), '/settings/photo-privacy')}
        {tile('safety', tr('you.safetyTile'), tr('you.safetyTileSub'), '/settings/safety')}
      </View>
      {tips.length ? (
        <Card tone="tint">
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="tip" color={t.c.brandDeep} />
            <Text variant="caption" color="brandDeep">{`${tr('common.aiLabel')} · ${tr('you.aiTips')}`}</Text>
          </View>
          {tips.map((tip) => (
            <Text key={tip}>{tip}</Text>
          ))}
        </Card>
      ) : null}
      <ListGroup>
        <ListRow icon="preferences" title={tr('you.preferences')} subtitle={tr('you.preferencesSub')} onPress={go('/settings/preferences')} />
        <ListRow icon="notifications" title={tr('you.notifications')} subtitle={quietHours.enabled ? tr('you.notificationsSub', { start: quietHours.start, end: quietHours.end }) : tr('you.notificationsSubOff')} onPress={go('/settings/notifications')} />
        <ListRow icon="save" title={tr('you.saved')} subtitle={tr('you.savedSub')} onPress={go('/saved')} />
        <ListRow icon="more" title={tr('you.settings')} subtitle={tr('you.settingsSub')} onPress={go('/settings/account')} />
        <ListRow icon="plus" title={tr('you.plus')} subtitle={tr('you.plusSub')} value={membership.data && isPlusActive(membership.data.status) ? tr('common.plusBadge') : undefined} onPress={go(membership.data && membership.data.status !== 'free' ? '/membership' : '/plus')} />
      </ListGroup>
      {!m?.verified ? <Button title={tr('you.getVerified')} icon="verified" variant="text" onPress={go('/verify')} /> : null}
      {__DEV__ || DATA_MODE === 'mock' ? <Button title="Developer menu" variant="text" onPress={go('/dev')} testID="dev-menu" /> : null}
    </ScrollView>
  );
}

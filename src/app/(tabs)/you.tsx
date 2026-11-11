import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Icon, ListGroup, ListRow, ProgressBar, Text, VerifiedBadge } from '@/ui';
import { api, type MyProfile } from '@/data';
import { useMe } from '@/data/hooks';
import { aiAssist } from '@/services/aiAssist';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';

function nextBestAction(me: MyProfile): string | null {
  if (me.photos.length < 4) return 'nb_photos';
  if (!me.prompts.some((p) => p.voice)) return 'nb_voice';
  if (!me.verified) return 'nb_verify';
  if (!me.dateIdeas.length) return 'nb_ideas';
  if (me.basics.length < 3) return 'nb_basics';
  return null;
}

export default function You() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const me = useMe();
  const { isPlus, signOut } = useSession();
  const { themeOverride, aiAssist: aiOn } = useSettings();
  const aiTips = useQuery({
    queryKey: ['aiTips', me.data?.completeness],
    queryFn: () => aiAssist.profileFeedback(me.data!),
    enabled: aiOn && !!me.data,
  });
  const tips = aiOn ? (aiTips.data ?? []) : [];

  const m = me.data;
  const nb = m ? nextBestAction(m) : null;
  const go = (path: string) => () => router.push(path as never);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.c.bg }} contentContainerStyle={{ paddingTop: insets.top + t.space[4], padding: t.space[4], gap: t.space[6], paddingBottom: t.space[12] }}>
      <View style={{ alignItems: 'center', gap: t.space[3] }}>
        <Avatar uri={m?.photos[0]?.uri} name={m?.firstName ?? ' '} size={96} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <Text variant="title">{m?.firstName}</Text>
          {m?.verified ? <VerifiedBadge /> : null}
        </View>
        {m ? (
          <Card style={{ alignSelf: 'stretch' }}>
            <Text variant="bodyStrong">{tr('you.completeness', { pct: Math.round(m.completeness * 100) })}</Text>
            <ProgressBar value={m.completeness} label={tr('a11y.completeness')} />
            {nb ? (
              <Button
                title={tr('you.nextBest', { action: tr(`you.${nb}`) })}
                variant="text"
                fullWidth={false}
                style={{ alignSelf: 'flex-start' }}
                onPress={nb === 'nb_verify' ? go('/verify') : go('/settings/edit-profile')}
              />
            ) : null}
          </Card>
        ) : null}
        <Button title={tr('you.edit')} variant="secondary" onPress={go('/settings/edit-profile')} testID="edit-profile" />
      </View>

      {tips.length ? (
        <Card tone="tint">
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="tip" color={t.c.brandDeep} />
            <Text variant="caption" color="brandDeep">
              {tr('common.aiLabel')} · {tr('you.aiTips')}
            </Text>
          </View>
          {tips.map((tip) => (
            <Text key={tip}>{tip}</Text>
          ))}
        </Card>
      ) : null}

      <ListGroup title={tr('you.privacySafety')}>
        <ListRow icon="photoPrivacy" title={tr('you.photoPrivacy')} onPress={go('/settings/photo-privacy')} />
        <ListRow icon="safety" title={tr('you.safetyCentre')} onPress={go('/settings/safety')} />
        <ListRow icon="block" title={tr('you.blocked')} onPress={go('/settings/blocked')} />
        <ListRow icon="blockContacts" title={tr('you.blockContacts')} onPress={go('/settings/block-contacts')} />
        {!m?.verified ? <ListRow icon="verified" title={tr('you.getVerified')} onPress={go('/verify')} /> : null}
      </ListGroup>

      <ListGroup title={tr('you.account')}>
        <ListRow icon="preferences" title={tr('you.preferences')} onPress={go('/settings/preferences')} />
        <ListRow icon="notifications" title={tr('you.notifications')} onPress={go('/settings/notifications')} />
        <ListRow icon="quietHours" title={tr('you.quietHours')} onPress={go('/settings/quiet-hours')} />
        <ListRow icon="region" title={tr('you.region')} onPress={go('/settings/region')} />
        <ListRow icon="plus" title={tr('you.plus')} value={isPlus ? tr('plus.youHavePlus') : undefined} onPress={go('/plus')} />
        <ListRow
          icon="show"
          title={tr('you.appearance')}
          value={tr(themeOverride === 'system' ? 'settings.appearanceSystem' : themeOverride === 'dark' ? 'settings.appearanceDark' : 'settings.appearanceLight')}
          onPress={go('/settings/appearance')}
        />
      </ListGroup>

      <ListGroup title={tr('you.help')}>
        <ListRow icon="help" title={tr('you.helpPolicies')} onPress={go('/settings/help')} />
        <ListRow icon="pauseProfile" title={tr('you.pause')} onPress={go('/settings/pause')} />
        <ListRow icon="export" title={tr('you.export')} onPress={go('/settings/export')} />
        <ListRow icon="delete" title={tr('you.delete')} destructive onPress={go('/settings/delete-account')} />
      </ListGroup>

      <Button
        title={tr('you.signOut')}
        variant="text"
        icon="signOut"
        onPress={async () => {
          await api.auth.signOut();
          qc.clear();
          signOut();
        }}
      />
      {__DEV__ ? <Button title="Developer menu" variant="text" onPress={go('/dev')} /> : null}
    </ScrollView>
  );
}

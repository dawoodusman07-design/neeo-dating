import React from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Icon, ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { api } from '@/data';
import { qk, usePhotoRequests } from '@/data/hooks';
import { useSettings } from '@/stores/settings';

/** Core screen "Privacy & visibility" (privacy.svg) + package 23 "Photo access". Changes apply immediately. */
export default function PhotoPrivacy() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const s = useSettings();
  const requests = usePhotoRequests();
  const incoming = (requests.data ?? []).filter((r) => r.status === 'pending');
  const granted = (requests.data ?? []).filter((r) => r.status === 'shared');
  const refresh = () => qc.invalidateQueries({ queryKey: qk.photoRequests });

  return (
    <Screen title={tr('privacy.title')} back>
      <View style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="photoPrivacy" size={26} color={t.c.brandDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="title">{tr('privacy.hero')}</Text>
          <Text color="textMuted">{tr('privacy.heroSub')}</Text>
        </View>
      </View>
      <ListGroup footer={tr('privacy.blurSub')}>
        <ListRow icon="photoPrivacy" title={tr('privacy.blur')} toggle={{ value: s.blurPhotos, onValueChange: (v) => s.set('blurPhotos', v) }} testID="privacy-blur" />
      </ListGroup>
      <ListGroup footer={tr('privacy.incognitoSub')}>
        <ListRow icon="hide" title={tr('privacy.incognito')} toggle={{ value: s.discoverability === 'liked_only', onValueChange: (v) => s.set('discoverability', v ? 'liked_only' : 'everyone') }} testID="privacy-incognito" />
      </ListGroup>
      <ListGroup footer={Platform.OS === 'ios' ? tr('privacy.screenshotSubIos') : tr('privacy.screenshotSubAndroid')}>
        <ListRow icon="hide" title={tr('privacy.screenshot')} toggle={{ value: s.screenshotProtection, onValueChange: (v) => s.set('screenshotProtection', v) }} />
      </ListGroup>

      <Text variant="heading">{tr('privacy.accessTitle')}</Text>
      <ListGroup title={tr('privacy.requests')}>
        {incoming.length === 0 ? (
          <Text color="textMuted" style={{ padding: t.space[4] }}>{tr('privacy.noRequests')}</Text>
        ) : (
          incoming.map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4], flexWrap: 'wrap' }}>
              <Avatar uri={r.profile.photos[0]?.uri} name={r.profile.firstName} size={44} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>{r.profile.firstName}</Text>
              <Button title={tr('privacy.share')} fullWidth={false} accessibilityLabel={`${tr('privacy.share')} — ${r.profile.firstName}`} onPress={async () => { await api.privacy.respond(r.id, 'shared'); refresh(); toast(tr('privacy.shared', { name: r.profile.firstName }), 'success'); }} />
              <Button title={tr('privacy.decline')} variant="text" fullWidth={false} accessibilityLabel={`${tr('privacy.decline')} — ${r.profile.firstName}`} onPress={async () => { await api.privacy.respond(r.id, 'declined'); refresh(); }} />
            </View>
          ))
        )}
      </ListGroup>
      <ListGroup title={tr('privacy.access')} footer={tr('privacy.accessBody')}>
        {granted.length === 0 ? <Text color="textMuted" style={{ padding: t.space[4] }}>—</Text> : null}
        {granted.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4] }}>
            <Avatar uri={r.profile.photos[0]?.uri} name={r.profile.firstName} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{r.profile.firstName}</Text>
              <Text variant="caption" color="textMuted">{tr('privacy.granted')}</Text>
            </View>
            <Button
              title={tr('privacy.revoke')}
              variant="secondary"
              fullWidth={false}
              accessibilityLabel={`${tr('privacy.revoke')} ${r.profile.firstName}`}
              onPress={async () => {
                await api.privacy.revoke(r.id);
                refresh();
                router.push({ pathname: '/state/[kind]', params: { kind: 'access-revoked', name: r.profile.firstName } });
              }}
            />
          </View>
        ))}
      </ListGroup>
      <ListGroup>
        <ListRow icon="block" title={tr('privacy.blockedRow')} subtitle={tr('privacy.blockedRowSub')} onPress={() => router.push('/settings/blocked')} />
        <ListRow icon="info" title={tr('info.photo-privacy.title')} onPress={() => router.push('/info/photo-privacy')} />
      </ListGroup>
      <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="safety" color={t.c.brandDeep} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{tr('privacy.noScore')}</Text>
          <Text variant="caption" color="textMuted">{tr('privacy.noScoreSub')}</Text>
        </View>
      </Card>
    </Screen>
  );
}

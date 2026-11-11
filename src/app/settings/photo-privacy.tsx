import React from 'react';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { api } from '@/data';
import { qk, usePhotoRequests } from '@/data/hooks';
import { useSettings } from '@/stores/settings';

export default function PhotoPrivacy() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const s = useSettings();
  const requests = usePhotoRequests();
  const incoming = (requests.data ?? []).filter((r) => r.status === 'pending');
  const granted = (requests.data ?? []).filter((r) => r.status === 'shared');
  const refresh = () => qc.invalidateQueries({ queryKey: qk.photoRequests });

  return (
    <Screen title={tr('privacy.title')} back>
      <ListGroup footer={tr('privacy.blurSub')}>
        <ListRow icon="photoPrivacy" title={tr('privacy.blur')} toggle={{ value: s.blurPhotos, onValueChange: (v) => s.set('blurPhotos', v) }} />
      </ListGroup>
      <ListGroup footer={Platform.OS === 'ios' ? tr('privacy.screenshotSubIos') : tr('privacy.screenshotSubAndroid')}>
        <ListRow icon="hide" title={tr('privacy.screenshot')} toggle={{ value: s.screenshotProtection, onValueChange: (v) => s.set('screenshotProtection', v) }} />
      </ListGroup>
      <ListGroup title={tr('privacy.whoCanFind')}>
        <ListRow title={tr('privacy.everyone')} selected={s.discoverability === 'everyone'} onPress={() => s.set('discoverability', 'everyone')} />
        <ListRow title={tr('privacy.likedOnly')} selected={s.discoverability === 'liked_only'} onPress={() => s.set('discoverability', 'liked_only')} />
      </ListGroup>
      <ListGroup title={tr('privacy.requests')}>
        {incoming.length === 0 ? (
          <Text color="textMuted" style={{ padding: t.space[4] }}>{tr('privacy.noRequests')}</Text>
        ) : (
          incoming.map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4] }}>
              <Avatar uri={r.profile.photos[0]?.uri} name={r.profile.firstName} size={44} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>{r.profile.firstName}</Text>
              <Button title={tr('privacy.share')} fullWidth={false} onPress={async () => { await api.privacy.respond(r.id, 'shared'); refresh(); toast(tr('privacy.shared', { name: r.profile.firstName }), 'success'); }} />
              <Button title={tr('privacy.decline')} variant="text" fullWidth={false} onPress={async () => { await api.privacy.respond(r.id, 'declined'); refresh(); }} />
            </View>
          ))
        )}
      </ListGroup>
      <ListGroup title={tr('privacy.access')}>
        {granted.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4] }}>
            <Avatar uri={r.profile.photos[0]?.uri} name={r.profile.firstName} size={44} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>{r.profile.firstName}</Text>
            <Button title={tr('privacy.revoke')} variant="secondary" fullWidth={false} accessibilityLabel={`${tr('privacy.revoke')} ${r.profile.firstName}`} onPress={async () => { await api.privacy.revoke(r.id); refresh(); toast(tr('privacy.revoked')); }} />
          </View>
        ))}
      </ListGroup>
    </Screen>
  );
}

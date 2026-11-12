import React, { useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Icon, IconButton, ProfilePhoto, Screen, Text, toast } from '@/ui';
import { api, type Photo } from '@/data';
import { useMe } from '@/data/hooks';

const MIN = 3;
const MAX = 6;

/** Photo moderation + photo order (from name only). Status per photo, reorder, add, remove. */
export default function Photos() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const photos = me.data?.photos ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['me'] });

  const move = async (i: number, d: -1 | 1) => {
    const ids = photos.map((p) => p.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    await api.me.reorderPhotos(ids);
    refresh();
  };
  const add = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8 });
    if (r.canceled || !r.assets[0]) return;
    setBusy(true);
    try {
      await api.me.uploadPhoto(r.assets[0].uri);
      refresh();
    } catch {
      router.push({ pathname: '/state/[kind]', params: { kind: 'upload-failed' } });
    } finally {
      setBusy(false);
    }
  };
  const remove = async (p: Photo) => {
    if (photos.length <= MIN) return toast(tr('settings.photoMin'), 'error');
    await api.me.removePhoto(p.id);
    refresh();
  };
  const status = (p: Photo) =>
    p.status === 'approved' ? { icon: 'check' as const, color: t.c.success, text: tr('settings.photoApproved') } : p.status === 'pending' ? { icon: 'time' as const, color: t.c.textMuted, text: tr('settings.photoInReview') } : { icon: 'error' as const, color: t.c.danger, text: tr('settings.photoRejected') };

  return (
    <Screen title={tr('settings.photosTitle')} back footer={photos.length < MAX ? <Button title={tr('onboarding.photosAdd')} icon="addPhoto" onPress={add} loading={busy} variant="secondary" /> : undefined}>
      <Text color="textMuted">{tr('settings.photosBody')}</Text>
      {photos.map((p, i) => {
        const s = status(p);
        return (
          <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 72 }}>
              <ProfilePhoto uri={p.uri} label={`Photo ${i + 1}`} radius={t.radius.sm} />
            </View>
            <View style={{ flex: 1, gap: t.space[1] }}>
              <Text variant="bodyStrong">{i === 0 ? `${tr('common.of', { n: 1, total: photos.length })} · Main` : tr('common.of', { n: i + 1, total: photos.length })}</Text>
              <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }}>
                <Icon name={s.icon} size={16} color={s.color} />
                <Text variant="caption" style={{ flex: 1, color: s.color }}>{s.text}</Text>
              </View>
            </View>
            <View>
              <IconButton icon="back" label={`${tr('onboarding.moveEarlier')}, photo ${i + 1}`} disabled={i === 0} onPress={() => move(i, -1)} size={36} style={{ transform: [{ rotate: '90deg' }] }} />
              <IconButton icon="chevron" label={`${tr('onboarding.moveLater')}, photo ${i + 1}`} disabled={i === photos.length - 1} onPress={() => move(i, 1)} size={36} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <IconButton icon="delete" label={`${tr('onboarding.removePhoto')} ${i + 1}`} onPress={() => remove(p)} size={36} />
          </Card>
        );
      })}
    </Screen>
  );
}

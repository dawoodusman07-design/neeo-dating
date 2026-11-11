import React from 'react';
import { Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Icon, IconButton, ProfilePhoto, Text } from '@/ui';
import { api } from '@/data';
import { uid } from '@/lib/id';
import { useOnboarding, type DraftPhoto } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const MAX = 6;
const MIN = 3;

export default function Photos() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { photos, patch } = useOnboarding();

  const setPhotos = (fn: (p: DraftPhoto[]) => DraftPhoto[]) => patch({ photos: fn(useOnboarding.getState().photos) });

  const upload = async (photo: DraftPhoto) => {
    setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, status: 'uploading' } : p)));
    try {
      const r = await api.me.uploadPhoto(photo.uri);
      setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, status: r.status } : p)));
    } catch {
      setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, status: 'failed' } : p)));
    }
  };

  const add = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const photo: DraftPhoto = { id: uid('ph'), uri: res.assets[0].uri, status: 'uploading' };
    setPhotos((ps) => [...ps, photo]);
    upload(photo);
  };

  const move = (i: number, dir: -1 | 1) =>
    setPhotos((ps) => {
      const next = [...ps];
      const j = i + dir;
      if (j < 0 || j >= next.length) return ps;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const usable = photos.filter((p) => p.status === 'pending' || p.status === 'approved').length;

  return (
    <OnboardingStep
      step="photos"
      title={tr('onboarding.photosTitle')}
      body={tr('onboarding.photosBody')}
      footer={<Button title={tr('common.continue')} onPress={() => router.push(nextStep('photos'))} disabled={usable < MIN} testID="photos-continue" />}
    >
      <Text variant="caption" color="textMuted" accessibilityLiveRegion="polite">
        {tr('onboarding.photosCount', { count: photos.length })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
        {photos.map((p, i) => (
          <View key={p.id} style={{ width: '47%', gap: t.space[1] }}>
            <Pressable disabled={p.status !== 'failed'} onPress={() => upload(p)} accessibilityRole={p.status === 'failed' ? 'button' : undefined} accessibilityLabel={p.status === 'failed' ? tr('onboarding.photoFailed') : undefined}>
              <ProfilePhoto uri={p.uri} label={`Photo ${i + 1}`} pending={p.status === 'pending' || p.status === 'uploading'} radius={t.radius.md} />
            </Pressable>
            {p.status === 'failed' || p.status === 'rejected' ? (
              <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }}>
                <Icon name={p.status === 'failed' ? 'uploadFailed' : 'error'} size={16} color={t.c.danger} />
                <Text variant="small" color="danger" style={{ flex: 1 }}>
                  {tr(p.status === 'failed' ? 'onboarding.photoFailed' : 'onboarding.photoRejected')}
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <IconButton icon="back" label={`${tr('onboarding.moveEarlier')}, photo ${i + 1}`} disabled={i === 0} onPress={() => move(i, -1)} size={36} />
              <IconButton icon="delete" label={`${tr('onboarding.removePhoto')} ${i + 1}`} onPress={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} size={36} />
              <IconButton icon="chevron" label={`${tr('onboarding.moveLater')}, photo ${i + 1}`} disabled={i === photos.length - 1} onPress={() => move(i, 1)} size={36} />
            </View>
          </View>
        ))}
        {photos.length < MAX ? (
          <Pressable
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel={tr('onboarding.photosAdd')}
            testID="add-photo"
            style={({ pressed }) => ({
              width: '47%',
              aspectRatio: 4 / 5,
              borderRadius: t.radius.md,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: t.c.border,
              backgroundColor: pressed ? t.c.tint : t.c.surface,
              alignItems: 'center',
              justifyContent: 'center',
              gap: t.space[2],
            })}
          >
            <Icon name="addPhoto" size={28} color={t.c.action} />
            <Text variant="caption" color="action">
              {tr('onboarding.photosAdd')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text variant="small" color="textMuted">
        {tr('onboarding.photosReorderHint')}
      </Text>
    </OnboardingStep>
  );
}

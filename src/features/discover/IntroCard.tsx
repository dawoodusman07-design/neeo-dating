import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Chip, IconButton, ProfilePhoto, ProgressBar } from '@/ui';
import type { Profile } from '@/data';
import { NameLine } from '@/features/profile/ProfileView';

type Props = {
  profile: Profile;
  saved: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onSave: () => void;
  onPhotoChange?: (photoId: string) => void;
};

/** Hero card: tap left/right half to move between photos (also exposed as accessibility actions). */
export function IntroCard({ profile, saved, canUndo, onUndo, onSave, onPhotoChange }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [index, setIndex] = useState(0);
  const total = profile.photos.length;
  const photo = profile.photos[index];
  const go = (d: number) => {
    const next = Math.max(0, Math.min(total - 1, index + d));
    setIndex(next);
    const p = profile.photos[next];
    if (p) onPhotoChange?.(p.id);
  };
  if (!photo) return null;
  return (
    <ProfilePhoto uri={photo.uri} blurred={photo.blurred} label={tr('discover.photoOf', { n: index + 1, total, name: profile.firstName })}>
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => go(-1)}
          accessibilityRole="adjustable"
          accessibilityLabel={tr('a11y.photoProgress', { n: index + 1, total })}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => go(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        />
        <Pressable style={{ flex: 1 }} onPress={() => go(1)} importantForAccessibility="no" accessibilityElementsHidden />
      </View>
      <View style={{ position: 'absolute', top: t.space[2], start: t.space[3], end: t.space[3], gap: t.space[2] }} pointerEvents="box-none">
        <ProgressBar segments={total} value={(index + 1) / total} label={tr('a11y.photoProgress', { n: index + 1, total })} tone="onPhoto" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} pointerEvents="box-none">
          <Chip label={tr(`intention.${profile.intention}`)} icon="likes" tone="onPhoto" />
          <View style={{ flexDirection: 'row', gap: t.space[2] }}>
            <IconButton icon="undo" label={tr('discover.undo')} variant="onPhoto" size={40} disabled={!canUndo} onPress={onUndo} />
            <IconButton icon="save" label={saved ? tr('discover.saved') : tr('discover.save')} variant="onPhoto" size={40} selected={saved} onPress={onSave} />
          </View>
        </View>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', start: 0, end: 0, bottom: 0, backgroundColor: t.c.scrim, paddingHorizontal: t.space[4], paddingTop: t.space[3], paddingBottom: t.space[4] }}>
        <NameLine profile={profile} onPhoto />
      </View>
    </ProfilePhoto>
  );
}

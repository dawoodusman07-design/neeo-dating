import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Card, Chip, IconButton, ProfilePhoto, Text, VerifiedBadge } from '@/ui';
import type { LikeTarget, Profile } from '@/data';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import { formatDistance } from '@/lib/distance';
import { useSettings } from '@/stores/settings';

type Props = {
  profile: Profile;
  /** When provided, each photo/prompt gets a "like this" button. */
  onLikeTarget?: (target: LikeTarget) => void;
  /** Skip the first photo (already shown as the hero card). */
  skipFirstPhoto?: boolean;
};

/** Photos interleaved with prompts, then basics, date ideas and friend's take. */
export function ProfileView({ profile, onLikeTarget, skipFirstPhoto }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const photos = skipFirstPhoto ? profile.photos.slice(1) : profile.photos;
  const blocks: React.ReactNode[] = [];
  const max = Math.max(photos.length, profile.prompts.length);
  for (let i = 0; i < max; i++) {
    const prompt = profile.prompts[i];
    const photo = photos[i];
    if (prompt) {
      blocks.push(
        <Card key={`pr-${prompt.id}`}>
          <Text variant="caption" color="textMuted">
            {prompt.question}
          </Text>
          <Text variant="heading" accessibilityRole="text">
            {prompt.answer}
          </Text>
          {prompt.voice ? <VoicePlayer clip={prompt.voice} /> : null}
          {onLikeTarget ? (
            <View style={{ alignItems: 'flex-end' }}>
              <IconButton icon="likes" label={`${tr('discover.likePrompt')}: ${prompt.question}`} variant="surface" onPress={() => onLikeTarget({ kind: 'prompt', id: prompt.id })} />
            </View>
          ) : null}
        </Card>,
      );
    }
    if (i === 0) {
      blocks.push(
        <Card key="basics">
          <Text variant="caption" color="textMuted" accessibilityRole="header">
            {tr('profile.basics')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
            <Chip label={tr(`intention.${profile.intention}`)} icon="likes" />
            {profile.verified ? <Chip label={tr('common.verified')} icon="verified" /> : null}
            {profile.basics.map((b) => (
              <Chip key={b} label={b} />
            ))}
          </View>
        </Card>,
      );
    }
    if (photo) {
      const n = profile.photos.indexOf(photo) + 1;
      blocks.push(
        <ProfilePhoto key={`ph-${photo.id}`} uri={photo.uri} blurred={photo.blurred} label={tr('discover.photoOf', { n, total: profile.photos.length, name: profile.firstName })}>
          {onLikeTarget && !photo.blurred ? (
            <View style={{ position: 'absolute', bottom: t.space[3], end: t.space[3] }}>
              <IconButton icon="likes" label={`${tr('discover.likePhoto')} ${n}`} variant="surface" onPress={() => onLikeTarget({ kind: 'photo', id: photo.id })} />
            </View>
          ) : null}
        </ProfilePhoto>,
      );
    }
  }
  return (
    <View style={{ gap: t.space[4] }}>
      {blocks}
      {profile.dateIdeas.length ? (
        <Card>
          <Text variant="caption" color="textMuted" accessibilityRole="header">
            {tr('profile.dateIdeas')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
            {profile.dateIdeas.map((d) => (
              <Chip key={d} label={d} icon="dateIdea" />
            ))}
          </View>
        </Card>
      ) : null}
      {profile.friendsTakes.map((f) => (
        <Card key={f.id} tone="tint">
          <Text variant="caption" color="textMuted">
            {tr('profile.friendsTake')} · {f.author}
          </Text>
          <Text variant="bodyStrong">“{f.text}”</Text>
        </Card>
      ))}
    </View>
  );
}

export function NameLine({ profile, onPhoto }: { profile: Profile; onPhoto?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const miles = useSettings((s) => s.miles);
  const meta = [profile.city, profile.distanceKm ? tr('discover.distance', { km: formatDistance(profile.distanceKm, miles) }) : null, profile.pronouns].filter(Boolean).join(' · ');
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
        <Text variant="title" color={onPhoto ? 'onPhoto' : 'text'}>
          {profile.firstName}, {profile.age}
        </Text>
        {profile.verified ? <VerifiedBadge compact onPhoto={onPhoto} /> : null}
      </View>
      <Text variant="body" color={onPhoto ? 'onPhoto' : 'textMuted'}>
        {meta}
      </Text>
    </View>
  );
}

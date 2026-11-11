import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, IconButton, ProfilePhoto, Text, TextField, toast } from '@/ui';
import { api, type LikeTarget } from '@/data';
import { useLike, useProfile } from '@/data/hooks';
import { useScreenProtection } from '@/services/screenProtection';
import { NameLine, ProfileView } from '@/features/profile/ProfileView';
import { LikeSheet } from '@/features/discover/LikeSheet';
import { SafetyMenu } from '@/features/safety/SafetyMenu';

export default function ProfileDetail() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, from, matchId } = useLocalSearchParams<{ id: string; from?: string; matchId?: string }>();
  const q = useProfile(id);
  const like = useLike();
  const [menu, setMenu] = useState(false);
  const [target, setTarget] = useState<LikeTarget>();
  const [comment, setComment] = useState('');
  useScreenProtection(`profile-${id}`);

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: t.c.bg }} />;
  if (!q.data)
    return <EmptyState icon="you" title={tr('states.not-found.title')} body={tr('states.not-found.body')} action={{ title: tr('common.back'), onPress: () => router.back() }} />;

  const p = q.data;
  const canLike = from === 'discover' || from === 'likes';
  const hero = p.photos[0];
  const blurred = p.photos.some((x) => x.blurred);

  const send = (text: string, tgt?: LikeTarget) =>
    like.mutate(
      { profileId: p.id, target: tgt, comment: text || undefined },
      {
        onSuccess: (r) => {
          setTarget(undefined);
          if (r.matchId) router.replace({ pathname: '/match/[id]', params: { id: r.matchId } });
          else {
            toast(tr('discover.likeSent', { name: p.firstName }), 'success');
            router.back();
          }
        },
      },
    );

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top, paddingHorizontal: t.space[2], minHeight: 52 }}>
        <IconButton icon="back" label={tr('common.back')} onPress={() => router.back()} />
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
          {p.firstName}
        </Text>
        <IconButton icon="more" label={tr('profile.more')} onPress={() => setMenu(true)} testID="profile-more" />
      </View>
      <ScrollView contentContainerStyle={{ padding: t.space[4], gap: t.space[4], paddingBottom: t.space[8] }}>
        {hero ? (
          <ProfilePhoto uri={hero.uri} blurred={hero.blurred} label={tr('discover.photoOf', { n: 1, total: p.photos.length, name: p.firstName })} />
        ) : null}
        <NameLine profile={p} />
        {p.chaperoneEnabled ? (
          <Card tone="tint">
            <Text variant="caption">{tr('profile.chaperone')}</Text>
          </Card>
        ) : null}
        {blurred ? (
          <Card tone="tint">
            <Text>{tr('profile.photosBlurred', { name: p.firstName })}</Text>
            <Button title={tr('profile.requestPhotos')} variant="secondary" icon="show" onPress={async () => { await api.privacy.requestAccess(p.id); toast('Request sent'); }} />
          </Card>
        ) : null}
        <ProfileView profile={p} skipFirstPhoto onLikeTarget={canLike ? setTarget : undefined} />
      </ScrollView>
      {canLike ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space[2], paddingHorizontal: t.space[4], paddingTop: t.space[2], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderTopColor: t.c.border }}>
          <View style={{ flex: 1 }}>
            <TextField label={tr('discover.likeWithComment')} value={comment} onChangeText={setComment} maxLength={200} placeholder={tr('discover.likeWithComment')} />
          </View>
          <IconButton icon="send" label={tr('discover.sendLike')} variant="action" size={52} onPress={() => send(comment, hero ? { kind: 'photo', id: hero.id } : undefined)} disabled={like.isPending} testID="profile-send-like" />
        </View>
      ) : null}
      {target ? <LikeSheet profile={p} target={target} onClose={() => setTarget(undefined)} onSend={(c) => send(c, target)} sending={like.isPending} /> : null}
      <SafetyMenu profile={p} matchId={matchId} visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

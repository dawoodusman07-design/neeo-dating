import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card, Chip, EmptyState, IconButton, ProfilePhoto, Sheet, Text, TextField, toast } from '@/ui';
import { useLocal } from '@/stores/local';
import { type LikeTarget } from '@/data';
import { useLike, useMe, useProfile } from '@/data/hooks';
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
  const me = useMe();
  const { notes, setNote, savedProfiles, saveProfile, unsaveProfile } = useLocal();
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  useScreenProtection(`profile-${id}`);

  if (q.isLoading) return <View style={{ flex: 1, backgroundColor: t.c.bg }} />;
  if (!q.data)
    return <EmptyState icon="you" title={tr('states.not-found.title')} body={tr('states.not-found.body')} action={{ title: tr('common.back'), onPress: () => router.back() }} />;

  const p = q.data;
  const canLike = from === 'discover' || from === 'likes';
  const hero = p.photos[0];
  const blurred = p.photos.some((x) => x.blurred);
  const mine = new Set([...(me.data?.dateIdeas ?? []), ...(me.data?.basics ?? [])].map((x) => x.toLowerCase()));
  const shared = [...p.dateIdeas, ...p.basics].filter((x) => mine.has(x.toLowerCase()));

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
        <IconButton
          icon="save"
          label={savedProfiles[id] ? tr('profile.saved') : tr('profile.save')}
          selected={!!savedProfiles[id]}
          onPress={() => {
            if (!q.data) return;
            if (savedProfiles[id]) unsaveProfile(id);
            else {
              saveProfile(q.data);
              toast(tr('profile.saved'));
            }
          }}
        />
        <IconButton icon="info" label={tr('profile.notes')} onPress={() => { setNoteDraft(notes[id] ?? ''); setNotesOpen(true); }} testID="profile-notes" />
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
            <Button title={tr('profile.requestPhotos')} variant="secondary" icon="show" onPress={() => router.push({ pathname: '/photo-request/[id]', params: { id: p.id } })} testID="request-photos" />
          </Card>
        ) : null}
        {shared.length ? (
          <Card tone="tint">
            <Text variant="caption" color="textMuted" accessibilityRole="header">{tr('profile.sharedInterests')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
              {shared.map((s) => (
                <Chip key={s} label={s} icon="likes" />
              ))}
            </View>
          </Card>
        ) : null}
        {notes[id] ? (
          <Card>
            <Text variant="caption" color="textMuted">{tr('profile.notes')}</Text>
            <Text>{notes[id]}</Text>
          </Card>
        ) : null}
        <ProfileView profile={p} skipFirstPhoto onLikeTarget={canLike ? setTarget : undefined} />
      </ScrollView>
      {canLike ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], paddingHorizontal: t.space[4], paddingTop: t.space[2], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderTopColor: t.c.border }}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={200}
            multiline
            placeholder={tr('discover.likeWithComment')}
            placeholderTextColor={t.c.textMuted}
            accessibilityLabel={tr('discover.likeWithComment')}
            allowFontScaling
            style={{ flex: 1, minHeight: 52, maxHeight: 120, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface, color: t.c.text, fontFamily: t.font.regular, fontSize: t.type.md, paddingHorizontal: t.space[4], paddingVertical: t.space[3], textAlign: 'auto' }}
          />
          <IconButton icon="send" label={tr('discover.sendLike')} variant="action" size={52} onPress={() => send(comment, hero ? { kind: 'photo', id: hero.id } : undefined)} disabled={like.isPending} testID="profile-send-like" />
        </View>
      ) : null}
      {target ? <LikeSheet key={target.id} profile={p} target={target} onClose={() => setTarget(undefined)} onSend={(c) => send(c, target)} sending={like.isPending} /> : null}
      <SafetyMenu profile={p} matchId={matchId} visible={menu} onClose={() => setMenu(false)} />
      <Sheet visible={notesOpen} onClose={() => setNotesOpen(false)} title={tr('profile.notes')}>
        <TextField label={tr('profile.notes')} hint={tr('profile.notesHint')} value={noteDraft} onChangeText={setNoteDraft} multiline maxLength={500} autoComplete="off" testID="notes-input" />
        <Button
          title={tr('common.save')}
          onPress={() => {
            setNote(id, noteDraft.trim());
            setNotesOpen(false);
            toast(tr('profile.notesSaved'));
          }}
        />
      </Sheet>
    </View>
  );
}

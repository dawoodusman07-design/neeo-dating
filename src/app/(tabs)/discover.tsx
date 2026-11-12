import React, { useState } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme, useReduceMotion } from '@/theme';
import { Button, Card, EmptyState, ErrorState, IconButton, Text, toast } from '@/ui';
import { api, type LikeTarget } from '@/data';
import { qk, useIntroductions, useLike, usePass, useSavedProfiles, useToggleSaved } from '@/data/hooks';
import { formatTime } from '@/lib/time';
import { useScreenProtection } from '@/services/screenProtection';
import { IntroCard } from '@/features/discover/IntroCard';
import { LikeSheet } from '@/features/discover/LikeSheet';

export default function Discover() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const reduceMotion = useReduceMotion();
  useScreenProtection('discover');
  const intros = useIntroductions();
  const like = useLike();
  const pass = usePass();
  const savedList = useSavedProfiles();
  const toggleSaved = useToggleSaved();
  const isSaved = (pid: string) => !!savedList.data?.some((s) => s.profile.id === pid);
  const inbox = useQuery({ queryKey: ['inbox'], queryFn: api.inbox.list });
  const unread = (inbox.data ?? []).filter((i) => !i.read).length;
  const [likeTarget, setLikeTarget] = useState<LikeTarget | undefined>();
  const [likeOpen, setLikeOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [photoId, setPhotoId] = useState<string>();
  const [anim] = useState(() => new Animated.Value(0));

  if (intros.isLoading) return <View style={{ flex: 1, backgroundColor: t.c.bg }} />;
  if (intros.isError)
    return <ErrorState icon="offline" title={tr('states.offline.title')} body={tr('states.offline.body')} action={{ title: tr('common.retry'), onPress: () => intros.refetch() }} />;

  const data = intros.data!;
  const profile = data.items[0];

  const animateOut = (dir: 1 | -1, done: () => void) => {
    if (reduceMotion) return done();
    Animated.timing(anim, { toValue: dir, duration: t.motion.likePass, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      done();
      anim.setValue(0);
    });
  };

  const doPass = () => {
    if (!profile) return;
    animateOut(-1, () => {
      pass.mutate(profile.id);
      setCanUndo(true);
      toast(tr('discover.passed'));
    });
  };

  const sendLike = (comment: string) => {
    if (!profile) return;
    const target = likeTarget ?? (photoId ? { kind: 'photo' as const, id: photoId } : undefined);
    like.mutate(
      { profileId: profile.id, target, comment: comment || undefined },
      {
        onSuccess: (r) => {
          setLikeOpen(false);
          setLikeTarget(undefined);
          setCanUndo(false);
          animateOut(1, () => {});
          if (r.matchId) router.push({ pathname: '/match/[id]', params: { id: r.matchId } });
          else toast(tr('discover.likeSent', { name: profile.firstName }), 'success');
        },
      },
    );
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space[4], paddingTop: insets.top + t.space[2], paddingBottom: t.space[2] }}>
      <View style={{ flex: 1 }}>
        <Text variant="heading">{tr('discover.header')}</Text>
        <Text variant="caption" color="textMuted">
          {tr('discover.count', { seen: Math.min(data.seen + 1, data.total), total: data.total })}
        </Text>
      </View>
      <View>
        <IconButton icon="notifications" label={unread ? `${tr('discover.inbox')}, ${tr('a11y.unread', { count: unread })}` : tr('discover.inbox')} onPress={() => router.push('/notifications')} testID="inbox" />
        {unread ? <View pointerEvents="none" style={{ position: 'absolute', top: 8, end: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: t.c.action }} /> : null}
      </View>
      <IconButton icon="preferences" label={tr('discover.filters')} onPress={() => router.push('/settings/preferences')} />
    </View>
  );

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg }}>
        {header}
        {data.seen === 0 ? (
          <EmptyState
            icon="discover"
            title={tr('discover.noMatchesTitle')}
            body={tr('discover.noMatchesBody')}
            action={{ title: tr('discover.noMatchesAction'), onPress: () => router.push('/settings/preferences') }}
          />
        ) : (
          <EmptyState
            icon="time"
            title={tr('discover.caughtUpTitle')}
            body={tr('discover.caughtUpBody', { time: formatTime(data.nextAt) })}
            action={{ title: tr('discover.caughtUpAction'), onPress: () => router.navigate('/chats') }}
          />
        )}
      </View>
    );
  }

  const firstPrompt = profile.prompts[0];
  const translateX = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-420, 0, 420] });
  const opacity = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingTop: 0, gap: t.space[3] }}>
        <Animated.View style={{ transform: [{ translateX }], opacity, gap: t.space[3] }}>
          <IntroCard
            key={profile.id}
            profile={profile}
            saved={isSaved(profile.id)}
            canUndo={canUndo}
            onPhotoChange={setPhotoId}
            onUndo={async () => {
              await api.discover.undo();
              setCanUndo(false);
              qc.invalidateQueries({ queryKey: qk.intros });
            }}
            onSave={() => {
              const saved = isSaved(profile.id);
              toggleSaved.mutate({ profileId: profile.id, saved });
              if (!saved) toast(tr('discover.saved'));
            }}
          />
          {firstPrompt ? (
            <Card>
              <Text variant="caption" color="textMuted">
                {firstPrompt.question}
              </Text>
              <Text variant="heading">{firstPrompt.answer}</Text>
            </Card>
          ) : null}
          <Button
            title={tr('discover.seeMore', { name: profile.firstName })}
            icon="seeMore"
            variant="text"
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id, from: 'discover' } })}
            testID="see-more"
          />
        </Animated.View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center', paddingHorizontal: t.space[4], paddingVertical: t.space[3], borderTopWidth: 1, borderTopColor: t.c.border, backgroundColor: t.c.bg }}>
        <IconButton icon="pass" label={tr('discover.pass', { name: profile.firstName })} variant="surface" size={t.size.passButton} iconSize={26} onPress={doPass} testID="pass" />
        <Button
          title={tr('discover.like', { name: profile.firstName })}
          icon="likes"
          style={{ flex: 1 }}
          onPress={() => setLikeOpen(true)}
          testID="like"
        />
      </View>
      {likeOpen ? (
        <LikeSheet
          key={profile.id}
          profile={profile}
          target={likeTarget ?? (photoId ? { kind: 'photo', id: photoId } : profile.photos[0] ? { kind: 'photo', id: profile.photos[0].id } : undefined)}
          onClose={() => setLikeOpen(false)}
          onSend={sendLike}
          sending={like.isPending}
        />
      ) : null}
    </View>
  );
}

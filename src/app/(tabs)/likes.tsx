import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { EmptyState, ProfilePhoto, Segmented, Text } from '@/ui';
import type { Like } from '@/data';
import { useLikesReceived, useLikesSent } from '@/data/hooks';

export default function Likes() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const received = useLikesReceived();
  const sent = useLikesSent();
  const data = (tab === 'received' ? received.data : sent.data) ?? [];

  const subtitle = (l: Like) =>
    tab === 'sent' ? (l.comment ? `“${l.comment}”` : '') : l.target?.kind === 'photo' ? tr('likes.likedYourPhoto') : l.target?.kind === 'prompt' ? tr('likes.likedYourPrompt') : tr('likes.likedYou');

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ padding: t.space[4], gap: t.space[3] }}>
        <Text variant="title">{tr('likes.title')}</Text>
        <Text color="textMuted">{tr('likes.subtitle')}</Text>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'received', label: `${tr('likes.received')} · ${received.data?.length ?? 0}` },
            { key: 'sent', label: tr('likes.sent') },
          ]}
        />
      </View>
      <FlatList
        data={data}
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={{ gap: t.space[3] }}
        contentContainerStyle={{ paddingHorizontal: t.space[4], gap: t.space[3], paddingBottom: t.space[8], flexGrow: 1 }}
        ListEmptyComponent={
          tab === 'received' ? (
            <EmptyState icon="likes" title={tr('likes.emptyTitle')} body={tr('likes.emptyBody')} action={{ title: tr('likes.emptyAction'), onPress: () => router.push('/settings/edit-profile') }} />
          ) : (
            <EmptyState icon="likes" title={tr('likes.sentEmptyTitle')} body={tr('likes.sentEmptyBody')} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1 / 2, gap: t.space[1] }}
            accessibilityRole="button"
            accessibilityLabel={`${item.profile.firstName}, ${item.profile.age}. ${subtitle(item)}${item.comment && tab === 'received' ? `: ${item.comment}` : ''}`}
            testID={`like-${item.profile.firstName}`}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.profile.id, from: tab === 'received' ? 'likes' : 'sent' } })}
          >
            <ProfilePhoto uri={item.profile.photos[0]?.uri ?? ''} label={item.profile.firstName} blurred={item.profile.photos[0]?.blurred} radius={t.radius.md} />
            <Text variant="bodyStrong" numberOfLines={1}>
              {`${item.profile.firstName}, ${item.profile.age}`}
            </Text>
            {tab === 'received' && item.comment ? (
              <Text variant="caption" numberOfLines={2}>{`“${item.comment}”`}</Text>
            ) : null}
            <Text variant="small" color="textMuted" numberOfLines={2}>
              {subtitle(item)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

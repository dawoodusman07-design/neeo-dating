import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, Icon, ProfilePhoto, Segmented, Text } from '@/ui';
import type { Like } from '@/data';
import { useLikesReceived, useLikesSent } from '@/data/hooks';
import { useSession } from '@/stores/session';

export default function Likes() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPlus = useSession((s) => s.isPlus);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const received = useLikesReceived();
  const sent = useLikesSent();
  const data = (tab === 'received' ? received.data : sent.data) ?? [];
  const locked = tab === 'received' && !isPlus;

  const subtitle = (l: Like) =>
    tab === 'sent' ? (l.comment ? `“${l.comment}”` : '') : l.target?.kind === 'photo' ? tr('likes.likedYourPhoto') : l.target?.kind === 'prompt' ? tr('likes.likedYourPrompt') : tr('likes.likedYou');

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ padding: t.space[4], gap: t.space[3] }}>
        <Text variant="title">{tr('likes.title')}</Text>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'received', label: `${tr('likes.received')} · ${received.data?.length ?? 0}` },
            { key: 'sent', label: tr('likes.sent') },
          ]}
        />
      </View>
      {locked && data.length > 0 ? (
        <Card tone="tint" style={{ marginHorizontal: t.space[4], marginBottom: t.space[3] }}>
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="plus" color={t.c.brandDeep} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {tr('likes.upsellTitle', { count: data.length })}
            </Text>
          </View>
          <Text color="textMuted">{tr('likes.upsellBody')}</Text>
          <Button title={tr('likes.upsellAction')} onPress={() => router.push('/plus')} testID="likes-upsell" />
        </Card>
      ) : null}
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
            disabled={locked}
            accessibilityRole={locked ? undefined : 'button'}
            accessibilityLabel={locked ? `${subtitle(item)}, hidden. Neeo Plus shows who.` : `${item.profile.firstName}, ${subtitle(item)}`}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.profile.id, from: tab === 'received' ? 'likes' : 'sent' } })}
          >
            <ProfilePhoto uri={item.profile.photos[0]?.uri ?? ''} label={locked ? 'Hidden profile' : item.profile.firstName} blurred={locked} radius={t.radius.md} />
            <Text variant="bodyStrong" numberOfLines={1}>
              {locked ? '•••' : `${item.profile.firstName}, ${item.profile.age}`}
            </Text>
            <Text variant="small" color="textMuted" numberOfLines={2}>
              {subtitle(item)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

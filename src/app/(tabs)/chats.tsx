import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Card, EmptyState, Icon, Text, VerifiedBadge, Button } from '@/ui';
import { api, type Match } from '@/data';
import { qk, useMatches } from '@/data/hooks';
import { chatCapState } from '@/lib/chatCap';
import { formatTime } from '@/lib/time';
import { useMyId } from '@/stores/useMyId';
import { confirm } from '@/lib/confirm';

export default function Chats() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const matches = useMatches();
  const myId = useMyId();
  const list = (matches.data ?? []).filter((m) => !m.closed);
  const cap = chatCapState(matches.data ?? []);

  const preview = (m: Match) => {
    const last = m.lastMessage;
    if (!last || last.kind === 'system') return tr('chats.newMatch');
    const body = last.kind === 'voice' ? tr('chats.voiceNote') : last.kind === 'date_proposal' ? `${tr('chats.dateIdea')}: ${last.body}` : last.body;
    return last.senderId === myId ? tr('chats.you', { text: body }) : body;
  };

  const close = async (m: Match) => {
    if (!(await confirm({ title: `${tr('chats.closeChat')}: ${m.profile.firstName}`, ok: tr('chats.closeChat'), cancel: tr('common.cancel') }))) return;
    await api.matches.close(m.id);
    qc.invalidateQueries({ queryKey: qk.matches });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <Text variant="title" style={{ padding: t.space[4] }}>
        {tr('chats.title')}
      </Text>
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: t.space[8] }}
        ListHeaderComponent={
          cap.nearCap ? (
            <Card tone="tint" style={{ marginHorizontal: t.space[4], marginBottom: t.space[3] }}>
              <Text variant="bodyStrong">{cap.atCap ? tr('chats.capReached', { cap: cap.cap }) : tr('chats.capTitle', { active: cap.active })}</Text>
              <Text color="textMuted">{tr('chats.capBody')}</Text>
              {cap.stale[0] ? <Button title={tr('chats.capAction')} variant="secondary" onPress={() => close(cap.stale[0]!)} /> : null}
            </Card>
          ) : undefined
        }
        ListEmptyComponent={<EmptyState icon="chats" title={tr('chats.emptyTitle')} body={tr('chats.emptyBody')} action={{ title: tr('chats.emptyAction'), onPress: () => router.navigate('/discover') }} />}
        renderItem={({ item: m }) => {
          const yourTurn = m.lastMessage && m.lastMessage.senderId === m.profile.id;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: m.id } })}
              onLongPress={() => close(m)}
              accessibilityRole="button"
              accessibilityLabel={[m.profile.firstName, m.profile.verified ? tr('common.verified') : '', preview(m), m.unread ? tr('a11y.unread', { count: m.unread }) : ''].filter(Boolean).join(', ')}
              accessibilityActions={[{ name: 'close', label: tr('chats.closeChat') }]}
              onAccessibilityAction={() => close(m)}
              style={({ pressed }) => ({ flexDirection: 'row', gap: t.space[3], alignItems: 'center', paddingHorizontal: t.space[4], paddingVertical: t.space[3], backgroundColor: pressed ? t.c.tint : 'transparent' })}
              testID={`chat-row-${m.profile.firstName}`}
            >
              <Avatar uri={m.profile.photos[0]?.uri} name={m.profile.firstName} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
                  <Text variant="bodyStrong">{m.profile.firstName}</Text>
                  {m.profile.verified ? <VerifiedBadge compact /> : null}
                  {yourTurn ? (
                    <Text variant="small" color="brandDeep" style={{ marginStart: t.space[1] }}>
                      · {tr('chats.yourTurn')}
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {preview(m)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: t.space[1] }}>
                {m.lastMessage ? (
                  <Text variant="small" color="textMuted">
                    {formatTime(m.lastMessage.createdAt)}
                  </Text>
                ) : null}
                {m.unread ? (
                  <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.c.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                    <Text variant="small" color="onAction">
                      {m.unread}
                    </Text>
                  </View>
                ) : (
                  <Icon name="chevron" size={16} color={t.c.textMuted} />
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

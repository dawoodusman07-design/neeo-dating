import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, EmptyState, Icon, ListGroup, ListRow, Text, VerifiedBadge } from '@/ui';
import { api, type Match } from '@/data';
import { qk, useMatches } from '@/data/hooks';
import { chatCapState } from '@/lib/chatCap';
import { formatTime } from '@/lib/time';
import { useMyId } from '@/stores/useMyId';
import { confirm } from '@/lib/confirm';

const hasConversation = (m: Match) => !!m.lastMessage && m.lastMessage.kind !== 'system';

/** Core screen Chats (chats.svg): new connections, conversations, ended connections. */
export default function Chats() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const matches = useMatches();
  const myId = useMyId();
  const all = matches.data ?? [];
  const live = all.filter((m) => !m.closed && !m.endedAt);
  const fresh = live.filter((m) => !hasConversation(m));
  const conversations = live.filter(hasConversation);
  const ended = all.filter((m) => m.endedAt);
  const cap = chatCapState(all.filter((m) => !m.endedAt));

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
  const open = (m: Match) => router.push({ pathname: '/chat/[id]', params: { id: m.id } });

  if (matches.isSuccess && live.length === 0 && ended.length === 0)
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
        <Text variant="title" style={{ padding: t.space[4] }}>{tr('chats.title')}</Text>
        <EmptyState icon="chats" title={tr('chats.emptyTitle')} body={tr('chats.emptyBody')} action={{ title: tr('chats.emptyAction'), onPress: () => router.navigate('/discover') }} />
      </View>
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.c.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: t.space[8], gap: t.space[4] }}>
      <Text variant="title" style={{ paddingHorizontal: t.space[4], paddingTop: t.space[4] }}>{tr('chats.title')}</Text>

      {fresh.length ? (
        <View style={{ gap: t.space[2] }}>
          <Text variant="caption" color="textMuted" accessibilityRole="header" style={{ paddingHorizontal: t.space[4] }}>{tr('chats.newConnections')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.space[4], paddingHorizontal: t.space[4] }}>
            {fresh.map((m) => (
              <Pressable key={m.id} onPress={() => open(m)} accessibilityRole="button" accessibilityLabel={`${m.profile.firstName}, ${tr('chats.newMatch')}`} style={{ alignItems: 'center', gap: t.space[1], width: 72 }} testID={`new-connection-${m.profile.firstName}`}>
                <Avatar uri={m.profile.photos[0]?.uri} name={m.profile.firstName} size={64} />
                <Text variant="caption" numberOfLines={1}>{m.profile.firstName}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {cap.nearCap ? (
        <Card tone="tint" style={{ marginHorizontal: t.space[4] }}>
          <Text variant="bodyStrong">{cap.atCap ? tr('chats.capReached', { cap: cap.cap }) : tr('chats.capTitle', { active: cap.active })}</Text>
          <Text color="textMuted">{tr('chats.capBody')}</Text>
          {cap.stale[0] ? <Button title={tr('chats.capAction')} variant="secondary" onPress={() => close(cap.stale[0]!)} /> : null}
        </Card>
      ) : null}

      {conversations.length ? (
        <View>
          <Text variant="caption" color="textMuted" accessibilityRole="header" style={{ paddingHorizontal: t.space[4], paddingBottom: t.space[1] }}>{tr('chats.conversations')}</Text>
          {conversations.map((m) => {
            const yourTurn = m.lastMessage && m.lastMessage.senderId === m.profile.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => open(m)}
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
                    {yourTurn ? <Text variant="small" color="brandDeep" style={{ marginStart: t.space[1] }}>{`· ${tr('chats.yourTurn')}`}</Text> : null}
                  </View>
                  <Text variant="caption" color="textMuted" numberOfLines={1}>{preview(m)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: t.space[1] }}>
                  {m.lastMessage ? <Text variant="small" color="textMuted">{formatTime(m.lastMessage.createdAt)}</Text> : null}
                  {m.unread ? (
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.c.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                      <Text variant="small" color="onAction">{m.unread}</Text>
                    </View>
                  ) : (
                    <Icon name="chevron" size={16} color={t.c.textMuted} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Card tone="tint" style={{ marginHorizontal: t.space[4], flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="time" color={t.c.brandDeep} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{tr('chats.tipTitle')}</Text>
          <Text variant="caption" color="textMuted">{tr('chats.tipBody')}</Text>
        </View>
      </Card>

      {ended.length ? (
        <View style={{ paddingHorizontal: t.space[4] }}>
          <ListGroup title={tr('chats.ended')} footer={tr('chats.endedBody')}>
            {ended.map((m) => (
              <ListRow
                key={m.id}
                icon="unmatch"
                title={m.profile.firstName}
                subtitle={tr('chats.endedRow')}
                value={tr('profile.report')}
                onPress={() => router.push({ pathname: '/report/[id]', params: { id: m.profile.id, name: m.profile.firstName, matchId: m.id } })}
                testID={`ended-${m.profile.firstName}`}
              />
            ))}
          </ListGroup>
        </View>
      ) : null}
    </ScrollView>
  );
}

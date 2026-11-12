import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Card, IconButton, Screen, Text, TextField, fromSchema, useField } from '@/ui';
import { api, supportBodySchema } from '@/data';
import { formatTime } from '@/lib/time';

/** Support conversation (from name only). */
export default function SupportConversation() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: ['support', id], queryFn: () => api.support.get(id) });
  const reply = useField('', fromSchema(supportBodySchema));
  const s = q.data;

  const send = async () => {
    if (!reply.check()) return;
    const next = await api.support.reply(id, reply.value.trim());
    qc.setQueryData(['support', id], next);
    qc.invalidateQueries({ queryKey: ['support'] });
    reply.reset('');
  };

  return (
    <Screen
      title={s ? tr('support.reference', { ref: s.reference }) : tr('support.inboxTitle')}
      back
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space[2] }}>
          <View style={{ flex: 1 }}>
            <TextField label={tr('support.replyLabel')} {...reply.props} multiline maxLength={2000} autoComplete="off" testID="support-reply" />
          </View>
          <IconButton icon="send" label={tr('common.send')} variant="action" size={52} onPress={send} disabled={!reply.value.trim()} />
        </View>
      }
    >
      {s ? (
        <>
          <Text variant="caption" color="textMuted">{`${tr(`support.topic_${s.topic}`)} · ${tr(`support.status_${s.status}`)}`}</Text>
          {s.messages.map((m) => (
            <Card key={m.id} tone={m.from === 'me' ? 'surface' : 'tint'} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              <Text variant="caption" color="textMuted">{`${m.from === 'me' ? tr('support.you') : tr('support.team')} · ${formatTime(m.createdAt)}`}</Text>
              <Text>{m.body}</Text>
            </Card>
          ))}
          {s.messages.every((m) => m.from === 'me') ? (
            <Card tone="tint" style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
              <Text variant="caption" color="textMuted">{tr('support.team')}</Text>
              <Text>{tr('support.autoReply')}</Text>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

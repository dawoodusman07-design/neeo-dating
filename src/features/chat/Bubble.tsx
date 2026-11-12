import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, Text } from '@/ui';
import type { Message } from '@/data';
import { formatTime } from '@/lib/time';
import { VoicePlayer } from '@/features/voice/VoicePlayer';

type Props = {
  m: Message;
  mine: boolean;
  showRead: boolean;
  theirName: string;
  onRespondDate: (status: 'accepted' | 'counter') => void;
  onReport: () => void;
  onSaveDate?: () => void;
};

export function Bubble({ m, mine, showRead, theirName, onRespondDate, onReport, onSaveDate }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const time = formatTime(m.createdAt);

  if (m.kind === 'system') {
    const text = m.body === 'matched' ? tr('chat.matched', { name: theirName }) : m.body === 'screenshot_taken' ? tr('chat.screenshot') : m.body;
    return (
      <View style={{ alignItems: 'center', paddingVertical: t.space[2] }} accessible accessibilityLabel={text}>
        <Text variant="small" color="textMuted" align="center">
          {text}
        </Text>
      </View>
    );
  }

  if (m.kind === 'date_proposal' && m.dateProposal) {
    const d = m.dateProposal;
    return (
      <Card style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%', borderColor: t.c.action }}>
        <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
          <Icon name="dateIdea" color={t.c.action} />
          <Text variant="caption" color="brandDeep">
            {tr('chat.dateCard')}
          </Text>
        </View>
        <Text variant="heading">{d.idea}</Text>
        {d.when || d.place ? (
          <Text color="textMuted">{[d.when, d.place].filter(Boolean).join(' · ')}</Text>
        ) : null}
        {d.status === 'proposed' && !mine ? (
          <View style={{ flexDirection: 'row', gap: t.space[2] }}>
            <Button title={tr('chat.accept')} style={{ flex: 1 }} onPress={() => onRespondDate('accepted')} testID="date-accept" />
            <Button title={tr('chat.suggestTime')} variant="secondary" style={{ flex: 1 }} onPress={() => onRespondDate('counter')} />
          </View>
        ) : d.status === 'accepted' ? (
          <View style={{ flexDirection: 'row', gap: t.space[1], alignItems: 'center' }}>
            <Icon name="check" size={16} color={t.c.success} />
            <Text variant="caption" color="success">
              {tr('chat.accepted')}
            </Text>
          </View>
        ) : null}
        {onSaveDate ? <Button title={tr('chat.saveDate')} variant="text" icon="save" fullWidth={false} style={{ alignSelf: 'flex-start' }} onPress={onSaveDate} /> : null}
        <Text variant="small" color="textMuted">
          {time}
        </Text>
      </Card>
    );
  }

  const hidden = m.flagged && !revealed;
  const bg = mine ? t.c.action : t.c.surface;
  const fg = mine ? 'onAction' : 'text';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: t.space[1] }}>
      <Pressable
        disabled={!hidden}
        onPress={() => setRevealed(true)}
        accessibilityRole={hidden ? 'button' : undefined}
        accessibilityLabel={hidden ? tr('chat.flagged') : `${mine ? 'You' : theirName}: ${m.kind === 'voice' ? tr('chat.voiceNote') : m.body}, ${time}`}
        style={{
          backgroundColor: hidden ? t.c.tint : bg,
          borderRadius: t.radius.lg,
          borderBottomEndRadius: mine ? t.radius.sm : t.radius.lg,
          borderBottomStartRadius: mine ? t.radius.lg : t.radius.sm,
          borderWidth: mine ? 0 : 1,
          borderColor: t.c.border,
          paddingHorizontal: t.space[4],
          paddingVertical: t.space[3],
        }}
      >
        {hidden ? (
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="hide" color={t.c.textMuted} />
            <Text variant="caption" color="textMuted" style={{ flexShrink: 1 }}>
              {tr('chat.flagged')}
            </Text>
          </View>
        ) : m.kind === 'voice' && m.voice ? (
          <VoicePlayer clip={m.voice} label={tr('chat.voiceNote')} />
        ) : (
          <Text color={fg}>{m.body}</Text>
        )}
      </Pressable>
      <Text variant="small" color="textMuted" style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
        {time}
        {mine && showRead ? ` · ${m.readAt ? tr('chat.read') : tr('chat.delivered')}` : ''}
      </Text>
      {m.flagged && revealed && !dismissed ? (
        <Card tone="tint" accessibilityLiveRegion="polite">
          <Text variant="bodyStrong">{tr('chat.bothersTitle')}</Text>
          <Text color="textMuted">{tr('chat.bothersBody', { name: theirName })}</Text>
          <View style={{ flexDirection: 'row', gap: t.space[2] }}>
            <Button title={tr('chat.bothersReport')} variant="secondary" style={{ flex: 1 }} onPress={onReport} />
            <Button title={tr('chat.bothersFine')} variant="text" style={{ flex: 1 }} onPress={() => setDismissed(true)} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

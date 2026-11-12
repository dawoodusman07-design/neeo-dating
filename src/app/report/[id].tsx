import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, FieldError, Icon, ListGroup, ListRow, Screen, Text, TextField, useField } from '@/ui';
import { api, type ReportReason } from '@/data';
import { formatTime } from '@/lib/time';

const REASONS: ReportReason[] = ['fake_profile', 'inappropriate_photos', 'harassment', 'underage', 'scam', 'offline_behaviour', 'other'];

/** Package 25 (what happened) → 26 (review) → 27 (received). */
export default function Report() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { id, name = '', matchId, messageId } = useLocalSearchParams<{ id: string; name?: string; matchId?: string; messageId?: string }>();
  const [step, setStep] = useState<'reason' | 'review' | 'sent'>('reason');
  const [reason, setReason] = useState<ReportReason>();
  const [reasonError, setReasonError] = useState<string>();
  const details = useField('', (v) => (v.length > 1000 ? 'Keep it under 1000 characters' : undefined));
  const [included, setIncluded] = useState<Set<string>>(new Set(messageId ? [messageId] : []));
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [loading, setLoading] = useState(false);

  const messages = useQuery({
    queryKey: ['report-messages', matchId],
    queryFn: () => api.messages.list(matchId!),
    enabled: !!matchId,
  });
  const theirs = (messages.data ?? []).filter((m) => m.senderId === id && m.kind !== 'system').slice(-8);

  if (step === 'sent')
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="safety"
          title={tr('report.sentTitle')}
          body={`${tr('report.sentBody')} ${alsoBlock ? tr('report.sentBlocked', { name }) : tr('report.sentNotBlocked', { name })}`}
          action={{ title: tr('report.backToSafety'), onPress: () => router.dismissTo('/settings/safety') }}
          secondary={alsoBlock ? undefined : { title: tr('block.cta', { name }), onPress: () => router.replace({ pathname: '/block/[id]', params: { id } }) }}
        />
      </Screen>
    );

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.safety.report(id, reason, details.value.trim() || undefined, [...included][0]);
      if (alsoBlock) await api.safety.block(id);
      qc.invalidateQueries();
      setStep('sent');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'review')
    return (
      <Screen title={tr('report.title', { name })} back={() => setStep('reason')} footer={<Button title={tr('report.submit')} onPress={submit} loading={loading} testID="report-submit" />}>
        <Text variant="title">{tr('report.reviewTitle')}</Text>
        <Text color="textMuted">{tr('report.reviewBody')}</Text>
        <Card>
          <Text variant="caption" color="textMuted">{tr('report.reviewReason')}</Text>
          <Text variant="bodyStrong">{reason ? tr(`report.reasons.${reason}`) : ''}</Text>
          {details.value.trim() ? <Text>“{details.value.trim()}”</Text> : null}
          <Text variant="caption" color="textMuted">
            {included.size ? tr('report.reviewMessages', { count: included.size }) : tr('report.reviewNoMessages')}
          </Text>
        </Card>
        <ListGroup footer={tr('report.blockHint')}>
          <ListRow title={tr('report.alsoBlock', { name })} toggle={{ value: alsoBlock, onValueChange: setAlsoBlock }} />
        </ListGroup>
        <Card tone="tint">
          <Text variant="caption">{tr('report.urgent')}</Text>
        </Card>
      </Screen>
    );

  return (
    <Screen
      title={tr('report.title', { name })}
      close={() => router.back()}
      footer={
        <Button
          title={tr('report.review')}
          testID="report-review"
          onPress={() => {
            if (!reason) return setReasonError(tr('report.reasonRequired'));
            if (!details.check()) return;
            setStep('review');
          }}
        />
      }
    >
      <Text variant="title">{tr('report.why')}</Text>
      <Card tone="tint">
        <Text variant="caption">{tr('report.urgent')}</Text>
      </Card>
      <ListGroup title={tr('common.chooseOne')}>
        {REASONS.map((r) => (
          <ListRow
            key={r}
            title={tr(`report.reasons.${r}`)}
            selected={reason === r}
            onPress={() => {
              setReason(r);
              setReasonError(undefined);
            }}
          />
        ))}
      </ListGroup>
      <FieldError message={reasonError} />
      <TextField label={tr('report.details')} hint={tr('report.detailsHint', { name })} {...details.props} multiline maxLength={1000} autoComplete="off" testID="report-details" />
      {theirs.length ? (
        <View style={{ gap: t.space[2] }}>
          <Text variant="caption" color="textMuted" accessibilityRole="header">
            {tr('report.includeMessages')}
          </Text>
          {theirs.map((m) => {
            const on = included.has(m.id);
            return (
              <Pressable
                key={m.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${m.body}, ${formatTime(m.createdAt)}`}
                onPress={() => setIncluded((s) => {
                  const n = new Set(s);
                  if (n.has(m.id)) n.delete(m.id);
                  else n.add(m.id);
                  return n;
                })}
                style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center', minHeight: 44, padding: t.space[3], borderRadius: t.radius.md, borderWidth: 1, borderColor: on ? t.c.action : t.c.border, backgroundColor: t.c.surface }}
              >
                <Icon name={on ? 'check' : 'dash'} color={on ? t.c.action : t.c.textMuted} />
                <Text style={{ flex: 1 }} numberOfLines={3}>{m.kind === 'voice' ? tr('chat.voiceNote') : m.body}</Text>
                <Text variant="small" color="textMuted">{formatTime(m.createdAt)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

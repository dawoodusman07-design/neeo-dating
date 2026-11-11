import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, EmptyState, ListGroup, ListRow, Screen, Text, TextField } from '@/ui';
import { api, type ReportReason } from '@/data';

const REASONS: ReportReason[] = ['fake_profile', 'inappropriate_photos', 'harassment', 'underage', 'scam', 'offline_behaviour', 'other'];

export default function Report() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { id, name = '', messageId } = useLocalSearchParams<{ id: string; name?: string; matchId?: string; messageId?: string }>();
  const [reason, setReason] = useState<ReportReason>();
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <Screen scroll={false}>
        <EmptyState icon="safety" title={t('report.sentTitle')} body={t('report.sentBody', { name })} action={{ title: t('common.done'), onPress: () => router.dismissTo('/discover') }} />
      </Screen>
    );

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.safety.report(id, reason, details.trim() || undefined, messageId || undefined);
      if (alsoBlock) await api.safety.block(id);
      qc.invalidateQueries();
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title={t('report.title', { name })} close={() => router.back()} footer={<Button title={t('report.submit')} onPress={submit} disabled={!reason} loading={loading} testID="report-submit" />}>
      <Card tone="tint">
        <Text variant="caption">{t('report.urgent')}</Text>
      </Card>
      <ListGroup title={t('report.why')}>
        {REASONS.map((r) => (
          <ListRow key={r} title={t(`report.reasons.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </ListGroup>
      <TextField label={t('report.details')} hint={t('report.detailsHint')} value={details} onChangeText={setDetails} multiline maxLength={1000} />
      <ListGroup>
        <ListRow title={t('report.alsoBlock', { name })} toggle={{ value: alsoBlock, onValueChange: setAlsoBlock }} />
      </ListGroup>
    </Screen>
  );
}

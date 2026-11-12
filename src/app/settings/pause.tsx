import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '@/ui';
import { api } from '@/data';
import { useMe } from '@/data/hooks';
import { useSession } from '@/stores/session';

/** Package 49 (Take a break) → 50 (Room to breathe / paused state). */
export default function Pause() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const setStatus = useSession((s) => s.setStatus);
  const [busy, setBusy] = useState(false);
  const paused = !!me.data?.paused;
  const toggle = async () => {
    setBusy(true);
    try {
      await api.me.pause(!paused);
      await qc.invalidateQueries({ queryKey: ['me'] });
      if (!paused) router.replace({ pathname: '/state/[kind]', params: { kind: 'paused' } });
      else setStatus('active');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title={t('you.pause')} back footer={<Button title={paused ? t('settings.resumeCta') : t('settings.pauseCta')} onPress={toggle} loading={busy} testID="pause-toggle" />}>
      <Text variant="title">{paused ? t('states.paused.title') : t('settings.pauseTitle')}</Text>
      <Card>
        <Text>{paused ? t('states.paused.body') : t('settings.pauseBody')}</Text>
      </Card>
    </Screen>
  );
}

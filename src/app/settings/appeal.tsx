import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Screen, Text, TextField, useField } from '@/ui';
import { api } from '@/data';

/** Package 58 — Appeal → appeal received → outcome in /appeals and the notification inbox. */
export default function Appeal() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const body = useField('', (v) => (v.trim().length < 10 ? t('settings.appealMin') : v.length > 2000 ? 'Keep it under 2000 characters' : undefined));
  const [loading, setLoading] = useState(false);
  return (
    <Screen
      title={t('settings.appealsTitle')}
      back
      footer={
        <Button
          title={t('settings.appealSend')}
          loading={loading}
          testID="appeal-send"
          onPress={async () => {
            if (!body.check()) return;
            setLoading(true);
            try {
              await api.safety.appeal(body.value.trim());
              qc.invalidateQueries({ queryKey: ['appeals'] });
              router.replace({ pathname: '/state/[kind]', params: { kind: 'appeal-sent' } });
            } finally {
              setLoading(false);
            }
          }}
        />
      }
    >
      <Text variant="title">{t('settings.appealTitle')}</Text>
      <Text color="textMuted">{t('settings.appealBody')}</Text>
      <TextField label={t('settings.appealLabel')} {...body.props} multiline maxLength={2000} autoComplete="off" testID="appeal-body" />
    </Screen>
  );
}

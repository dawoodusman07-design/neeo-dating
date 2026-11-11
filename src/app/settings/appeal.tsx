import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Screen, Text, TextField } from '@/ui';
import { api } from '@/data';

export default function Appeal() {
  const { t } = useTranslation();
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <Screen
      title={t('settings.appealTitle')}
      back
      footer={
        <Button
          title={t('settings.appealSend')}
          disabled={text.trim().length < 10}
          loading={loading}
          onPress={async () => {
            setLoading(true);
            await api.safety.appeal(text.trim()).finally(() => setLoading(false));
            router.replace({ pathname: '/state/[kind]', params: { kind: 'appeal-sent' } });
          }}
        />
      }
    >
      <Text color="textMuted">{t('settings.appealBody')}</Text>
      <TextField label={t('settings.appealLabel')} value={text} onChangeText={setText} multiline maxLength={2000} />
    </Screen>
  );
}

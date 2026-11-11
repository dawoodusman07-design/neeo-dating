import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Screen, Text } from '@/ui';
import { api } from '@/data';

export default function Export() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Screen
      title={t('settings.exportTitle')}
      back
      footer={
        <Button
          title={t('settings.exportAction')}
          loading={loading}
          onPress={async () => {
            setLoading(true);
            try {
              const r = await api.me.exportData();
              router.replace({ pathname: '/state/[kind]', params: { kind: r.status === 'ready' ? 'export-ready' : 'offline', url: r.url ?? '' } });
            } catch {
              router.push({ pathname: '/state/[kind]', params: { kind: 'offline' } });
            } finally {
              setLoading(false);
            }
          }}
        />
      }
    >
      <Text>{t('settings.exportBody')}</Text>
    </Screen>
  );
}

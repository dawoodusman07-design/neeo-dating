import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, Text } from '@/ui';

/** Package 51 — Export data. Verification first (/reauth), then the private download is prepared. */
export default function Export() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen title={t('you.export')} back footer={<Button title={t('settings.exportAction')} onPress={() => router.push({ pathname: '/reauth', params: { for: 'export' } })} testID="export-request" />}>
      <Text variant="title">{t('settings.exportTitle')}</Text>
      <Card>
        <Text>{t('settings.exportBody')}</Text>
      </Card>
    </Screen>
  );
}

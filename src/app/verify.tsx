import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Text } from '@/ui';
import { SelfieVerification } from '@/features/verify/SelfieVerification';

export default function VerifyFromSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen back>
      <Text variant="title">{t('onboarding.verifyTitle')}</Text>
      <Text color="textMuted">{t('onboarding.verifyBody')}</Text>
      <SelfieVerification allowSkip={false} onDone={() => router.back()} />
    </Screen>
  );
}

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/ui';

export default function Locked() {
  const { t } = useTranslation();
  const router = useRouter();
  const { sec = '900' } = useLocalSearchParams<{ sec?: string }>();
  return (
    <Screen scroll={false}>
      <EmptyState
        icon="photoPrivacy"
        title={t('auth.lockedTitle')}
        body={t('auth.lockedBody', { min: Math.ceil(Number(sec) / 60) })}
        action={{ title: t('common.close'), onPress: () => router.replace('/welcome') }}
      />
    </Screen>
  );
}

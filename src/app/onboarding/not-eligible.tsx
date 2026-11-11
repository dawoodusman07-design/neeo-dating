import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/ui';
import { api } from '@/data';
import { useSession } from '@/stores/session';

export default function NotEligible() {
  const { t } = useTranslation();
  const router = useRouter();
  const signOut = useSession((s) => s.signOut);
  return (
    <Screen scroll={false}>
      <EmptyState
        icon="info"
        title={t('onboarding.notEligibleTitle')}
        body={t('onboarding.notEligibleBody')}
        action={{
          title: t('onboarding.notEligibleAction'),
          onPress: async () => {
            await api.auth.signOut().catch(() => {});
            signOut();
            router.replace('/welcome');
          },
        }}
      />
    </Screen>
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/data';
import { useSession } from '@/stores/session';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Package 55 — Log out. */
export default function Logout() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const signOut = useSession((s) => s.signOut);
  return (
    <ConfirmScreen
      icon="signOut"
      title={t('logout.title')}
      lines={sentences(t('logout.body'))}
      cta={t('logout.cta')}
      testID="logout-confirm"
      secondary={{ title: t('logout.pauseInstead'), onPress: () => router.replace('/settings/pause') }}
      onConfirm={async () => {
        await api.auth.signOut();
        qc.clear();
        signOut();
      }}
    />
  );
}

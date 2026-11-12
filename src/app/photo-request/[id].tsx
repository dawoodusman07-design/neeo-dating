import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '@/data';
import { useProfile } from '@/data/hooks';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Package 22 — Photo request ("Private by choice"). */
export default function PhotoRequest() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile(id);
  const name = profile.data?.firstName ?? '';
  return (
    <ConfirmScreen
      icon="photoPrivacy"
      title={t('photoRequest.title')}
      lines={sentences(t('photoRequest.body', { name }))}
      cta={t('photoRequest.cta')}
      testID="photo-request-confirm"
      onConfirm={async () => {
        await api.privacy.requestAccess(id);
        router.replace({ pathname: '/state/[kind]', params: { kind: 'photo-request-sent', name } });
      }}
    />
  );
}

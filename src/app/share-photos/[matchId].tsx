import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/data';
import { qk, useMatch } from '@/data/hooks';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Share photos (from a chat) → writes a real photo_access grant. */
export default function SharePhotos() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = useMatch(matchId);
  const p = match.data?.profile;
  const name = p?.firstName ?? '';
  return (
    <ConfirmScreen
      icon="show"
      avatar={p ? { uri: p.photos[0]?.uri, name } : undefined}
      title={t('sharePhotos.title', { name })}
      lines={sentences(t('sharePhotos.body', { name }))}
      cta={t('sharePhotos.cta')}
      testID="share-photos-confirm"
      onConfirm={async () => {
        if (!p) return;
        await api.privacy.grant(p.id);
        await qc.invalidateQueries({ queryKey: qk.photoRequests });
        router.replace({ pathname: '/state/[kind]', params: { kind: 'photos-shared', name } });
      }}
    />
  );
}

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/data';
import { useMatch } from '@/data/hooks';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Package 29 — End this connection (unmatch). `id` is the match id. */
export default function UnmatchConfirm() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = useMatch(id);
  const p = match.data?.profile;
  return (
    <ConfirmScreen
      icon="unmatch"
      destructive
      avatar={p ? { uri: p.photos[0]?.uri, name: p.firstName } : undefined}
      title={t('unmatch.title')}
      lines={sentences(t('unmatch.body'))}
      cta={t('unmatch.cta')}
      testID="unmatch-confirm"
      onConfirm={async () => {
        await api.matches.unmatch(id);
        await qc.invalidateQueries();
        router.dismissAll();
        router.replace({ pathname: '/state/[kind]', params: { kind: 'connection-ended' } });
      }}
    />
  );
}

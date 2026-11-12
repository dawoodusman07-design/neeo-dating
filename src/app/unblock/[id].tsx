import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/data';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';

/** Unblock confirmation (from name only). */
export default function UnblockConfirm() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { id, name = '' } = useLocalSearchParams<{ id: string; name?: string }>();
  return (
    <ConfirmScreen
      icon="block"
      title={t('unblock.title', { name })}
      lines={sentences(t('unblock.body'))}
      cta={t('unblock.cta', { name })}
      testID="unblock-confirm"
      onConfirm={async () => {
        await api.safety.unblock(id);
        await qc.invalidateQueries();
        router.replace({ pathname: '/state/[kind]', params: { kind: 'unblocked', name } });
      }}
    />
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { purchases } from '@/services/purchases';
import { useSession } from '@/stores/session';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';
import { membershipKey } from '@/features/membership/useMembership';

/** Package 38 — Restore purchases → 39 restored / 40 nothing to restore. */
export default function Restore() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const setPlus = useSession((s) => s.setPlus);
  return (
    <ConfirmScreen
      icon="retry"
      title={t('membership.restoreTitle')}
      lines={sentences(t('membership.restoreBody'))}
      cta={t('plus.restore')}
      testID="restore-confirm"
      onConfirm={async () => {
        const r = await purchases.restore().catch(() => 'nothing_to_restore' as const);
        await qc.invalidateQueries({ queryKey: membershipKey });
        if (r === 'restored') setPlus(true);
        router.replace({ pathname: '/state/[kind]', params: { kind: r === 'restored' ? 'restored' : 'restore-none' } });
      }}
    />
  );
}

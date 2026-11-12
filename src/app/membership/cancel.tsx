import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { purchases } from '@/services/purchases';
import { ConfirmScreen, sentences } from '@/features/safety/ConfirmScreen';
import { membershipKey } from '@/features/membership/useMembership';

/**
 * Package 42 — Cancel membership. Apps can't cancel store subscriptions; we open the
 * store's own management screen. When the user returns, membership re-reads the store
 * and shows "Renewal is off" (43) if they turned it off.
 */
export default function CancelMembership() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  return (
    <ConfirmScreen
      icon="time"
      title={t('membership.cancelTitle')}
      lines={sentences(t('membership.cancelBody'))}
      cta={t('membership.openStore')}
      testID="membership-open-store"
      onConfirm={async () => {
        await purchases.manage();
        await qc.invalidateQueries({ queryKey: membershipKey });
        router.back();
      }}
    />
  );
}

import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, Screen, toast, type IconName } from '@/ui';
import { api } from '@/data';
import { isPlusActive, purchases } from '@/services/purchases';
import { useSession } from '@/stores/session';
import { membershipKey } from '@/features/membership/useMembership';

const ICONS: Record<string, IconName> = {
  'purchase-pending': 'time',
  'purchase-failed': 'billing',
  'purchase-cancelled': 'info',
  'purchase-success': 'plus',
  restored: 'check',
  'restore-none': 'info',
  'billing-issue': 'billing',
  'session-expired': 'photoPrivacy',
  'export-ready': 'export',
  'export-expired': 'time',
  offline: 'offline',
  'upload-failed': 'uploadFailed',
  'account-review': 'safety',
  suspended: 'block',
  'report-sent': 'safety',
  'appeal-sent': 'check',
  paused: 'pauseProfile',
  deleted: 'check',
  'not-found': 'you',
  'support-received': 'help',
  blocked: 'block',
  unblocked: 'check',
  'connection-ended': 'unmatch',
  'photo-request-sent': 'photoPrivacy',
  'photos-shared': 'show',
  'access-revoked': 'hide',
  'reauth-failed': 'photoPrivacy',
};
const ERRORS = new Set(['purchase-failed', 'billing-issue', 'offline', 'upload-failed', 'suspended', 'export-expired', 'reauth-failed']);

/**
 * Shared edge-case screen: icon + title + one sentence + one action.
 * Params: kind, and optionally name / ref / url used in the copy or the action.
 */
export default function StateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { kind = 'offline', url, name = '', ref = '' } = useLocalSearchParams<{ kind: string; url?: string; name?: string; ref?: string }>();
  const { signOut, setStatus, setPlus } = useSession();
  const [busy, setBusy] = useState(false);
  const key = `states.${kind}`;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const action = async () => {
    switch (kind) {
      case 'purchase-pending': {
        setBusy(true);
        const m = await purchases.refresh().finally(() => setBusy(false));
        qc.setQueryData(membershipKey, m);
        if (isPlusActive(m.status)) {
          setPlus(true);
          return router.replace({ pathname: '/state/[kind]', params: { kind: 'purchase-success' } });
        }
        return toast(t('membership.stillPending'));
      }
      case 'purchase-failed':
        return router.replace('/plus/review');
      case 'purchase-success':
      case 'restored':
        await qc.invalidateQueries({ queryKey: membershipKey });
        return router.replace('/membership');
      case 'restore-none':
        return router.replace({ pathname: '/support', params: { topic: 'billing' } });
      case 'billing-issue':
        return purchases.manage();
      case 'session-expired':
        signOut();
        return router.replace('/welcome');
      case 'deleted':
        qc.clear();
        signOut();
        return router.replace('/welcome');
      case 'export-ready':
        return url ? Linking.openURL(url) : back();
      case 'export-expired':
        return router.replace('/settings/export');
      case 'account-review':
      case 'suspended':
        return router.push('/settings/appeal');
      case 'appeal-sent':
        return router.replace('/appeals');
      case 'support-received':
        return router.dismissTo('/settings/account');
      case 'report-sent':
        return router.dismissTo('/settings/safety');
      case 'connection-ended':
        return router.replace('/chats');
      case 'blocked':
        return router.replace('/discover');
      case 'paused':
        setBusy(true);
        await api.me.pause(false).finally(() => setBusy(false));
        setStatus('active');
        await qc.invalidateQueries({ queryKey: ['me'] });
        return router.replace('/discover');
      case 'reauth-failed':
        return router.dismissTo('/settings/account');
      default:
        return back();
    }
  };

  const props = {
    title: t(`${key}.title`, { name }),
    body: t(`${key}.body`, { name, ref }),
    action: { title: t(`${key}.action`), onPress: action, loading: busy },
    secondary: kind === 'purchase-pending' ? { title: t('common.close'), onPress: () => router.dismissAll() } : undefined,
  };
  return (
    <Screen scroll={false}>
      {ERRORS.has(kind) ? <ErrorState icon={ICONS[kind]} {...props} /> : <EmptyState icon={ICONS[kind] ?? 'info'} {...props} />}
    </Screen>
  );
}

import React from 'react';
import { Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, Screen, type IconName } from '@/ui';
import { api } from '@/data';
import { emailSupport } from '@/lib/links';
import { useSession } from '@/stores/session';

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
};
const ERRORS = new Set(['purchase-failed', 'billing-issue', 'offline', 'upload-failed', 'suspended', 'export-expired']);

/** Shared edge-case screen: every state is icon + title + one sentence + one action. */
export default function StateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { kind = 'offline', url } = useLocalSearchParams<{ kind: string; url?: string }>();
  const signOut = useSession((s) => s.signOut);
  const setStatus = useSession((s) => s.setStatus);
  const key = `states.${kind}`;

  const action = () => {
    switch (kind) {
      case 'purchase-failed':
        return router.replace('/plus');
      case 'billing-issue':
        return Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions');
      case 'session-expired':
      case 'deleted':
        signOut();
        return router.replace('/welcome');
      case 'export-ready':
        return url ? Linking.openURL(url) : router.back();
      case 'export-expired':
        return router.replace('/settings/export');
      case 'account-review':
        return emailSupport('Account review');
      case 'suspended':
        return router.push('/settings/appeal');
      case 'paused':
        return api.me.pause(false).then(() => {
          setStatus('active');
          router.replace('/discover');
        });
      default:
        return router.canGoBack() ? router.back() : router.replace('/');
    }
  };

  const props = { title: t(`${key}.title`), body: t(`${key}.body`), action: { title: t(`${key}.action`), onPress: action } };
  return (
    <Screen scroll={false}>
      {ERRORS.has(kind) ? <ErrorState icon={ICONS[kind]} {...props} /> : <EmptyState icon={ICONS[kind] ?? 'info'} {...props} />}
    </Screen>
  );
}

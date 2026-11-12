import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Icon, ListGroup, ListRow, Screen, Text, toast, type IconName } from '@/ui';
import { isPlusActive, purchases, type MembershipStatus } from '@/services/purchases';
import { formatDate } from '@/lib/time';
import { membershipKey, useMembership } from '@/features/membership/useMembership';

/**
 * Package 41 (active), 43 (renewal off), 44 (billing issue), 45 (expired), plus free and pending.
 * Every variant is derived from the store's real entitlement state (services/purchases.ts).
 */
export default function Membership() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const q = useMembership();
  const [checking, setChecking] = useState(false);
  const m = q.data;
  if (!m) return <Screen title={tr('membership.title')} back>{null}</Screen>;
  const date = m.expiresAt ? formatDate(m.expiresAt) : '';

  const view: Record<MembershipStatus, { icon: IconName; title: string; body: string; cta: { title: string; onPress: () => void } }> = {
    active: { icon: 'plus', title: tr('membership.activeTitle'), body: tr('membership.activeBody', { date }), cta: { title: tr('membership.manage'), onPress: () => purchases.manage() } },
    renewal_off: { icon: 'time', title: tr('membership.renewalOffTitle'), body: tr('membership.renewalOffBody', { date }), cta: { title: tr('membership.backToAccount'), onPress: () => router.dismissTo('/settings/account') } },
    billing_issue: { icon: 'billing', title: tr('membership.billingTitle'), body: tr('membership.billingBody'), cta: { title: tr('membership.manageBilling'), onPress: () => purchases.manage() } },
    expired: { icon: 'info', title: tr('membership.expiredTitle'), body: tr('membership.expiredBody'), cta: { title: tr('membership.continueFree'), onPress: () => router.dismissTo('/discover') } },
    free: { icon: 'plus', title: tr('membership.freeTitle'), body: tr('membership.freeBody'), cta: { title: tr('membership.seePlus'), onPress: () => router.push('/plus') } },
    pending: {
      icon: 'time',
      title: tr('membership.pendingTitle'),
      body: tr('membership.pendingBody'),
      cta: {
        title: tr('membership.checkStatus'),
        onPress: async () => {
          setChecking(true);
          const next = await purchases.refresh().finally(() => setChecking(false));
          qc.setQueryData(membershipKey, next);
          if (next.status === 'pending') toast(tr('membership.stillPending'));
        },
      },
    },
  };
  const v = view[m.status];

  return (
    <Screen title={tr('membership.title')} back footer={<Button title={v.cta.title} onPress={v.cta.onPress} loading={checking} variant={m.status === 'billing_issue' ? 'danger' : 'primary'} testID="membership-cta" />}>
      <View style={{ alignItems: 'center', gap: t.space[2], paddingTop: t.space[2] }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={v.icon} size={30} color={m.status === 'billing_issue' ? t.c.danger : t.c.brandDeep} />
        </View>
        <Text variant="title" align="center" testID="membership-title">{v.title}</Text>
        <Text color="textMuted" align="center" accessibilityLiveRegion="polite">{v.body}</Text>
        {m.store ? <Text variant="caption" color="textMuted">{tr('membership.storeLine', { store: tr(`membership.store_${m.store}`) })}</Text> : null}
      </View>
      {m.status === 'expired' ? <Button title={tr('membership.rejoin')} variant="secondary" onPress={() => router.push('/plus/compare')} /> : null}
      <ListGroup>
        {isPlusActive(m.status) && m.status !== 'renewal_off' ? <ListRow icon="time" title={tr('membership.cancelRow')} onPress={() => router.push('/membership/cancel')} /> : null}
        <ListRow icon="retry" title={tr('membership.restoreRow')} onPress={() => router.push('/membership/restore')} />
        <ListRow icon="info" title={tr('membership.terms')} onPress={() => router.push('/info/subscription-terms')} />
        <ListRow icon="billing" title={tr('membership.refunds')} onPress={() => router.push('/info/refunds')} />
      </ListGroup>
      {purchases.isTestStore ? (
        <Card tone="tint">
          <Text variant="caption">{tr('plus.testStore')}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

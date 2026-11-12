import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Icon, Screen, Text } from '@/ui';
import { purchases } from '@/services/purchases';
import { useSession } from '@/stores/session';
import { membershipKey, usePlans } from '@/features/membership/useMembership';

/**
 * Package 33 — Store checkout hand-off. The native StoreKit / Play Billing sheet is
 * presented by the store over this screen; we wait for its result and route to the
 * matching state (34 success, 35 cancelled, 36 pending, 37 failed).
 */
export default function Checkout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const setPlus = useSession((s) => s.setPlus);
  const { plan: planId } = useLocalSearchParams<{ plan?: string }>();
  const plans = usePlans();
  const [waiting, setWaiting] = useState(false);
  const started = useRef(false);

  const buy = useCallback(async () => {
    const plan = plans.data?.find((p) => p.id === planId) ?? plans.data?.[0];
    if (!plan) return;
    setWaiting(true);
    const r = await purchases.purchase(plan);
    setWaiting(false);
    await qc.invalidateQueries({ queryKey: membershipKey });
    if (r.status === 'success') setPlus(true);
    router.replace({ pathname: '/state/[kind]', params: { kind: `purchase-${r.status}` } });
  }, [plans.data, planId, qc, router, setPlus]);

  useEffect(() => {
    if (!started.current && plans.data) {
      started.current = true;
      buy();
    }
  }, [plans.data, buy]);

  return (
    <Screen back={!waiting} footer={<Button title={tr('plus.checkoutCta')} onPress={buy} disabled={waiting} variant="secondary" />}>
      <View style={{ alignItems: 'center', gap: t.space[4], paddingTop: t.space[8] }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="billing" size={32} color={t.c.brandDeep} />
        </View>
        <Text variant="title" align="center">{tr('plus.checkoutTitle')}</Text>
        <Text color="textMuted" align="center">{tr('plus.checkoutBody')}</Text>
        {waiting ? (
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }} accessibilityLiveRegion="polite">
            <ActivityIndicator color={t.c.action} />
            <Text variant="caption">{tr('plus.checkoutWaiting')}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

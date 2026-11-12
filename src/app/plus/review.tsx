import React from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, ListGroup, ListRow, Screen, Text } from '@/ui';
import { purchases } from '@/services/purchases';
import { usePlans } from '@/features/membership/useMembership';
import { links, openLink } from '@/lib/links';

/** Package 32 — Review purchase. Price and period come from the store; nothing is hard-coded. */
export default function ReviewPurchase() {
  const { t } = useTranslation();
  const router = useRouter();
  const { plan: planId } = useLocalSearchParams<{ plan?: string }>();
  const plans = usePlans();
  const plan = plans.data?.find((p) => p.id === planId) ?? plans.data?.[0];
  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';
  return (
    <Screen
      title={t('plus.title')}
      back
      footer={
        <>
          <Button title={t('plus.continueToStore')} disabled={!plan} onPress={() => router.push({ pathname: '/plus/checkout', params: { plan: plan!.id } })} testID="plus-continue" />
          <Text variant="small" color="textMuted" align="center">{t('plus.renewal', { store })}</Text>
        </>
      }
    >
      <Text variant="title">{plan ? t('plus.reviewTitle', { plan: plan.title }) : t('plus.title')}</Text>
      {plan ? (
        <Card>
          <Text variant="heading">{t('plus.reviewPrice', { price: plan.priceString, period: plan.periodLabel })}</Text>
          <Text color="textMuted">{t('plus.renewalShort')}</Text>
          {purchases.isTestStore ? <Text variant="caption" color="brandDeep">{t('plus.testStore')}</Text> : null}
        </Card>
      ) : null}
      <ListGroup>
        <ListRow icon="info" title={t('membership.terms')} onPress={() => router.push('/info/subscription-terms')} />
        <ListRow icon="info" title={t('plus.terms')} onPress={() => openLink(links.terms)} />
        <ListRow icon="photoPrivacy" title={t('plus.privacy')} onPress={() => openLink(links.privacy)} />
      </ListGroup>
    </Screen>
  );
}

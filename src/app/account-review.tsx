import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState, Screen, Text } from '@/ui';
import { api } from '@/data';

/** Package 57 — Account under review, with the moderation reason and an appeal path. */
export default function AccountReview() {
  const { t } = useTranslation();
  const router = useRouter();
  const review = useQuery({ queryKey: ['review'], queryFn: api.me.review });
  const kind = review.data?.status === 'suspended' ? 'suspended' : 'account-review';
  return (
    <Screen
      footer={
        <>
          <Button title={t(`states.${kind}.action`)} onPress={() => router.push('/settings/appeal')} testID="review-appeal" />
          <Button title={t('accountReview.appeals')} variant="text" onPress={() => router.push('/appeals')} />
          <Button title={t('settings.contact')} variant="text" onPress={() => router.push({ pathname: '/support', params: { topic: 'account' } })} />
        </>
      }
    >
      <EmptyState icon="safety" title={t(`states.${kind}.title`)} body={t(`states.${kind}.body`)} />
      <Card tone="tint">
        <Text variant="caption" color="textMuted">{t('accountReview.reason')}</Text>
        <Text>{review.data?.reason ?? t('accountReview.noReason')}</Text>
      </Card>
    </Screen>
  );
}

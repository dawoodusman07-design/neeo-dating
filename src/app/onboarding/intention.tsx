import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, ListGroup, ListRow } from '@/ui';
import type { Intention } from '@/data';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const OPTIONS: Intention[] = ['long_term', 'life_partner', 'figuring_out'];

export default function IntentionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { intention, patch } = useOnboarding();
  return (
    <OnboardingStep
      step="intention"
      title={t('onboarding.intentionTitle')}
      body={t('onboarding.intentionBody')}
      footer={<Button title={t('common.continue')} onPress={() => router.push(nextStep('intention'))} disabled={!intention} testID="intention-continue" />}
    >
      <ListGroup>
        {OPTIONS.map((o) => (
          <ListRow key={o} title={t(`intention.${o}`)} selected={intention === o} onPress={() => patch({ intention: o })} />
        ))}
      </ListGroup>
    </OnboardingStep>
  );
}

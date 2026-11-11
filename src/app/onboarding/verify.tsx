import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';
import { SelfieVerification } from '@/features/verify/SelfieVerification';

export default function Verify() {
  const { t } = useTranslation();
  const router = useRouter();
  const patch = useOnboarding((s) => s.patch);
  return (
    <OnboardingStep step="verify" title={t('onboarding.verifyTitle')} body={t('onboarding.verifyBody')} footer={null}>
      <SelfieVerification
        onDone={(r) => {
          patch({ verification: r === 'verified' ? 'verified' : r === 'pending' ? 'pending' : 'skipped' });
          router.push(nextStep('verify'));
        }}
      />
    </OnboardingStep>
  );
}

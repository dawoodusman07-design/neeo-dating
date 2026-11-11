import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Text } from '@/ui';
import { ageFromDob, isEligible } from '@/lib/age';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

export default function Dob() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dob: saved, patch, reset } = useOnboarding();
  const [dob, setDob] = useState(saved ?? '');
  const [error, setError] = useState<string>();
  const age = ageFromDob(dob);

  const next = () => {
    if (!Number.isFinite(age)) return setError(t('onboarding.dobInvalid'));
    if (!isEligible(dob)) {
      reset(); // don't keep any data from someone under 18
      return router.replace('/onboarding/not-eligible');
    }
    patch({ dob });
    router.push(nextStep('dob'));
  };

  const format = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('-');
  };

  return (
    <OnboardingStep step="dob" title={t('onboarding.dobTitle')} body={t('onboarding.dobBody')} footer={<Button title={t('common.continue')} onPress={next} disabled={dob.length !== 10} testID="dob-continue" />}>
      <TextField
        label={t('onboarding.dobLabel')}
        hint={t('onboarding.dobHint')}
        value={dob}
        onChangeText={(v) => {
          setDob(format(v));
          setError(undefined);
        }}
        error={error}
        keyboardType="number-pad"
        placeholder="1996-05-21"
        maxLength={10}
        testID="dob-input"
        autoFocus
      />
      {Number.isFinite(age) && age >= 18 ? (
        <Text variant="bodyStrong" accessibilityLiveRegion="polite">
          {t('onboarding.dobConfirm', { age })}
        </Text>
      ) : null}
    </OnboardingStep>
  );
}

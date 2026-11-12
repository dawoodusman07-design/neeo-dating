import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, TextField, Text, useField } from '@/ui';
import { ageFromDob, isEligible } from '@/lib/age';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const format = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('-');
};

export default function Dob() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dob: saved, patch, reset } = useOnboarding();
  const field = useField(saved ?? '', (v) => (Number.isFinite(ageFromDob(v)) ? undefined : t('onboarding.dobInvalid')));
  const age = ageFromDob(field.value);

  const next = () => {
    if (!field.check()) return;
    if (!isEligible(field.value)) {
      reset(); // keep nothing from someone under 18
      return router.replace('/onboarding/not-eligible');
    }
    patch({ dob: field.value });
    router.push(nextStep('dob'));
  };

  return (
    <OnboardingStep step="dob" title={t('onboarding.dobTitle')} body={t('onboarding.dobBody')} footer={<Button title={t('common.continue')} onPress={next} disabled={field.value.length !== 10} testID="dob-continue" />}>
      <TextField
        label={t('onboarding.dobLabel')}
        hint={t('onboarding.dobHint')}
        {...field.props}
        onChangeText={(v) => field.props.onChangeText(format(v))}
        keyboardType="number-pad"
        textContentType="birthdate"
        autoComplete="birthdate-full"
        placeholder="1996-05-21"
        maxLength={10}
        testID="dob-input"
        autoFocus
        onSubmitEditing={next}
      />
      {Number.isFinite(age) && age >= 18 ? (
        <Text variant="bodyStrong" accessibilityLiveRegion="polite">
          {t('onboarding.dobConfirm', { age })}
        </Text>
      ) : null}
    </OnboardingStep>
  );
}

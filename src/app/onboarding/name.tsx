import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/ui';
import { nameSchema } from '@/data';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

export default function Name() {
  const { t } = useTranslation();
  const router = useRouter();
  const { firstName, pronouns, patch } = useOnboarding();
  const [name, setName] = useState(firstName);
  const [pro, setPro] = useState(pronouns);
  const [error, setError] = useState<string>();
  const next = () => {
    const r = nameSchema.safeParse(name);
    if (!r.success) return setError(r.error.issues[0]?.message);
    patch({ firstName: r.data, pronouns: pro.trim() });
    router.push(nextStep('name'));
  };
  return (
    <OnboardingStep step="name" title={t('onboarding.nameTitle')} footer={<Button title={t('common.continue')} onPress={next} disabled={!name.trim()} testID="name-continue" />}>
      <TextField label={t('onboarding.nameLabel')} value={name} onChangeText={setName} error={error} autoComplete="given-name" textContentType="givenName" autoFocus testID="name-input" />
      <TextField label={t('onboarding.pronounsLabel')} hint={t('onboarding.pronounsHint')} value={pro} onChangeText={setPro} autoCapitalize="none" />
    </OnboardingStep>
  );
}

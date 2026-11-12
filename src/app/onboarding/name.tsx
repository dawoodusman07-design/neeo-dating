import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Chip, FieldError, Text, TextField, fromSchema, useField } from '@/ui';
import { nameSchema, type Gender } from '@/data';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const GENDERS: Gender[] = ['woman', 'man', 'nonbinary', 'self_described'];

export default function Name() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const draft = useOnboarding();
  const name = useField(draft.firstName, fromSchema(nameSchema));
  const pronouns = useField(draft.pronouns, (v) => (v.length > 30 ? 'Keep it under 30 characters' : undefined));
  const genderText = useField(draft.genderText, (v) => (v.trim().length < 2 ? tr('onboarding.genderRequired') : undefined));
  const [gender, setGender] = useState<Gender | undefined>(draft.gender);
  const [genderError, setGenderError] = useState<string>();

  const next = () => {
    const ok = [name.check(), pronouns.check(), gender === 'self_described' ? genderText.check() : true].every(Boolean);
    if (!gender) setGenderError(tr('onboarding.genderRequired'));
    if (!ok || !gender) return;
    draft.patch({ firstName: name.value.trim(), pronouns: pronouns.value.trim(), gender, genderText: gender === 'self_described' ? genderText.value.trim() : '' });
    router.push(nextStep('name'));
  };

  return (
    <OnboardingStep step="name" title={tr('onboarding.nameTitle')} footer={<Button title={tr('common.continue')} onPress={next} testID="name-continue" />}>
      <TextField label={tr('onboarding.nameLabel')} {...name.props} autoComplete="given-name" textContentType="givenName" autoCapitalize="words" autoFocus testID="name-input" returnKeyType="next" />
      <TextField label={tr('onboarding.pronounsLabel')} hint={tr('onboarding.pronounsHint')} {...pronouns.props} autoCapitalize="none" autoComplete="off" />
      <View style={{ gap: t.space[2] }} accessibilityRole="radiogroup" accessibilityLabel={tr('onboarding.genderLabel')}>
        <Text variant="caption">{tr('onboarding.genderLabel')}</Text>
        <Text variant="small" color="textMuted">
          {tr('onboarding.genderHint')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {GENDERS.map((g) => (
            <Chip
              key={g}
              label={tr(`onboarding.gender_${g}`)}
              selected={gender === g}
              onPress={() => {
                setGender(g);
                setGenderError(undefined);
              }}
            />
          ))}
        </View>
        <FieldError message={genderError} />
      </View>
      {gender === 'self_described' ? <TextField label={tr('onboarding.genderTextLabel')} {...genderText.props} maxLength={40} autoComplete="off" testID="gender-text" /> : null}
    </OnboardingStep>
  );
}

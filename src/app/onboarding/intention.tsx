import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, FieldError, ListGroup, ListRow, TextField, useField } from '@/ui';
import type { Intention } from '@/data';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const OPTIONS: Intention[] = ['long_term', 'life_partner', 'figuring_out'];

export default function IntentionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { intention, intentionNote, patch } = useOnboarding();
  const note = useField(intentionNote, (v) => (v.length > 120 ? 'Keep it under 120 characters' : undefined));
  const [error, setError] = useState<string>();
  const next = () => {
    if (!intention) return setError(t('common.chooseOne'));
    if (!note.check()) return;
    patch({ intentionNote: note.value.trim() });
    router.push(nextStep('intention'));
  };
  return (
    <OnboardingStep step="intention" title={t('onboarding.intentionTitle')} body={t('onboarding.intentionBody')} footer={<Button title={t('common.continue')} onPress={next} testID="intention-continue" />}>
      <ListGroup>
        {OPTIONS.map((o) => (
          <ListRow
            key={o}
            title={t(`intention.${o}`)}
            selected={intention === o}
            onPress={() => {
              patch({ intention: o });
              setError(undefined);
            }}
          />
        ))}
      </ListGroup>
      <FieldError message={error} />
      <TextField label={t('onboarding.intentionNoteLabel')} hint={t('onboarding.intentionNoteHint')} {...note.props} maxLength={120} multiline autoComplete="off" />
    </OnboardingStep>
  );
}

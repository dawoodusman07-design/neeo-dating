import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Chip, Text } from '@/ui';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { DATE_IDEAS, nextStep } from '@/features/onboarding/steps';

export default function DateIdeas() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { dateIdeas, patch } = useOnboarding();
  const toggle = (idea: string) =>
    patch({ dateIdeas: dateIdeas.includes(idea) ? dateIdeas.filter((d) => d !== idea) : dateIdeas.length < 3 ? [...dateIdeas, idea] : dateIdeas });
  return (
    <OnboardingStep
      step="date-ideas"
      title={tr('onboarding.dateIdeasTitle')}
      body={tr('onboarding.dateIdeasBody')}
      footer={<Button title={tr('common.continue')} onPress={() => router.push(nextStep('date-ideas'))} disabled={dateIdeas.length === 0} testID="ideas-continue" />}
    >
      <Text variant="caption" color="textMuted" accessibilityLiveRegion="polite">
        {dateIdeas.length}/3
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
        {DATE_IDEAS.map((idea) => (
          <Chip key={idea} label={idea} icon="dateIdea" selected={dateIdeas.includes(idea)} disabled={!dateIdeas.includes(idea) && dateIdeas.length >= 3} onPress={() => toggle(idea)} />
        ))}
      </View>
    </OnboardingStep>
  );
}

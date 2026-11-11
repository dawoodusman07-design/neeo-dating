import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen, ProgressBar, Text } from '@/ui';
import { STEPS, type Step } from './steps';

type Props = {
  step: Step;
  title: string;
  body?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  back?: boolean;
};

export function OnboardingStep({ step, title, body, children, footer, back = true }: Props) {
  const { t } = useTranslation();
  const index = STEPS.indexOf(step) + 1;
  return (
    <Screen back={back && index > 1} footer={footer}>
      <ProgressBar value={index / STEPS.length} label={t('common.stepOf', { step: index, total: STEPS.length })} />
      <Text variant="title">{title}</Text>
      {body ? <Text color="textMuted">{body}</Text> : null}
      {children}
    </Screen>
  );
}

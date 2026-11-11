import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, Text, type IconName } from '@/ui';
import { links, openLink } from '@/lib/links';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

export default function Agreement() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { agreementAccepted, patch } = useOnboarding();
  const items: [IconName, string][] = [
    ['verified', tr('onboarding.agreement1')],
    ['likes', tr('onboarding.agreement2')],
    ['hide', tr('onboarding.agreement3')],
    ['safety', tr('onboarding.agreement4')],
  ];
  return (
    <OnboardingStep
      step="agreement"
      title={tr('onboarding.agreementTitle')}
      body={tr('onboarding.agreementBody')}
      footer={<Button title={tr('onboarding.agreementAccept')} disabled={!agreementAccepted} onPress={() => router.push(nextStep('agreement'))} testID="agreement-continue" />}
    >
      <Card>
        {items.map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', gap: t.space[3] }}>
            <Icon name={icon} color={t.c.brandDeep} />
            <Text style={{ flex: 1 }}>{text}</Text>
          </View>
        ))}
      </Card>
      <Button title={tr('settings.community')} variant="text" fullWidth={false} style={{ alignSelf: 'flex-start' }} onPress={() => openLink(links.community)} />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreementAccepted }}
        accessibilityLabel={tr('onboarding.agreementCheckbox')}
        onPress={() => patch({ agreementAccepted: !agreementAccepted })}
        style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: 44 }}
        testID="agreement-checkbox"
      >
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: agreementAccepted ? t.c.action : t.c.textMuted, backgroundColor: agreementAccepted ? t.c.action : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {agreementAccepted ? <Icon name="check" size={16} color={t.c.onAction} /> : null}
        </View>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {tr('onboarding.agreementCheckbox')}
        </Text>
      </Pressable>
    </OnboardingStep>
  );
}

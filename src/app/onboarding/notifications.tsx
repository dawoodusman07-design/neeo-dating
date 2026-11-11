import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Icon } from '@/ui';
import { requestPushPermission } from '@/services/notifications';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

/** Explain first; only then show the system prompt. */
export default function Notifications() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const patch = useOnboarding((s) => s.patch);
  const [loading, setLoading] = useState(false);
  const go = () => {
    patch({ notificationsAsked: true });
    router.push(nextStep('notifications'));
  };
  return (
    <OnboardingStep
      step="notifications"
      title={tr('onboarding.notifTitle')}
      body={tr('onboarding.notifBody')}
      footer={
        <>
          <Button
            title={tr('onboarding.notifAllow')}
            loading={loading}
            testID="notif-allow"
            onPress={async () => {
              setLoading(true);
              await requestPushPermission().catch(() => {});
              setLoading(false);
              go();
            }}
          />
          <Button title={tr('common.notNow')} variant="text" onPress={go} testID="notif-skip" />
        </>
      }
    >
      <View style={{ alignItems: 'center', paddingVertical: t.space[8] }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="notifications" size={40} color={t.c.brandDeep} />
        </View>
      </View>
    </OnboardingStep>
  );
}

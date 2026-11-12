import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Icon, ListGroup, ListRow } from '@/ui';
import { useSettings, type NotificationPrefs } from '@/stores/settings';
import { requestPushPermission } from '@/services/notifications';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

/** Explain first; only then show the system prompt. */
const TYPES: (keyof NotificationPrefs)[] = ['newIntroductions', 'likes', 'matches', 'messages'];

export default function Notifications() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const patch = useOnboarding((s) => s.patch);
  const [loading, setLoading] = useState(false);
  const { notifications, setNotification } = useSettings();
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
      <View style={{ alignItems: 'center', paddingVertical: t.space[4] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="notifications" size={36} color={t.c.brandDeep} />
        </View>
      </View>
      <ListGroup footer={tr('settings.quietSub')}>
        {TYPES.map((k) => (
          <ListRow key={k} title={tr(`settings.n_${k}`)} toggle={{ value: notifications[k], onValueChange: (v) => setNotification(k, v) }} />
        ))}
      </ListGroup>
    </OnboardingStep>
  );
}

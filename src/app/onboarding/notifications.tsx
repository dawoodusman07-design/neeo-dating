import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Icon, ListGroup, ListRow } from '@/ui';
import { useSettings, type NotificationPrefs } from '@/stores/settings';
import { requestPushPermission } from '@/services/notifications';
import { NotificationsOff } from '@/features/notifications/NotificationsOff';
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
  const [denied, setDenied] = useState(false);
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
            title={denied ? tr('common.continue') : tr('onboarding.notifAllow')}
            loading={loading}
            testID="notif-allow"
            onPress={async () => {
              if (denied) return go();
              setLoading(true);
              const r = await requestPushPermission().catch(() => ({ status: 'denied' as const }));
              setLoading(false);
              // Denied: stay here and explain how to turn them on later, instead of moving on silently.
              if (r.status === 'denied') setDenied(true);
              else go();
            }}
          />
          <Button title={tr('common.notNow')} variant="text" onPress={go} testID="notif-skip" />
        </>
      }
    >
      {denied ? <NotificationsOff /> : null}
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

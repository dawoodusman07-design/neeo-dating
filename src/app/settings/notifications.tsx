import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen } from '@/ui';
import { NotificationsOff } from '@/features/notifications/NotificationsOff';
import { getPushPermission, type PushPermission } from '@/services/notifications';
import { useSettings, type NotificationPrefs } from '@/stores/settings';

const KEYS: (keyof NotificationPrefs)[] = ['newIntroductions', 'likes', 'matches', 'messages', 'safetyCheckins', 'productNews'];

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const { notifications, setNotification } = useSettings();
  const [perm, setPerm] = useState<PushPermission>('granted');
  useEffect(() => {
    getPushPermission().then(setPerm).catch(() => {});
  }, []);
  return (
    <Screen title={t('settings.notifTitle')} back>
      {perm === 'denied' ? (
        <NotificationsOff />
      ) : null}
      <ListGroup>
        {KEYS.map((k) => (
          <ListRow
            key={k}
            title={t(`settings.n_${k}`)}
            subtitle={k === 'safetyCheckins' ? t('settings.n_safetySub') : undefined}
            toggle={{ value: notifications[k], onValueChange: (v) => setNotification(k, v), disabled: k === 'safetyCheckins' }}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}

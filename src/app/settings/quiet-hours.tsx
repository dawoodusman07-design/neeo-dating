import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ListGroup, ListRow, Screen, TextField } from '@/ui';
import { useSettings } from '@/stores/settings';

const fmt = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

export default function QuietHours() {
  const { t } = useTranslation();
  const { quietHours, set } = useSettings();
  const patch = (p: Partial<typeof quietHours>) => set('quietHours', { ...quietHours, ...p });
  return (
    <Screen title={t('settings.quietTitle')} back>
      <ListGroup footer={t('settings.quietSub')}>
        <ListRow icon="quietHours" title={t('settings.quietToggle')} toggle={{ value: quietHours.enabled, onValueChange: (enabled) => patch({ enabled }) }} />
      </ListGroup>
      {quietHours.enabled ? (
        <Card>
          <TextField label={t('settings.from')} value={quietHours.start} onChangeText={(v) => patch({ start: fmt(v) })} keyboardType="number-pad" maxLength={5} hint="HH:MM" />
          <TextField label={t('settings.to')} value={quietHours.end} onChangeText={(v) => patch({ end: fmt(v) })} keyboardType="number-pad" maxLength={5} hint="HH:MM" />
        </Card>
      ) : null}
    </Screen>
  );
}

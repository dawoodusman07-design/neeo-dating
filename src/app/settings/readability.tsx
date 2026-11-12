import React from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, ListGroup, ListRow, Screen, Text } from '@/ui';
import { useSettings } from '@/stores/settings';

/** Readability (from name only): text size follows the device; in-app Reduce Motion. */
export default function Readability() {
  const { t } = useTranslation();
  const { reduceMotion, set } = useSettings();
  return (
    <Screen title={t('settings.readabilityTitle')} back>
      <Text>{t('settings.readabilityBody')}</Text>
      <Card tone="tint">
        <Text variant="heading">Aa</Text>
        <Text>{t('settings.readabilityPreview')}</Text>
      </Card>
      <Button title={t('settings.openSettings')} variant="secondary" onPress={() => Linking.openSettings()} />
      <ListGroup footer={t('settings.reduceMotionSub')}>
        <ListRow title={t('settings.reduceMotion')} toggle={{ value: reduceMotion, onValueChange: (v) => set('reduceMotion', v) }} />
      </ListGroup>
    </Screen>
  );
}

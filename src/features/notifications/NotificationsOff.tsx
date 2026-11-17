import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Icon, Text } from '@/ui';

/** Notification permission denied: say so with icon + text, and say exactly how to turn it back on. */
export function NotificationsOff() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const web = Platform.OS === 'web';
  return (
    <Card tone="tint" accessibilityLiveRegion="polite" testID="notifications-off">
      <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'flex-start' }}>
        <Icon name="notifications" color={t.c.brandDeep} />
        <View style={{ flex: 1, gap: t.space[1] }}>
          <Text variant="bodyStrong">{tr('settings.notifOff')}</Text>
          <Text color="textMuted">{web ? tr('settings.notifHowToWeb') : tr('settings.notifHowTo')}</Text>
        </View>
      </View>
      {web ? null : <Button title={tr('settings.openSettings')} variant="secondary" onPress={() => Linking.openSettings()} />}
    </Card>
  );
}

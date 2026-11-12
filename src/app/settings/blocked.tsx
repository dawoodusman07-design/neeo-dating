import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, EmptyState, ListGroup, Screen, Text } from '@/ui';
import { useBlocked } from '@/data/hooks';

/** Blocked accounts → unblock confirmation (/unblock/[id]). */
export default function Blocked() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const q = useBlocked();
  const list = q.data ?? [];
  return (
    <Screen title={tr('settings.blockedTitle')} back scroll={list.length > 0}>
      {list.length === 0 ? (
        <EmptyState icon="block" title={tr('settings.blockedTitle')} body={tr('settings.blockedEmpty')} />
      ) : (
        <ListGroup>
          {list.map((b) => (
            <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', padding: t.space[4], gap: t.space[3] }}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>{b.firstName}</Text>
              <Button title={tr('settings.unblock')} variant="secondary" fullWidth={false} accessibilityLabel={`${tr('settings.unblock')} ${b.firstName}`} onPress={() => router.push({ pathname: '/unblock/[id]', params: { id: b.id, name: b.firstName } })} testID={`unblock-${b.firstName}`} />
            </View>
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

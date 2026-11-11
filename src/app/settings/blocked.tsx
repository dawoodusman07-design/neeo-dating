import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, EmptyState, ListGroup, Screen, Text } from '@/ui';
import { api } from '@/data';
import { qk, useBlocked } from '@/data/hooks';

export default function Blocked() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
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
              <Button title={tr('settings.unblock')} variant="secondary" fullWidth={false} accessibilityLabel={`${tr('settings.unblock')} ${b.firstName}`} onPress={async () => { await api.safety.unblock(b.id); qc.invalidateQueries({ queryKey: qk.blocked }); }} />
            </View>
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

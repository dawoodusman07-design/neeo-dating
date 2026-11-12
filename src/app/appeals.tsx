import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState, Icon, Screen, Text } from '@/ui';
import { useTheme } from '@/theme';
import { View } from 'react-native';
import { api } from '@/data';
import { formatDate } from '@/lib/time';

/** Appeal outcome (from name only): every appeal with its status and the reviewer's note. */
export default function Appeals() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const q = useQuery({ queryKey: ['appeals'], queryFn: api.safety.appeals });
  const list = q.data ?? [];
  return (
    <Screen title={tr('settings.appealsTitle')} back scroll={list.length > 0} footer={<Button title={tr('settings.appealTitle')} variant="secondary" onPress={() => router.push('/settings/appeal')} />}>
      {list.length === 0 ? (
        <EmptyState icon="report" title={tr('settings.appealsTitle')} body={tr('settings.appealsEmpty')} />
      ) : (
        list.map((a) => (
          <Card key={a.id} testID={`appeal-${a.status}`}>
            <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
              <Icon name={a.status === 'open' ? 'time' : a.status === 'overturned' ? 'check' : 'info'} color={a.status === 'overturned' ? t.c.success : t.c.brandDeep} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>{tr(`settings.appeal_${a.status}`)}</Text>
              <Text variant="small" color="textMuted">{formatDate(a.createdAt)}</Text>
            </View>
            <Text color="textMuted">“{a.body}”</Text>
            {a.outcomeNote ? <Text>{a.outcomeNote}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, Icon, Screen, Text } from '@/ui';
import { api } from '@/data';
import { confirm } from '@/lib/confirm';

/** "Are you okay?" — shown when a date check-in is due (push in production, inbox/Chats card in-app). */
export default function CheckInPrompt() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const active = useQuery({ queryKey: ['checkIn', 'active'], queryFn: () => api.safety.activeCheckIn() });
  const [busy, setBusy] = useState<'ok' | 'help'>();
  const c = active.data && (active.data.id === id || !id) ? active.data : null;

  if (active.isSuccess && !c) {
    return (
      <Screen back>
        <EmptyState icon="safety" title={tr('checkIn.title')} body={tr('checkIn.noActive')} action={{ title: tr('common.done'), onPress: () => router.back() }} />
      </Screen>
    );
  }
  if (!c) return <Screen back>{null}</Screen>;

  const done = async (kind: 'checkin-safe' | 'checkin-alert-sent') => {
    await qc.invalidateQueries({ queryKey: ['checkIn', 'active'] });
    router.replace({ pathname: '/state/[kind]', params: { kind, name: c.contact.name } });
  };
  const ok = async () => {
    setBusy('ok');
    await api.safety.confirmCheckIn(c.id).finally(() => setBusy(undefined));
    await done('checkin-safe');
  };
  const help = async () => {
    const yes = await confirm({ title: tr('checkIn.confirmHelpTitle', { name: c.contact.name }), message: tr('checkIn.confirmHelpBody'), ok: tr('checkIn.confirmHelpYes', { name: c.contact.name }), cancel: tr('common.cancel'), destructive: true });
    if (!yes) return;
    setBusy('help');
    await api.safety.requestHelp(c.id).finally(() => setBusy(undefined));
    await done('checkin-alert-sent');
  };

  return (
    <Screen
      back
      title={tr('checkIn.promptTitle')}
      footer={
        <>
          <Button title={tr('checkIn.imOk')} icon="check" onPress={ok} loading={busy === 'ok'} disabled={!!busy} testID="checkin-ok" />
          <Button title={tr('checkIn.needHelp')} variant="danger" icon="safety" onPress={help} loading={busy === 'help'} disabled={!!busy} testID="checkin-help" />
        </>
      }
    >
      <View style={{ alignItems: 'center', paddingVertical: t.space[4] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="safety" size={36} color={t.c.brandDeep} />
        </View>
      </View>
      <Text>{tr('checkIn.promptBody', { place: c.place })}</Text>
      <Card tone="tint">
        <Text color="textMuted">{tr('checkIn.promptContact', { name: c.contact.name })}</Text>
      </Card>
      <Text variant="small" color="textMuted">{tr('settings.emergency')}</Text>
    </Screen>
  );
}

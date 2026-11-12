import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, Icon, Screen, Text, TextField, fromSchema, useField } from '@/ui';
import { api, deleteConfirmSchema } from '@/data';
import { useSession } from '@/stores/session';
import { links, openLink } from '@/lib/links';
import { recentlyReauthed } from '@/features/account/ReauthForm';

/**
 * Package 52 (before you leave) → reauthenticate (/reauth) → 53 (confirm) → 54 (removed).
 * Apple 5.1.1(v) / Google Play: full in-app deletion, not deactivation.
 */
export default function DeleteAccount() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ step?: string }>();
  const signOut = useSession((s) => s.signOut);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = useField('', fromSchema(deleteConfirmSchema));
  const step = done ? 'done' : params.step === 'confirm' ? 'confirm' : 'explain';

  useEffect(() => {
    // The confirm step is only reachable straight after a successful reauthentication.
    if (step === 'confirm' && !recentlyReauthed()) router.replace({ pathname: '/reauth', params: { for: 'delete' } });
  }, [step, router]);

  if (step === 'done')
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="check"
          title={tr('settings.deletedTitle')}
          body={tr('settings.deletedBody')}
          action={{
            title: tr('settings.backToWelcome'),
            onPress: () => {
              qc.clear();
              signOut();
            },
          }}
        />
      </Screen>
    );

  if (step === 'confirm')
    return (
      <Screen
        title={tr('you.delete')}
        back
        footer={
          <Button
            title={tr('settings.deleteFinal')}
            variant="danger"
            loading={busy}
            testID="delete-final"
            onPress={async () => {
              if (!confirm.check()) return;
              setBusy(true);
              try {
                await api.me.deleteAccount();
                setDone(true);
              } catch {
                confirm.setServerError(tr('common.genericError'));
              } finally {
                setBusy(false);
              }
            }}
          />
        }
      >
        <Text variant="title">{tr('settings.deleteConfirmTitle')}</Text>
        <Text color="textMuted">{tr('settings.deleteConfirmBody')}</Text>
        <TextField label={tr('settings.deleteConfirm')} {...confirm.props} autoCapitalize="characters" autoComplete="off" autoCorrect={false} testID="delete-confirm" />
      </Screen>
    );

  return (
    <Screen
      title={tr('you.delete')}
      back
      footer={
        <>
          <Button title={tr('settings.deleteReview')} variant="danger" testID="delete-continue" onPress={() => router.push({ pathname: '/reauth', params: { for: 'delete' } })} />
          <Button title={tr('settings.deletePause')} variant="text" onPress={() => router.replace('/settings/pause')} />
        </>
      }
    >
      <Text variant="title">{tr('settings.deleteTitle')}</Text>
      <Text variant="bodyStrong">{tr('settings.deleteStep1')}</Text>
      <Card>
        <Text variant="caption" color="textMuted">{tr('settings.deleteWhat')}</Text>
        {[tr('settings.deleteItem1'), tr('settings.deleteItem2'), tr('settings.deleteItem3')].map((s) => (
          <View key={s} style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="delete" color={t.c.danger} />
            <Text style={{ flex: 1 }}>{s}</Text>
          </View>
        ))}
      </Card>
      <Text variant="caption" color="textMuted">{tr('settings.deleteKeep')}</Text>
      <Button title={tr('settings.privacyPolicy')} variant="text" fullWidth={false} style={{ alignSelf: 'flex-start' }} onPress={() => openLink(links.privacy)} />
    </Screen>
  );
}

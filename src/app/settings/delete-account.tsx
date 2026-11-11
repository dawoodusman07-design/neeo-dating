import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, EmptyState, Icon, Screen, Text, TextField } from '@/ui';
import { api, ApiError } from '@/data';
import { useSession } from '@/stores/session';

type Step = 'explain' | 'reauth' | 'confirm' | 'done';

/**
 * Apple 5.1.1(v) / Google Play: full in-app deletion (not deactivation).
 * explain → reauthenticate → confirm → done.
 */
export default function DeleteAccount() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { phone, signOut } = useSession();
  const [step, setStep] = useState<Step>('explain');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (step === 'done')
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="check"
          title={tr('settings.deletedTitle')}
          body={tr('settings.deletedBody')}
          action={{
            title: tr('common.close'),
            onPress: () => {
              qc.clear();
              signOut();
            },
          }}
        />
      </Screen>
    );

  if (step === 'reauth')
    return (
      <Screen
        title={tr('settings.deleteReauth')}
        back={() => setStep('explain')}
        footer={
          <Button
            title={tr('auth.verify')}
            disabled={code.length !== 6}
            loading={loading}
            testID="delete-reauth"
            onPress={async () => {
              setLoading(true);
              setError(undefined);
              try {
                await api.auth.reauthenticate(code);
                setStep('confirm');
              } catch (e) {
                setError((e as ApiError).code === 'otp_locked' ? tr('auth.lockedTitle') : tr('auth.wrongCode', { left: '' }).trim());
              } finally {
                setLoading(false);
              }
            }}
          />
        }
      >
        <Text color="textMuted">{tr('settings.deleteReauthBody')}</Text>
        <TextField label={tr('auth.otpLabel')} value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" error={error} testID="delete-otp" />
      </Screen>
    );

  if (step === 'confirm')
    return (
      <Screen
        title={tr('settings.deleteTitle')}
        back={() => setStep('explain')}
        footer={
          <Button
            title={tr('settings.deleteFinal')}
            variant="danger"
            disabled={confirm.trim().toUpperCase() !== 'DELETE'}
            loading={loading}
            testID="delete-final"
            onPress={async () => {
              setLoading(true);
              try {
                await api.me.deleteAccount();
                setStep('done');
              } catch {
                setError(tr('common.genericError'));
              } finally {
                setLoading(false);
              }
            }}
          />
        }
      >
        <TextField label={tr('settings.deleteConfirm')} value={confirm} onChangeText={setConfirm} autoCapitalize="characters" error={error} testID="delete-confirm" />
      </Screen>
    );

  return (
    <Screen
      title={tr('settings.deleteTitle')}
      back
      footer={
        <>
          <Button
            title={tr('common.continue')}
            variant="danger"
            testID="delete-continue"
            onPress={async () => {
              if (phone) await api.auth.sendOtp(phone).catch(() => {});
              setStep('reauth');
            }}
          />
          <Button title={tr('settings.deletePause')} variant="text" onPress={() => router.replace('/settings/pause')} />
        </>
      }
    >
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
    </Screen>
  );
}

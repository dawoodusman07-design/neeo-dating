import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text, TextField, fromSchema, useField } from '@/ui';
import { api, ApiError, otpSchema } from '@/data';
import { useSession } from '@/stores/session';

type Props = { onVerified: () => void; onLocked: () => void };

/**
 * Reauthentication before sensitive actions (export, delete). Sends a fresh code,
 * shows attempts left, and gives up after 3 wrong codes (reauth-failed state).
 */
export function ReauthForm({ onVerified, onLocked }: Props) {
  const { t } = useTranslation();
  const { phone, setReauth } = useSession();
  const code = useField('', fromSchema(otpSchema));
  const [left, setLeft] = useState(3);
  const [busy, setBusy] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !phone) return;
    sent.current = true;
    api.auth.sendOtp(phone).catch(() => {});
  }, [phone]);

  const verify = async () => {
    if (!code.check()) return;
    setBusy(true);
    try {
      await api.auth.reauthenticate(code.value);
      setReauth();
      onVerified();
    } catch (e) {
      const remaining = left - 1;
      setLeft(remaining);
      if ((e as ApiError).code === 'otp_locked' || remaining <= 0) return onLocked();
      code.setServerError(t('reauth.failedAttempts', { count: remaining }));
      code.setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text variant="title">{t('reauth.title')}</Text>
      <Text color="textMuted">{t('reauth.body', { phone: phone ?? '' })}</Text>
      <TextField
        label={t('auth.otpLabel')}
        {...code.props}
        onChangeText={(v) => code.props.onChangeText(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        testID="reauth-otp"
      />
      <Button title={t('auth.verify')} onPress={verify} loading={busy} disabled={code.value.length !== 6} testID="reauth-verify" />
    </>
  );
}

/** True when the user reauthenticated in the last 5 minutes. */
export const recentlyReauthed = () => Date.now() - useSession.getState().reauthAt < 5 * 60_000;

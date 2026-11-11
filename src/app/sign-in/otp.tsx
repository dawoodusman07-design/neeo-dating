import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api, ApiError, otpSchema } from '@/data';
import { useSession } from '@/stores/session';
import { purchases } from '@/services/purchases';
import { Button, Screen, Text, TextField, toast } from '@/ui';

export default function Otp() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone = '', resend = '30' } = useLocalSearchParams<{ phone: string; resend?: string }>();
  const signIn = useSession((s) => s.signIn);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(Number(resend));

  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const verify = async (value = code) => {
    if (!otpSchema.safeParse(value).success) return setError(t('auth.otpLabel'));
    setLoading(true);
    setError(undefined);
    try {
      const { userId, onboarded } = await api.auth.verifyOtp(phone, value);
      await purchases.init(userId).catch(() => {});
      signIn(userId, phone, onboarded);
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'otp_locked') return router.replace({ pathname: '/sign-in/locked', params: { sec: String(err.retryAfterSec ?? 900) } });
      if (err.code === 'expired_code') setError(t('auth.expired'));
      else setError(t('auth.wrongCode', { left: err.message?.includes('attempts') ? err.message : '' }).trim());
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      const r = await api.auth.sendOtp(phone);
      setLeft(r.resendInSec);
      toast(t('auth.codeSent'), 'success');
    } catch (e) {
      if ((e as ApiError).code === 'otp_locked') router.replace('/sign-in/locked');
    }
  };

  return (
    <Screen back footer={<Button title={t('auth.verify')} onPress={() => verify()} loading={loading} disabled={code.length !== 6} testID="verify-code" />}>
      <Text variant="title">{t('auth.otpTitle')}</Text>
      <Text color="textMuted">{t('auth.otpBody', { phone })}</Text>
      <TextField
        label={t('auth.otpLabel')}
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, '').slice(0, 6);
          setCode(digits);
          if (digits.length === 6) verify(digits);
        }}
        error={error}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        testID="otp-input"
        style={{ letterSpacing: 8 }}
      />
      {left > 0 ? (
        <Text color="textMuted" accessibilityLiveRegion="polite">
          {t('auth.resendIn', { sec: left })}
        </Text>
      ) : (
        <Button title={t('auth.resend')} variant="text" fullWidth={false} onPress={resendCode} style={{ alignSelf: 'flex-start' }} />
      )}
      <Button title={t('auth.changeNumber')} variant="text" fullWidth={false} onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
    </Screen>
  );
}

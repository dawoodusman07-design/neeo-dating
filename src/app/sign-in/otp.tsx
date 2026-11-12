import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { api, ApiError, otpSchema } from '@/data';
import { useSession } from '@/stores/session';
import { purchases } from '@/services/purchases';
import { Button, Card, Icon, Screen, Text, TextField, fromSchema, toast, useField } from '@/ui';

export default function Otp() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { phone = '', resend = '30' } = useLocalSearchParams<{ phone: string; resend?: string }>();
  const signIn = useSession((s) => s.signIn);
  const code = useField('', fromSchema(otpSchema));
  const [codeError, setCodeError] = useState<{ attempts?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(Number(resend));
  const [resendError, setResendError] = useState<string>();

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const verify = async (value = code.value) => {
    if (!otpSchema.safeParse(value).success) return code.check();
    setLoading(true);
    setCodeError(null);
    try {
      const { userId, onboarded } = await api.auth.verifyOtp(phone, value);
      await purchases.init(userId).catch(() => {});
      signIn(userId, phone, onboarded);
      if (onboarded) {
        const review = await api.me.review().catch(() => null);
        if (review && review.status !== 'active') useSession.getState().setStatus('underReview');
      }
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'otp_locked') return router.replace({ pathname: '/sign-in/locked', params: { sec: String(err.retryAfterSec ?? 900) } });
      if (err.code === 'expired_code') code.setServerError(tr('auth.expired'));
      else {
        const attempts = Number(/(\d+) attempts left/.exec(err.message ?? '')?.[1]);
        setCodeError({ attempts: Number.isFinite(attempts) ? attempts : undefined });
        code.setServerError(tr('auth.wrongCode', { left: '' }).trim());
      }
      code.setValue('');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResendError(undefined);
    try {
      const r = await api.auth.sendOtp(phone);
      setLeft(r.resendInSec);
      setCodeError(null);
      toast(tr('auth.codeSent'), 'success');
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'otp_locked') router.replace({ pathname: '/sign-in/locked', params: { sec: String(err.retryAfterSec ?? 900) } });
      else if (err.code === 'rate_limited') {
        setLeft(err.retryAfterSec ?? 600);
        setResendError(tr('auth.rateLimited', { min: Math.ceil((err.retryAfterSec ?? 600) / 60) }));
      } else setResendError(tr('common.genericError'));
    }
  };

  return (
    <Screen back footer={<Button title={tr('auth.verify')} onPress={() => verify()} loading={loading} disabled={code.value.length !== 6} testID="verify-code" />}>
      <Text variant="title">{tr('auth.otpTitle')}</Text>
      <Text color="textMuted">{tr('auth.otpBody', { phone })}</Text>
      {codeError ? (
        <Card tone="tint" accessibilityLiveRegion="assertive">
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <Icon name="error" color={t.c.danger} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {tr('auth.codeErrorTitle')}
            </Text>
          </View>
          <Text color="textMuted">{tr('auth.codeErrorBody')}</Text>
          {codeError.attempts !== undefined ? <Text variant="caption">{tr('auth.attemptsLeft', { count: codeError.attempts })}</Text> : null}
        </Card>
      ) : null}
      <TextField
        label={tr('auth.otpLabel')}
        {...code.props}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, '').slice(0, 6);
          code.props.onChangeText(digits);
          if (digits.length === 6) verify(digits);
        }}
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
          {tr('auth.resendIn', { sec: left })}
        </Text>
      ) : (
        <Button title={tr('auth.resend')} variant="text" fullWidth={false} onPress={resendCode} style={{ alignSelf: 'flex-start' }} testID="resend-code" />
      )}
      {resendError ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {resendError}
        </Text>
      ) : null}
      <Button title={tr('auth.changeNumber')} variant="text" fullWidth={false} onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
    </Screen>
  );
}

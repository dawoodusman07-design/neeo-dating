import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api, ApiError, phoneSchema } from '@/data';
import { Button, Screen, Text, TextField, fromSchema, useField } from '@/ui';

const clean = (v: string) => v.replace(/[\s()-]/g, '');

export default function Phone() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signIn = mode === 'signin';
  const phone = useField('', (v) => fromSchema(phoneSchema)(clean(v)));
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone.check()) return;
    setLoading(true);
    try {
      const { resendInSec } = await api.auth.sendOtp(clean(phone.value));
      router.push({ pathname: '/sign-in/otp', params: { phone: clean(phone.value), resend: String(resendInSec) } });
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'otp_locked') router.replace({ pathname: '/sign-in/locked', params: { sec: String(err.retryAfterSec ?? 900) } });
      else if (err.code === 'rate_limited') phone.setServerError(t('auth.rateLimited', { min: Math.ceil((err.retryAfterSec ?? 600) / 60) }));
      else phone.setServerError(err.code === 'offline' ? t('states.offline.body') : t('common.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen back footer={<Button title={signIn ? t('common.continue') : t('auth.sendCode')} onPress={submit} loading={loading} disabled={!phone.value} testID="send-code" />}>
      <Text variant="title">{signIn ? t('auth.signInTitle') : t('auth.phoneTitle')}</Text>
      <Text color="textMuted">{signIn ? t('auth.signInBody') : t('auth.phoneBody')}</Text>
      <TextField
        label={t('auth.phoneLabel')}
        hint={t('auth.phoneHint')}
        {...phone.props}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        placeholder={t('auth.phonePlaceholder')}
        autoFocus
        testID="phone-input"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
    </Screen>
  );
}

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api, ApiError, phoneSchema } from '@/data';
import { Button, Screen, Text, TextField } from '@/ui';

export default function Phone() {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsed = phoneSchema.safeParse(phone.replace(/[\s()-]/g, ''));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    setLoading(true);
    try {
      const { resendInSec } = await api.auth.sendOtp(parsed.data);
      router.push({ pathname: '/sign-in/otp', params: { phone: parsed.data, resend: String(resendInSec) } });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'otp_locked') router.replace({ pathname: '/sign-in/locked', params: { sec: String(e.retryAfterSec ?? 900) } });
      else setError(e instanceof ApiError && e.code === 'offline' ? t('states.offline.body') : t('common.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen back footer={<Button title={t('auth.sendCode')} onPress={submit} loading={loading} disabled={!phone} testID="send-code" />}>
      <Text variant="title">{t('auth.phoneTitle')}</Text>
      <Text color="textMuted">{t('auth.phoneBody')}</Text>
      <TextField
        label={t('auth.phoneLabel')}
        hint={t('auth.phoneHint')}
        value={phone}
        onChangeText={setPhone}
        error={error}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        placeholder="+1 416 555 0100"
        autoFocus
        testID="phone-input"
        onSubmitEditing={submit}
      />
    </Screen>
  );
}

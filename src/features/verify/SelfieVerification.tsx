import React, { useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Icon, Text, type IconName } from '@/ui';
import { api } from '@/data';
import { livenessVerifier, type LivenessResult } from '@/services/verification';

type Props = { onDone: (result: 'verified' | 'skipped' | 'pending') => void; allowSkip?: boolean };

export function SelfieVerification({ onDone, allowSkip = true }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<'intro' | 'camera' | 'checking' | LivenessResult['status']>('intro');
  const camera = useRef<CameraView>(null);

  const start = async () => {
    const p = permission?.granted ? permission : await requestPermission();
    if (!p.granted) return setPhase('failed');
    setPhase('camera');
  };

  const capture = async () => {
    setPhase('checking');
    try {
      const session = await livenessVerifier.start();
      const pic = await camera.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
      const result = await livenessVerifier.submit(session.id, pic?.uri ?? 'mock://selfie');
      if (result.status === 'verified') {
        await api.me.setVerified();
        qc.invalidateQueries({ queryKey: ['me'] });
      }
      setPhase(result.status);
    } catch {
      setPhase('retry');
    }
  };

  const benefits: [IconName, string][] = [
    ['discover', tr('onboarding.verifyBenefit1')],
    ['safety', tr('onboarding.verifyBenefit2')],
    ['photoPrivacy', tr('onboarding.verifyBenefit3')],
  ];

  if (phase === 'camera') {
    return (
      <View style={{ gap: t.space[4] }}>
        <View style={{ aspectRatio: 3 / 4, borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: t.c.tint }}>
          <CameraView ref={camera} facing="front" style={{ flex: 1 }} accessibilityLabel="Camera preview" />
        </View>
        <Button title={tr('onboarding.verifyStart')} icon="camera" onPress={capture} testID="verify-capture" />
      </View>
    );
  }

  const status: Record<string, { icon: IconName; text: string; tone: 'text' | 'success' | 'danger' }> = {
    checking: { icon: 'faceScan', text: tr('onboarding.verifyChecking'), tone: 'text' },
    verified: { icon: 'verified', text: tr('onboarding.verifySuccess'), tone: 'success' },
    retry: { icon: 'retry', text: tr('onboarding.verifyRetry'), tone: 'danger' },
    manual_review: { icon: 'time', text: tr('onboarding.verifyManual'), tone: 'text' },
    failed: { icon: 'error', text: permission && !permission.granted ? tr('onboarding.verifyCameraDenied') : tr('onboarding.verifyRetry'), tone: 'danger' },
  };
  const s = status[phase];

  return (
    <View style={{ gap: t.space[4] }}>
      <Card>
        {benefits.map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
            <Icon name={icon} color={t.c.brandDeep} />
            <Text style={{ flex: 1 }}>{text}</Text>
          </View>
        ))}
      </Card>
      {s ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
          <Icon name={s.icon} color={t.c[s.tone]} />
          <Text variant="bodyStrong" color={s.tone} style={{ flex: 1 }}>
            {s.text}
          </Text>
        </View>
      ) : null}
      {phase === 'verified' || phase === 'manual_review' ? (
        <Button title={tr('common.continue')} onPress={() => onDone(phase === 'verified' ? 'verified' : 'pending')} testID="verify-continue" />
      ) : (
        <>
          <Button title={tr('onboarding.verifyStart')} icon="faceScan" onPress={start} loading={phase === 'checking'} testID="verify-start" />
          {phase === 'failed' && permission && !permission.granted ? <Button title={tr('settings.openSettings')} variant="secondary" onPress={() => Linking.openSettings()} /> : null}
          {allowSkip ? <Button title={tr('common.skip')} variant="text" onPress={() => onDone('skipped')} testID="verify-skip" /> : null}
        </>
      )}
    </View>
  );
}

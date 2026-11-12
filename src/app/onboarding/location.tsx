import React, { useState } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, Text, TextField, fromSchema, useField } from '@/ui';
import { citySchema } from '@/data';
import { useTheme } from '@/theme';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

export default function LocationStep() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { city: saved, patch } = useOnboarding();
  const field = useField(saved ?? '', fromSchema(citySchema));
  const city = field.value;
  const setCity = field.setValue;
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const locate = async () => {
    setLoading(true);
    try {
      // "When In Use" only; coarse accuracy is enough and protects privacy.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setUnavailable(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      const found = place?.city ?? place?.subregion ?? place?.region ?? '';
      if (!found) return setUnavailable(true);
      setCity(found);
      patch({ city: found, locationGranted: true });
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step="location"
      title={tr('onboarding.locationTitle')}
      body={tr('onboarding.locationBody')}
      footer={
        <Button
          title={city.trim() ? tr('onboarding.useCity', { city: city.trim() }) : tr('common.continue')}
          testID="location-continue"
          onPress={() => {
            if (!field.check()) return;
            patch({ city: city.trim() });
            router.push(nextStep('location'));
          }}
        />
      }
    >
      <Button title={tr('onboarding.locationAllow')} icon="location" variant="secondary" onPress={locate} loading={loading} />
      {unavailable ? (
        <Card tone="tint" accessibilityLiveRegion="polite">
          <Icon name="info" color={t.c.brandDeep} />
          <Text variant="bodyStrong">{tr('onboarding.locationUnavailableTitle')}</Text>
          <Text color="textMuted">{tr('onboarding.locationUnavailableBody')}</Text>
        </Card>
      ) : null}
      <TextField label={tr('onboarding.cityLabel')} {...field.props} autoComplete="postal-address-locality" textContentType="addressCity" autoCapitalize="words" testID="city-input" />
    </OnboardingStep>
  );
}

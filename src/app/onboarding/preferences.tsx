import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Chip, FieldError, Stepper, Text } from '@/ui';
import type { Gender } from '@/data';
import { useOnboarding } from '@/stores/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { nextStep } from '@/features/onboarding/steps';

const GENDERS: Gender[] = ['woman', 'man', 'nonbinary'];

/** Package screen 10 "Who you meet". Same data as Settings → Preferences. */
export default function WhoYouMeet() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { prefs, patch } = useOnboarding();
  const [error, setError] = useState<string>();
  const set = (p: Partial<typeof prefs>) => patch({ prefs: { ...prefs, ...p } });
  const next = () => {
    if (prefs.genders.length === 0) return setError(tr('onboarding.prefsWhoRequired'));
    router.push(nextStep('preferences'));
  };
  return (
    <OnboardingStep step="preferences" title={tr('onboarding.prefsTitle')} body={tr('onboarding.prefsBody')} footer={<Button title={tr('common.continue')} onPress={next} testID="prefs-continue" />}>
      <Card>
        <Text variant="caption" color="textMuted" accessibilityRole="header">
          {tr('onboarding.prefsWho')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {GENDERS.map((g) => (
            <Chip
              key={g}
              label={tr(`onboarding.gender_${g}`)}
              selected={prefs.genders.includes(g)}
              onPress={() => {
                setError(undefined);
                set({ genders: prefs.genders.includes(g) ? prefs.genders.filter((x) => x !== g) : [...prefs.genders, g] });
              }}
            />
          ))}
        </View>
        <FieldError message={error} />
      </Card>
      <Card>
        <Text variant="caption" color="textMuted">
          {tr('settings.ageRange')}
        </Text>
        <Stepper label="Minimum age" value={prefs.ageMin} min={18} max={prefs.ageMax} onChange={(v) => set({ ageMin: v })} />
        <Stepper label="Maximum age" value={prefs.ageMax} min={prefs.ageMin} max={80} onChange={(v) => set({ ageMax: v })} />
      </Card>
      <Card>
        <Stepper label={tr('settings.maxDistance')} value={prefs.maxKm} min={5} max={150} step={5} suffix=" km" onChange={(v) => set({ maxKm: v })} />
      </Card>
    </OnboardingStep>
  );
}

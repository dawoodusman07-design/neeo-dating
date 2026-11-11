import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button, Card, Chip, IconButton, ListGroup, ListRow, Screen, Text } from '@/ui';
import type { Intention } from '@/data';
import { useSession } from '@/stores/session';

function Stepper({ label, value, onChange, min, max, step = 1, suffix = '' }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min, max, now: value, text: `${value}${suffix}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === 'increment' ? step : -step))))}>
      <Text style={{ flex: 1 }}>{label}</Text>
      <IconButton icon="dash" label={`Decrease ${label}`} variant="surface" size={36} disabled={value <= min} onPress={() => onChange(value - step)} />
      <Text variant="bodyStrong" style={{ minWidth: 56, textAlign: 'center' }}>{`${value}${suffix}`}</Text>
      <IconButton icon="add" label={`Increase ${label}`} variant="surface" size={36} disabled={value >= max} onPress={() => onChange(value + step)} />
    </View>
  );
}

export default function Preferences() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const isPlus = useSession((s) => s.isPlus);
  const [minAge, setMinAge] = useState(24);
  const [maxAge, setMaxAge] = useState(34);
  const [distance, setDistance] = useState(25);
  const [intentions, setIntentions] = useState<Intention[]>(['long_term', 'life_partner']);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  return (
    <Screen title={tr('settings.prefsTitle')} back footer={<Button title={tr('common.save')} onPress={() => router.back()} />}>
      <Card>
        <Text variant="caption" color="textMuted">{tr('settings.ageRange')}</Text>
        <Stepper label="Minimum age" value={minAge} min={18} max={maxAge} onChange={setMinAge} />
        <Stepper label="Maximum age" value={maxAge} min={minAge} max={80} onChange={setMaxAge} />
      </Card>
      <Card>
        <Stepper label={tr('settings.maxDistance')} value={distance} min={5} max={150} step={5} suffix=" km" onChange={setDistance} />
      </Card>
      <Card>
        <Text variant="caption" color="textMuted">{tr('settings.intentions')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {(['long_term', 'life_partner', 'figuring_out'] as Intention[]).map((i) => (
            <Chip key={i} label={tr(`intention.${i}`)} selected={intentions.includes(i)} onPress={() => setIntentions((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))} />
          ))}
        </View>
      </Card>
      <ListGroup footer={isPlus ? undefined : `${tr('plus.f4')} · ${tr('common.plusBadge')}`}>
        <ListRow icon="verified" title={tr('settings.verifiedOnly')} toggle={{ value: verifiedOnly, onValueChange: setVerifiedOnly, disabled: !isPlus }} />
        {!isPlus ? <ListRow icon="plus" title={tr('you.plus')} onPress={() => router.push('/plus')} /> : null}
      </ListGroup>
    </Screen>
  );
}

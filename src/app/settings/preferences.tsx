import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Chip, FieldError, ListGroup, ListRow, Screen, Stepper, Text, TextField, toast, useField } from '@/ui';
import { api, type Gender, type Intention, type Preferences } from '@/data';
import { qk } from '@/data/hooks';
import { useSession } from '@/stores/session';
import { useLocal } from '@/stores/local';

const GENDERS: Gender[] = ['woman', 'man', 'nonbinary'];
const INTENTIONS: Intention[] = ['long_term', 'life_partner', 'figuring_out'];

/** Preferences ("Who you meet"), saved to the backend and applied to daily introductions. Presets are a Plus convenience. */
export default function PreferencesScreen() {
  const q = useQuery({ queryKey: ['preferences'], queryFn: api.me.preferences });
  return q.data ? <Form initial={q.data} /> : <Screen title="" back>{null}</Screen>;
}

function Form({ initial }: { initial: Preferences }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const isPlus = useSession((s) => s.isPlus);
  const { presets, addPreset, removePreset } = useLocal();
  const [p, setP] = useState<Preferences>(initial);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const presetName = useField('', (v) => (v.trim().length < 2 ? 'Name your preset' : v.length > 30 ? 'Keep it under 30 characters' : undefined));
  const set = (patch: Partial<Preferences>) => setP((x) => ({ ...x, ...patch }));
  const toggle = <K,>(list: K[], k: K) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const save = async () => {
    if (!p.genders.length || !p.intentions.length) return setError(tr('onboarding.prefsWhoRequired'));
    setSaving(true);
    try {
      await api.me.setPreferences(p);
      await qc.invalidateQueries({ queryKey: ['preferences'] });
      await qc.invalidateQueries({ queryKey: qk.intros });
      toast(tr('common.done'), 'success');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={tr('settings.prefsTitle')} back footer={<Button title={tr('common.save')} onPress={save} loading={saving} testID="prefs-save" />}>
      <Text color="textMuted">{tr('onboarding.prefsBody')}</Text>
      <Card>
        <Text variant="caption" color="textMuted" accessibilityRole="header">{tr('onboarding.prefsWho')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {GENDERS.map((g) => (
            <Chip key={g} label={tr(`onboarding.gender_${g}`)} selected={p.genders.includes(g)} onPress={() => { setError(undefined); set({ genders: toggle(p.genders, g) }); }} />
          ))}
        </View>
      </Card>
      <Card>
        <Text variant="caption" color="textMuted">{tr('settings.ageRange')}</Text>
        <Stepper label="Minimum age" value={p.ageMin} min={18} max={p.ageMax} onChange={(v) => set({ ageMin: v })} />
        <Stepper label="Maximum age" value={p.ageMax} min={p.ageMin} max={80} onChange={(v) => set({ ageMax: v })} />
      </Card>
      <Card>
        <Stepper label={tr('settings.maxDistance')} value={p.maxKm} min={5} max={150} step={5} suffix=" km" onChange={(v) => set({ maxKm: v })} />
      </Card>
      <Card>
        <Text variant="caption" color="textMuted">{tr('settings.intentions')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {INTENTIONS.map((i) => (
            <Chip key={i} label={tr(`intention.${i}`)} selected={p.intentions.includes(i)} onPress={() => { setError(undefined); set({ intentions: toggle(p.intentions, i) }); }} />
          ))}
        </View>
      </Card>
      <FieldError message={error} />
      <ListGroup footer={isPlus ? undefined : `${tr('plus.f4')} · ${tr('common.plusBadge')}`}>
        <ListRow icon="verified" title={tr('settings.verifiedOnly')} toggle={{ value: p.verifiedOnly, onValueChange: (v) => set({ verifiedOnly: v }), disabled: !isPlus }} />
      </ListGroup>
      <ListGroup title={tr('plus.f6')} footer={isPlus ? undefined : tr('common.plusBadge')}>
        {presets.map((pr) => (
          <ListRow key={pr.id} title={pr.name} value={tr('common.edit')} onPress={() => setP(pr.prefs)} />
        ))}
        {isPlus ? (
          <View style={{ padding: t.space[4], gap: t.space[2] }}>
            <TextField label="Preset name" {...presetName.props} maxLength={30} autoComplete="off" />
            <Button title={tr('common.save')} variant="secondary" onPress={() => { if (presetName.check()) { addPreset(presetName.value.trim(), p); presetName.reset(''); } }} />
            {presets.length ? <Button title="Remove last preset" variant="text" onPress={() => removePreset(presets[presets.length - 1]!.id)} /> : null}
          </View>
        ) : (
          <ListRow icon="plus" title={tr('you.plus')} onPress={() => router.push('/plus')} />
        )}
      </ListGroup>
    </Screen>
  );
}

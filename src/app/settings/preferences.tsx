import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Chip, FieldError, IconButton, ListGroup, ListRow, Screen, Stepper, Text, TextField, fromSchema, toast, useField } from '@/ui';
import { api, ApiError, citySchema, type Gender, type Intention, type Preferences } from '@/data';
import { qk, usePresets } from '@/data/hooks';
import { useSession } from '@/stores/session';

const GENDERS: Gender[] = ['woman', 'man', 'nonbinary'];
const INTENTIONS: Intention[] = ['long_term', 'life_partner', 'figuring_out'];

/**
 * Preferences ("Who you meet"): saved to the backend and applied to daily introductions.
 * Neeo Plus adds advanced filters, travel mode and saved presets — enforced server-side
 * (preferences_plus_guard). Free users can switch Plus features off but not on.
 */
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
  const presets = usePresets();
  const [p, setP] = useState<Preferences>(initial);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const travel = useField(initial.travelCity ?? '', fromSchema(citySchema));
  const presetName = useField('', (v) => (v.trim().length < 2 || v.length > 30 ? tr('settings.presetNameError') : undefined));
  const set = (patch: Partial<Preferences>) => setP((x) => ({ ...x, ...patch }));
  const toggle = <K,>(list: K[], k: K) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
  /** A Plus control is usable with Plus, or (without Plus) only to switch it off. */
  const plusControl = (on: boolean) => isPlus || on;

  const build = (): Preferences | null => {
    if (!p.genders.length || !p.intentions.length) {
      setError(tr('onboarding.prefsWhoRequired'));
      return null;
    }
    if (p.travelCity !== null && !travel.check()) return null;
    return { ...p, travelCity: p.travelCity !== null ? travel.value.trim() : null };
  };

  const save = async () => {
    const next = build();
    if (!next) return;
    setSaving(true);
    try {
      await api.me.setPreferences(next);
      await qc.invalidateQueries({ queryKey: ['preferences'] });
      await qc.invalidateQueries({ queryKey: qk.intros });
      toast(tr('common.done'), 'success');
      router.back();
    } catch (e) {
      setError((e as ApiError).code === 'plus_required' ? tr('settings.plusRequired') : tr('common.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const savePreset = async () => {
    const next = build();
    if (!next || !presetName.check()) return;
    try {
      await api.me.savePreset(presetName.value.trim(), next);
      presetName.reset('');
      await qc.invalidateQueries({ queryKey: ['presets'] });
    } catch (e) {
      presetName.setServerError((e as ApiError).code === 'plus_required' ? tr('settings.plusRequired') : tr('common.genericError'));
    }
  };

  const lapsed = !isPlus && (initial.verifiedOnly || initial.voiceOnly || !!initial.travelCity);

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

      {/* ---- Neeo Plus ---- */}
      {lapsed ? (
        <Card tone="tint">
          <Text>{tr('settings.plusLapsed')}</Text>
        </Card>
      ) : null}
      <ListGroup title={`${tr('settings.advancedFilters')} · ${tr('common.plusBadge')}`} footer={isPlus ? undefined : tr('settings.plusOnly')}>
        <ListRow icon="verified" title={tr('settings.verifiedOnly')} toggle={{ value: p.verifiedOnly, onValueChange: (v) => set({ verifiedOnly: v }), disabled: !plusControl(p.verifiedOnly) }} testID="pref-verified" />
        <ListRow icon="mic" title={tr('settings.voiceOnly')} toggle={{ value: p.voiceOnly, onValueChange: (v) => set({ voiceOnly: v }), disabled: !plusControl(p.voiceOnly) }} testID="pref-voice" />
      </ListGroup>
      <ListGroup title={`${tr('settings.travelMode')} · ${tr('common.plusBadge')}`} footer={tr('settings.travelModeSub')}>
        <ListRow icon="region" title={tr('settings.travelMode')} toggle={{ value: p.travelCity !== null, onValueChange: (v) => set({ travelCity: v ? travel.value : null }), disabled: !plusControl(p.travelCity !== null) }} testID="pref-travel" />
        {p.travelCity !== null ? (
          <View style={{ padding: t.space[4] }}>
            <TextField label={tr('settings.travelCity')} {...travel.props} autoComplete="postal-address-locality" textContentType="addressCity" autoCapitalize="words" editable={isPlus} testID="travel-city" />
          </View>
        ) : null}
      </ListGroup>
      <ListGroup title={`${tr('settings.presetsTitle')} · ${tr('common.plusBadge')}`}>
        {(presets.data ?? []).map((pr) => (
          <View key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', paddingStart: t.space[4], paddingEnd: t.space[2], minHeight: 56 }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>{pr.name}</Text>
            <Button title={tr('settings.presetApply')} variant="text" fullWidth={false} onPress={() => { setP(pr.prefs); travel.setValue(pr.prefs.travelCity ?? ''); }} />
            <IconButton icon="delete" label={tr('settings.presetRemove', { name: pr.name })} onPress={async () => { await api.me.deletePreset(pr.id); qc.invalidateQueries({ queryKey: ['presets'] }); }} />
          </View>
        ))}
        {isPlus ? (
          <View style={{ padding: t.space[4], gap: t.space[2] }}>
            <TextField label={tr('settings.presetName')} {...presetName.props} maxLength={30} autoComplete="off" testID="preset-name" />
            <Button title={tr('settings.presetSave')} variant="secondary" onPress={savePreset} testID="preset-save" />
          </View>
        ) : (
          <ListRow icon="plus" title={tr('you.plus')} subtitle={tr('settings.plusOnly')} onPress={() => router.push('/plus')} testID="prefs-plus" />
        )}
      </ListGroup>
    </Screen>
  );
}

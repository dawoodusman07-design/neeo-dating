import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, EmptyState, Icon, Screen, Segmented, Text } from '@/ui';
import { useLocal } from '@/stores/local';

/** Saved profiles + saved date plans (from name only). Stored on this device. */
export default function Saved() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<'profiles' | 'plans'>('profiles');
  const { savedProfiles, plans, unsaveProfile, removePlan } = useLocal();
  const profiles = Object.values(savedProfiles).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return (
    <Screen title={tr('saved.title')} back>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'profiles', label: `${tr('saved.profiles')} · ${profiles.length}` }, { key: 'plans', label: `${tr('saved.plans')} · ${plans.length}` }]} />
      {tab === 'profiles' ? (
        profiles.length === 0 ? (
          <EmptyState icon="save" title={tr('saved.profiles')} body={tr('saved.profilesEmpty')} />
        ) : (
          profiles.map((p) => (
            <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={p.photos[0]?.uri} name={p.firstName} size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{`${p.firstName}, ${p.age}`}</Text>
                <Text variant="caption" color="textMuted">{p.city}</Text>
              </View>
              <Button title={tr('chat.viewProfile')} variant="text" fullWidth={false} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id, from: 'discover' } })} />
              <Button title={tr('saved.remove')} variant="text" fullWidth={false} accessibilityLabel={`${tr('saved.remove')} ${p.firstName}`} onPress={() => unsaveProfile(p.id)} />
            </Card>
          ))
        )
      ) : plans.length === 0 ? (
        <EmptyState icon="dateIdea" title={tr('saved.plans')} body={tr('saved.plansEmpty')} />
      ) : (
        plans.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
              <Icon name="dateIdea" color={t.c.action} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>{p.idea}</Text>
            </View>
            <Text color="textMuted">{[tr('saved.with', { name: p.name }), p.when, p.place].filter(Boolean).join(' · ')}</Text>
            <View style={{ flexDirection: 'row', gap: t.space[2] }}>
              <Button title={tr('chat.viewProfile')} variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: p.matchId } })} />
              <Button title={tr('saved.remove')} variant="text" style={{ flex: 1 }} onPress={() => removePlan(p.id)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

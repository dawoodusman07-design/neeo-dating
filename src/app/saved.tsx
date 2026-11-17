import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, EmptyState, Icon, Screen, Segmented, Text } from '@/ui';
import { api } from '@/data';
import { useDatePlans, useSavedProfiles, useToggleSaved } from '@/data/hooks';

/** Saved profiles + saved date plans. Synced to your account (owner-only RLS). */
export default function Saved() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'profiles' | 'plans'>('profiles');
  const profiles = useSavedProfiles().data ?? [];
  const plans = useDatePlans().data ?? [];
  const toggle = useToggleSaved();
  return (
    <Screen title={tr('saved.title')} back>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'profiles', label: `${tr('saved.profiles')} · ${profiles.length}` }, { key: 'plans', label: `${tr('saved.plans')} · ${plans.length}` }]} />
      {tab === 'profiles' ? (
        profiles.length === 0 ? (
          <EmptyState icon="save" title={tr('saved.profiles')} body={tr('saved.profilesEmpty')} />
        ) : (
          profiles.map(({ profile: p }) => (
            <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }} testID={`saved-${p.firstName}`}>
              <Avatar uri={p.photos[0]?.uri} name={p.firstName} size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{`${p.firstName}, ${p.age}`}</Text>
                <Text variant="caption" color="textMuted">{p.city}</Text>
              </View>
              <Button title={tr('chat.viewProfile')} variant="text" fullWidth={false} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id, from: 'discover' } })} />
              <Button title={tr('saved.remove')} variant="text" fullWidth={false} accessibilityLabel={`${tr('saved.remove')} ${p.firstName}`} onPress={() => toggle.mutate({ profileId: p.id, saved: true })} />
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
              {p.matchId ? <Button title={tr('chats.title')} variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: p.matchId! } })} /> : null}
              <Button
                title={tr('saved.remove')}
                variant="text"
                style={{ flex: 1 }}
                onPress={async () => {
                  await api.saved.removePlan(p.id);
                  qc.invalidateQueries({ queryKey: ['saved', 'plans'] });
                }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { Button, Card, Chip, ListGroup, ListRow, ProfilePhoto, Screen, Text, TextField, toast } from '@/ui';
import { api, type Intention, type MyProfile } from '@/data';
import { useMe } from '@/data/hooks';
import { DATE_IDEAS } from '@/features/onboarding/steps';

export default function EditProfile() {
  const me = useMe();
  return me.data ? <EditForm me={me.data} /> : <Screen title="" back>{null}</Screen>;
}

function EditForm({ me }: { me: MyProfile }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState(me.firstName);
  const [pronouns, setPronouns] = useState(me.pronouns ?? '');
  const [intention, setIntention] = useState<Intention>(me.intention);
  const [ideas, setIdeas] = useState<string[]>(me.dateIdeas);
  const [basics, setBasics] = useState(me.basics.join(', '));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await api.me.update({ firstName: name.trim(), pronouns: pronouns.trim(), intention, dateIdeas: ideas, basics: basics.split(',').map((b) => b.trim()).filter(Boolean) });
    await qc.invalidateQueries({ queryKey: ['me'] });
    setSaving(false);
    toast(tr('common.done'), 'success');
    router.back();
  };

  return (
    <Screen title={tr('settings.editTitle')} back footer={<Button title={tr('common.save')} onPress={save} loading={saving} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
        {me.photos.map((p, i) => (
          <View key={p.id} style={{ width: '31%' }}>
            <ProfilePhoto uri={p.uri} pending={p.status === 'pending'} label={`Your photo ${i + 1}`} radius={t.radius.sm} />
          </View>
        ))}
      </View>
      <TextField label={tr('onboarding.nameLabel')} value={name} onChangeText={setName} />
      <TextField label={tr('onboarding.pronounsLabel')} value={pronouns} onChangeText={setPronouns} />
      <ListGroup title={tr('onboarding.intentionTitle')}>
        {(['long_term', 'life_partner', 'figuring_out'] as Intention[]).map((i) => (
          <ListRow key={i} title={tr(`intention.${i}`)} selected={intention === i} onPress={() => setIntention(i)} />
        ))}
      </ListGroup>
      <TextField label={tr('profile.basics')} hint="Comma-separated, e.g. 5′9″, Teacher, Doesn’t drink" value={basics} onChangeText={setBasics} />
      <Card>
        <Text variant="caption" color="textMuted">{tr('onboarding.dateIdeasTitle')} · {ideas.length}/3</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          {DATE_IDEAS.map((d) => (
            <Chip key={d} label={d} selected={ideas.includes(d)} disabled={!ideas.includes(d) && ideas.length >= 3} onPress={() => setIdeas((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]))} />
          ))}
        </View>
      </Card>
      {me.prompts.map((p) => (
        <Card key={p.id}>
          <Text variant="caption" color="textMuted">{p.question}</Text>
          <Text>{p.answer}</Text>
        </Card>
      ))}
    </Screen>
  );
}

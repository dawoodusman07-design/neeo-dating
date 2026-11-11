import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Icon, ListGroup, ListRow, Screen, Text, TextField, toast } from '@/ui';
import { api, phoneSchema } from '@/data';
import { useMatch } from '@/data/hooks';
import { links, openLink } from '@/lib/links';
import { formatTime } from '@/lib/time';

const OFFSETS = [1, 2, 3]; // hours after start

export default function DateCheckIn() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = useMatch(matchId);
  const [place, setPlace] = useState('');
  const [startsIn, setStartsIn] = useState('2'); // hours from now (simple, accessible input)
  const [after, setAfter] = useState(2);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [share, setShare] = useState(true);
  const [chaperone, setChaperone] = useState(false);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const name = match.data?.profile.firstName ?? '';

  const schedule = async () => {
    const phone = phoneSchema.safeParse(contactPhone.replace(/[\s()-]/g, ''));
    if (!phone.success) return setError(phone.error.issues[0]?.message);
    setLoading(true);
    const startsAt = new Date(Date.now() + Number(startsIn || 0) * 3600_000);
    const checkInAt = new Date(startsAt.getTime() + after * 3600_000);
    try {
      await api.safety.createCheckIn({ matchId, place: place.trim(), startsAt: startsAt.toISOString(), checkInAt: checkInAt.toISOString(), contact: { name: contactName.trim(), phone: phone.data } });
      if (chaperone) await api.me.update({ chaperoneEnabled: true });
      toast(tr('checkIn.scheduled', { time: formatTime(checkInAt.toISOString()) }), 'success');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const items = [tr('checkIn.check1'), tr('checkIn.check2'), tr('checkIn.check3'), tr('checkIn.check4')];

  return (
    <Screen
      title={tr('checkIn.title')}
      back
      footer={<Button title={tr('checkIn.schedule')} onPress={schedule} loading={loading} disabled={!place.trim() || !contactName.trim() || !contactPhone} testID="checkin-schedule" />}
    >
      <Card>
        <Text variant="caption" color="textMuted">{tr('checkIn.summary')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
          <Avatar uri={match.data?.profile.photos[0]?.uri} name={name || '?'} size={48} />
          <Text variant="heading">{tr('checkIn.with', { name })}</Text>
        </View>
        <TextField label={tr('checkIn.place')} value={place} onChangeText={setPlace} placeholder="Café on Queen St W" />
        <TextField label={`${tr('checkIn.when')} (hours from now)`} value={startsIn} onChangeText={(v) => setStartsIn(v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" />
      </Card>

      <ListGroup title={tr('checkIn.contact')}>
        <View style={{ padding: t.space[4], gap: t.space[3] }}>
          <TextField label={tr('checkIn.contactName')} value={contactName} onChangeText={setContactName} autoComplete="name" />
          <TextField label={tr('checkIn.contactPhone')} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" error={error} placeholder="+1 416 555 0100" />
        </View>
        <ListRow title={tr('checkIn.share', { name })} toggle={{ value: share, onValueChange: setShare }} />
      </ListGroup>

      <ListGroup title={tr('checkIn.checkInAfter')} footer={tr('checkIn.escalate')}>
        {OFFSETS.map((h) => (
          <ListRow key={h} title={`${h} hour${h > 1 ? 's' : ''}`} selected={after === h} onPress={() => setAfter(h)} />
        ))}
      </ListGroup>

      <ListGroup>
        <ListRow icon="chaperone" title={tr('checkIn.chaperone')} toggle={{ value: chaperone, onValueChange: setChaperone }} />
      </ListGroup>

      <ListGroup title={tr('checkIn.checklist')}>
        {items.map((label, i) => (
          <ListRow
            key={label}
            title={label}
            icon={checks[i] ? 'check' : 'dash'}
            onPress={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
            accessibilityHint={checks[i] ? 'Checked' : 'Not checked'}
          />
        ))}
      </ListGroup>
      <Button title={tr('checkIn.guide')} variant="text" icon="safety" onPress={() => openLink(links.safety)} />
      <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
        <Icon name="info" color={t.c.textMuted} />
        <Text variant="small" color="textMuted" style={{ flex: 1 }}>{tr('settings.emergency')}</Text>
      </View>
    </Screen>
  );
}

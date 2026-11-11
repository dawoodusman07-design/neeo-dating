import React, { useState } from 'react';
import { View } from 'react-native';
import { ThemeProvider, useTheme } from '@/theme';
import {
  Avatar, Button, Card, Chip, EmptyState, ErrorState, IconButton, ListGroup, ListRow, ProfilePhoto, ProgressBar, Screen,
  Segmented, Sheet, Text, TextField, Toggle, VerifiedBadge, toast, Icons, Icon, type IconName,
} from '@/ui';

const PHOTO = 'https://images.unsplash.com/photo-1742971171873-b386b69ee8a6?auto=format&fit=crop&w=600&q=70';

function Gallery() {
  const t = useTheme();
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState(true);
  return (
    <View style={{ backgroundColor: t.c.bg, padding: t.space[4], gap: t.space[4], borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.c.border }}>
      <Text variant="heading">{t.scheme === 'dark' ? 'Dark theme' : 'Light theme'}</Text>
      <Text variant="display">Display 30</Text>
      <Text variant="title">Title 26</Text>
      <Text variant="body">Body 15 — the quick brown fox.</Text>
      <Text variant="caption" color="textMuted">Caption muted</Text>
      <Button title="Primary" onPress={() => toast('Primary pressed')} />
      <Button title="Primary loading" loading />
      <Button title="Primary disabled" disabled />
      <Button title="Secondary" variant="secondary" icon="dateIdea" />
      <Button title="Text button" variant="text" />
      <Button title="Danger" variant="danger" />
      <View style={{ flexDirection: 'row', gap: t.space[2], flexWrap: 'wrap' }}>
        <IconButton icon="pass" label="Pass" variant="surface" size={56} />
        <IconButton icon="send" label="Send" variant="action" />
        <IconButton icon="send" label="Send (disabled)" variant="action" disabled />
        <View style={{ backgroundColor: t.c.brandDeep, padding: 4, borderRadius: 24 }}>
          <IconButton icon="save" label="Save" variant="onPhoto" selected />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: t.space[2], flexWrap: 'wrap' }}>
        <Chip label="Long-term" icon="likes" />
        <Chip label="Selected" selected={selected} onPress={() => setSelected(!selected)} />
        <Chip label="Disabled" disabled onPress={() => {}} />
        <VerifiedBadge />
      </View>
      <Segmented value={seg} onChange={setSeg} options={[{ key: 'a', label: 'Liked you' }, { key: 'b', label: 'Sent' }]} />
      <ListGroup title="List rows">
        <ListRow icon="photoPrivacy" title="Navigates" subtitle="With subtitle" onPress={() => {}} />
        <ListRow icon="notifications" title="Toggle" toggle={{ value: on, onValueChange: setOn }} />
        <ListRow title="Radio selected" selected onPress={() => {}} />
        <ListRow icon="delete" title="Destructive" destructive onPress={() => {}} />
        <ListRow title="Disabled" disabled onPress={() => {}} />
      </ListGroup>
      <Toggle label="Standalone toggle" value={on} onValueChange={setOn} />
      <TextField label="Text field" placeholder="Placeholder" hint="Helper text" />
      <TextField label="With error" value="abc" error="Enter the 6-digit code" />
      <TextField label="Disabled" value="Read only" editable={false} />
      <ProgressBar value={0.66} label="Progress" />
      <ProgressBar value={2 / 3} segments={3} label="Photo 2 of 3" />
      <Card><Text>Card (surface)</Text></Card>
      <Card tone="tint"><Text>Card (tint)</Text></Card>
      <View style={{ flexDirection: 'row', gap: t.space[3] }}>
        <View style={{ flex: 1 }}><ProfilePhoto uri={PHOTO} label="Clear photo" /></View>
        <View style={{ flex: 1 }}><ProfilePhoto uri={PHOTO} label="Blurred photo" blurred /></View>
        <View style={{ flex: 1 }}><ProfilePhoto uri={PHOTO} label="Pending photo" pending /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: t.space[2] }}>
        <Avatar uri={PHOTO} name="Maya" />
        <Avatar name="Omar" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
        {(Object.keys(Icons) as IconName[]).map((n) => (
          <View key={n} style={{ alignItems: 'center', width: 64 }} accessible accessibilityLabel={n}>
            <Icon name={n} />
            <Text variant="small" color="textMuted" numberOfLines={1}>{n}</Text>
          </View>
        ))}
      </View>
      <Button title="Open sheet" variant="secondary" onPress={() => setSheet(true)} />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Sheet">
        <Text>Bottom sheet content.</Text>
      </Sheet>
      <View style={{ height: 320 }}>
        <EmptyState icon="time" title="Empty state" body="One sentence that explains what happened." action={{ title: 'Primary action', onPress: () => {} }} />
      </View>
      <View style={{ height: 320 }}>
        <ErrorState title="Error state" body="Something went wrong. Try again." action={{ title: 'Try again', onPress: () => {} }} />
      </View>
    </View>
  );
}

/** Every component in every state, in light and dark. */
export default function Components() {
  return (
    <Screen title="Components" back>
      <ThemeProvider forceScheme="light">
        <Gallery />
      </ThemeProvider>
      <ThemeProvider forceScheme="dark">
        <Gallery />
      </ThemeProvider>
    </Screen>
  );
}

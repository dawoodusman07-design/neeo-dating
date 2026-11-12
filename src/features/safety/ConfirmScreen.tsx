import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Avatar, Button, Card, Icon, Screen, Text, type IconName } from '@/ui';

type Props = {
  icon: IconName;
  title: string;
  /** Lines from the package body; each is shown as its own sentence row. */
  lines: string[];
  cta: string;
  destructive?: boolean;
  avatar?: { uri?: string; name: string };
  onConfirm: () => Promise<void>;
  secondary?: { title: string; onPress: () => void };
  testID?: string;
};

/** Full-screen confirmation used for block, unblock, end connection, photo requests and sharing. */
export function ConfirmScreen({ icon, title, lines, cta, destructive, avatar, onConfirm, secondary, testID }: Props) {
  const t = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      close={() => router.back()}
      footer={
        <>
          <Button
            title={cta}
            variant={destructive ? 'danger' : 'primary'}
            loading={busy}
            testID={testID}
            onPress={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          />
          {secondary ? <Button title={secondary.title} variant="text" onPress={secondary.onPress} /> : null}
          <Button title="Cancel" variant="text" onPress={() => router.back()} />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: t.space[3], paddingTop: t.space[4] }}>
        {avatar ? (
          <Avatar uri={avatar.uri} name={avatar.name} size={72} />
        ) : (
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.c.chip, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={32} color={destructive ? t.c.danger : t.c.brandDeep} />
          </View>
        )}
        <Text variant="title" align="center">
          {title}
        </Text>
      </View>
      <Card>
        {lines.map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: t.space[2] }}>
            <Icon name="check" size={18} color={t.c.brandDeep} />
            <Text style={{ flex: 1 }}>{l}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

/** Split a package-style body ("A. B. C.") into sentence lines. */
export const sentences = (s: string) => s.match(/[^.!?]+[.!?]+/g)?.map((x) => x.trim()) ?? [s];

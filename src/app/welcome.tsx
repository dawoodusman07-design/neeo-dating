import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Icon, Text, type IconName } from '@/ui';
import { links, openLink } from '@/lib/links';

const HERO = 'https://images.unsplash.com/photo-1790271478791-f98675a9e3f3?auto=format&fit=crop&w=1000&q=75';

export default function Welcome() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trust: [IconName, string][] = [
    ['verified', tr('welcome.trust1')],
    ['photoPrivacy', tr('welcome.trust2')],
    ['time', tr('welcome.trust3')],
  ];
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <View style={{ height: '42%' }}>
        <Image source={{ uri: HERO }} style={{ flex: 1 }} contentFit="cover" accessibilityLabel={tr('welcome.heroAlt')} />
        <View style={{ position: 'absolute', top: insets.top + t.space[3], start: t.space[4], backgroundColor: t.c.scrim, borderRadius: t.radius.pill, paddingHorizontal: t.space[4], paddingVertical: t.space[1] }}>
          <Text variant="heading" color="onPhoto" accessibilityRole="header" accessibilityLabel="Neeo">
            neeo
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, padding: t.space[6], gap: t.space[4], justifyContent: 'space-between', paddingBottom: insets.bottom + t.space[4] }}>
        <View style={{ gap: t.space[3] }}>
          <Text variant="display">{tr('welcome.headline')}</Text>
          <Text color="textMuted">{tr('welcome.sub')}</Text>
          <View style={{ gap: t.space[2], marginTop: t.space[2] }}>
            {trust.map(([icon, label]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }} accessible accessibilityLabel={label}>
                <Icon name={icon} color={t.c.brandDeep} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ gap: t.space[2] }}>
          <Button title={tr('welcome.create')} onPress={() => router.push('/sign-in/phone')} testID="create-account" />
          <Button title={tr('welcome.signIn')} variant="text" onPress={() => router.push({ pathname: '/sign-in/phone', params: { mode: 'signin' } })} />
          <Text variant="small" color="textMuted" align="center">
            <Trans
              i18nKey="welcome.legal"
              components={{
                terms: <Text variant="small" color="action" accessibilityRole="link" onPress={() => openLink(links.terms)} style={{ textDecorationLine: 'underline' }} />,
                privacy: <Text variant="small" color="action" accessibilityRole="link" onPress={() => openLink(links.privacy)} style={{ textDecorationLine: 'underline' }} />,
              }}
            />
          </Text>
        </View>
      </View>
    </View>
  );
}

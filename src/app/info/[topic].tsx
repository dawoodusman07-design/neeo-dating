import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, Text } from '@/ui';
import { links, openLink } from '@/lib/links';

const FULL: Record<string, string | undefined> = {
  community: links.community,
  'privacy-summary': links.privacy,
  'subscription-terms': links.terms,
  safety: links.safety,
};

/**
 * In-app information pages (from name only): about, matching, photo-privacy, plus-faq,
 * safety, community, privacy-summary, subscription-terms, refunds. Copy lives in i18n.
 */
export default function Info() {
  const { t } = useTranslation();
  const { topic = 'about' } = useLocalSearchParams<{ topic: string }>();
  const sections = t(`info.${topic}.sections`, { returnObjects: true }) as unknown;
  const list = Array.isArray(sections) ? (sections as [string, string][]) : [];
  const full = FULL[topic];
  return (
    <Screen title={t(`info.${topic}.title`)} back>
      {list.map(([h, b]) => (
        <Card key={h}>
          <Text variant="heading">{h}</Text>
          <Text>{b}</Text>
        </Card>
      ))}
      {full ? <Button title={t('info.openFull')} variant="secondary" onPress={() => openLink(full)} /> : null}
    </Screen>
  );
}

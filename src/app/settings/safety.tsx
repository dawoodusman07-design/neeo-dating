import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, ListGroup, ListRow, Screen, Text } from '@/ui';
import { emailSupport, links, openLink } from '@/lib/links';

export default function SafetyCentre() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen title={t('settings.safetyTitle')} back>
      <Card tone="tint">
        <Text variant="bodyStrong">{t('settings.emergency')}</Text>
      </Card>
      <Text color="textMuted">{t('settings.safetyIntro')}</Text>
      <ListGroup>
        <ListRow icon="photoPrivacy" title={t('you.photoPrivacy')} onPress={() => router.push('/settings/photo-privacy')} />
        <ListRow icon="verified" title={t('you.getVerified')} onPress={() => router.push('/verify')} />
        <ListRow icon="block" title={t('you.blocked')} onPress={() => router.push('/settings/blocked')} />
        <ListRow icon="blockContacts" title={t('you.blockContacts')} onPress={() => router.push('/settings/block-contacts')} />
        <ListRow icon="dateIdea" title={t('chat.dateCheckIn')} subtitle="Open a chat, then tap the shield icon" />
      </ListGroup>
      <ListGroup>
        <ListRow icon="safety" title={t('settings.safetyGuide')} onPress={() => openLink(links.safety)} />
        <ListRow icon="info" title={t('settings.community')} onPress={() => openLink(links.community)} />
        <ListRow icon="help" title={t('settings.contact')} onPress={() => emailSupport('Safety')} />
        <ListRow icon="report" title={t('settings.appealTitle')} onPress={() => router.push('/settings/appeal')} />
      </ListGroup>
    </Screen>
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, ListGroup, ListRow, Screen, Text } from '@/ui';

/** Package 24 — Safety centre ("Your boundaries matter"). */
export default function SafetyCentre() {
  const { t } = useTranslation();
  const router = useRouter();
  const go = (p: string) => () => router.push(p as never);
  return (
    <Screen title={t('settings.safetyTitle')} back>
      <Text variant="title">{t('settings.safetyHeadline')}</Text>
      <Text color="textMuted">{t('settings.safetyIntro')}</Text>
      <Card tone="tint">
        <Text variant="bodyStrong">{t('settings.emergency')}</Text>
      </Card>
      <ListGroup>
        <ListRow icon="unmatch" title={t('settings.reviewConnection')} subtitle={t('chats.endedBody')} onPress={go('/chats')} />
        <ListRow icon="block" title={t('you.blocked')} onPress={go('/settings/blocked')} />
        <ListRow icon="blockContacts" title={t('you.blockContacts')} onPress={go('/settings/block-contacts')} />
        <ListRow icon="photoPrivacy" title={t('privacy.title')} onPress={go('/settings/photo-privacy')} />
        <ListRow icon="verified" title={t('you.getVerified')} onPress={go('/verify')} />
        <ListRow icon="dateIdea" title={t('chat.dateCheckIn')} subtitle="Open a chat, then tap the shield icon" />
      </ListGroup>
      <ListGroup>
        <ListRow icon="safety" title={t('info.safety.title')} onPress={go('/info/safety')} />
        <ListRow icon="info" title={t('info.community.title')} onPress={go('/info/community')} />
        <ListRow icon="help" title={t('settings.contact')} onPress={() => router.push({ pathname: '/support', params: { topic: 'safety' } })} />
        <ListRow icon="report" title={t('settings.appealsTitle')} onPress={go('/appeals')} />
      </ListGroup>
    </Screen>
  );
}

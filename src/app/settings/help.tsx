import React from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen, Text } from '@/ui';
import { links, openLink, SUPPORT_EMAIL } from '@/lib/links';

/** Help & policies — in-app summaries first, full documents on the web. */
export default function Help() {
  const { t } = useTranslation();
  const router = useRouter();
  const info = (topic: string) => () => router.push({ pathname: '/info/[topic]', params: { topic } });
  return (
    <Screen title={t('settings.helpTitle')} back>
      <ListGroup>
        <ListRow icon="help" title={t('settings.contact')} subtitle={SUPPORT_EMAIL} onPress={() => router.push('/support')} />
        <ListRow icon="chats" title={t('support.inboxTitle')} onPress={() => router.push('/support/inbox')} />
      </ListGroup>
      <ListGroup title={t('you.help')}>
        <ListRow icon="info" title={t('info.about.title')} onPress={info('about')} />
        <ListRow icon="discover" title={t('info.matching.title')} onPress={info('matching')} />
        <ListRow icon="photoPrivacy" title={t('info.photo-privacy.title')} onPress={info('photo-privacy')} />
        <ListRow icon="plus" title={t('info.plus-faq.title')} onPress={info('plus-faq')} />
        <ListRow icon="safety" title={t('info.safety.title')} onPress={info('safety')} />
      </ListGroup>
      <ListGroup title="Policies">
        <ListRow icon="info" title={t('info.community.title')} onPress={info('community')} />
        <ListRow icon="photoPrivacy" title={t('info.privacy-summary.title')} onPress={info('privacy-summary')} />
        <ListRow icon="billing" title={t('info.subscription-terms.title')} onPress={info('subscription-terms')} />
        <ListRow icon="billing" title={t('info.refunds.title')} onPress={info('refunds')} />
        <ListRow icon="info" title={t('settings.terms')} onPress={() => openLink(links.terms)} />
        <ListRow icon="photoPrivacy" title={t('settings.privacyPolicy')} onPress={() => openLink(links.privacy)} />
        <ListRow icon="safety" title={t('settings.childSafety')} onPress={() => openLink(links.childSafety)} />
        <ListRow icon="delete" title={t('settings.deleteWeb')} onPress={() => openLink(links.deleteAccount)} />
      </ListGroup>
      <Text variant="small" color="textMuted" align="center">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}

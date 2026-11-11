import React from 'react';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen, Text } from '@/ui';
import { emailSupport, links, openLink, SUPPORT_EMAIL } from '@/lib/links';

export default function Help() {
  const { t } = useTranslation();
  return (
    <Screen title={t('settings.helpTitle')} back>
      <ListGroup>
        <ListRow icon="help" title={t('settings.contact')} subtitle={SUPPORT_EMAIL} onPress={() => emailSupport()} />
        <ListRow icon="safety" title={t('settings.safetyGuide')} onPress={() => openLink(links.safety)} />
        <ListRow icon="info" title={t('settings.community')} onPress={() => openLink(links.community)} />
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

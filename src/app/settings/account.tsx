import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen, Text } from '@/ui';
import { useMembership } from '@/features/membership/useMembership';

/** Package 48 — Account settings hub ("Settings · Account, data and help" on You). */
export default function AccountSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const membership = useMembership();
  const go = (p: string) => () => router.push(p as never);
  return (
    <Screen title={t('you.settings')} back>
      <Text variant="title">{t('settings.accountTitle')}</Text>
      <Text color="textMuted">{t('settings.accountBody')}</Text>
      <ListGroup title={t('you.account')}>
        <ListRow icon="you" title={t('you.edit')} onPress={go('/settings/edit-profile')} />
        <ListRow icon="addPhoto" title={t('settings.photosTitle')} onPress={go('/settings/photos')} />
        <ListRow icon="preferences" title={t('you.preferences')} onPress={go('/settings/preferences')} />
        <ListRow icon="notifications" title={t('you.notifications')} onPress={go('/settings/notifications')} />
        <ListRow icon="block" title={t('you.blocked')} onPress={go('/settings/blocked')} />
        <ListRow icon="plus" title={t('membership.title')} value={membership.data ? t(`membership.${membership.data.status === 'free' ? 'freeTitle' : membership.data.status === 'active' ? 'activeTitle' : 'title'}`) : undefined} onPress={go('/membership')} />
      </ListGroup>
      <ListGroup title={t('you.appearance')}>
        <ListRow icon="show" title={t('you.appearance')} onPress={go('/settings/appearance')} />
        <ListRow icon="info" title={t('settings.readabilityTitle')} onPress={go('/settings/readability')} />
        <ListRow icon="region" title={t('you.region')} onPress={go('/settings/region')} />
      </ListGroup>
      <ListGroup title={t('you.help')}>
        <ListRow icon="help" title={t('support.inboxTitle')} onPress={go('/support/inbox')} />
        <ListRow icon="help" title={t('you.helpPolicies')} onPress={go('/settings/help')} />
        <ListRow icon="report" title={t('settings.appealsTitle')} onPress={go('/appeals')} />
      </ListGroup>
      <ListGroup title={t('you.privacySafety')}>
        <ListRow icon="pauseProfile" title={t('you.pause')} onPress={go('/settings/pause')} />
        <ListRow icon="export" title={t('you.export')} onPress={go('/settings/export')} />
        <ListRow icon="signOut" title={t('logout.cta')} onPress={go('/settings/logout')} />
        <ListRow icon="delete" title={t('you.delete')} destructive onPress={go('/settings/delete-account')} />
      </ListGroup>
    </Screen>
  );
}

import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { api } from '@/data';
import { hashedContactNumbers } from '@/services/contactsBlock';
import { useSettings } from '@/stores/settings';

export default function BlockContacts() {
  const { t } = useTranslation();
  const { blockContacts, set } = useSettings();
  const [denied, setDenied] = useState(false);
  const toggle = async (v: boolean) => {
    if (!v) {
      await api.me.setHashedContacts([]);
      return set('blockContacts', false);
    }
    const hashes = await hashedContactNumbers();
    if (hashes === 'denied') return setDenied(true);
    await api.me.setHashedContacts(hashes);
    set('blockContacts', true);
    toast(t('settings.blockContactsDone', { count: hashes.length }), 'success');
  };
  return (
    <Screen title={t('settings.blockContactsTitle')} back>
      <Text color="textMuted">{t('settings.blockContactsBody')}</Text>
      <ListGroup>
        <ListRow icon="blockContacts" title={t('settings.blockContactsToggle')} toggle={{ value: blockContacts, onValueChange: toggle }} />
      </ListGroup>
      {denied ? (
        <Card tone="tint">
          <Text>{t('settings.blockContactsDenied')}</Text>
          <Button title={t('settings.openSettings')} variant="secondary" onPress={() => Linking.openSettings()} />
        </Card>
      ) : null}
    </Screen>
  );
}

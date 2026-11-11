import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { api } from '@/data';
import { useMe } from '@/data/hooks';

export default function Pause() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const me = useMe();
  const paused = !!me.data?.paused;
  return (
    <Screen title={t('settings.pauseTitle')} back>
      <Text color="textMuted">{t('settings.pauseBody')}</Text>
      <ListGroup>
        <ListRow
          icon="pauseProfile"
          title={t('settings.pauseToggle')}
          toggle={{
            value: paused,
            onValueChange: async (v) => {
              await api.me.pause(v);
              await qc.invalidateQueries({ queryKey: ['me'] });
              toast(v ? t('states.paused.title') : t('common.done'));
            },
          }}
        />
      </ListGroup>
    </Screen>
  );
}

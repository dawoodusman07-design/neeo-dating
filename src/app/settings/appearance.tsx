import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen } from '@/ui';
import { useSettings, type ThemeOverride } from '@/stores/settings';

export default function Appearance() {
  const { t } = useTranslation();
  const { themeOverride, aiAssist, set } = useSettings();
  const opts: [ThemeOverride, string][] = [
    ['system', t('settings.appearanceSystem')],
    ['light', t('settings.appearanceLight')],
    ['dark', t('settings.appearanceDark')],
  ];
  return (
    <Screen title={t('you.appearance')} back>
      <ListGroup>
        {opts.map(([k, label]) => (
          <ListRow key={k} title={label} selected={themeOverride === k} onPress={() => set('themeOverride', k)} />
        ))}
      </ListGroup>
      <ListGroup footer={t('settings.aiAssistSub')}>
        <ListRow icon="tip" title={t('settings.aiAssist')} toggle={{ value: aiAssist, onValueChange: (v) => set('aiAssist', v) }} />
      </ListGroup>
    </Screen>
  );
}

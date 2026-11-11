import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroup, ListRow, Screen } from '@/ui';
import { applyLocale, type Locale } from '@/i18n';
import { useSettings } from '@/stores/settings';
import { notify } from '@/lib/confirm';

const LANGS: { key: Locale; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ur', label: 'اردو (Urdu) — preview' },
  { key: 'ar', label: 'العربية (Arabic) — preview' },
];
const REGIONS = [
  { key: 'CA', label: 'Canada' },
  { key: 'GB', label: 'United Kingdom' },
  { key: 'US', label: 'United States' },
  { key: 'PK', label: 'Pakistan' },
  { key: 'AE', label: 'United Arab Emirates' },
  { key: 'SA', label: 'Saudi Arabia' },
];

export default function Region() {
  const { t } = useTranslation();
  const { locale, region, set } = useSettings();
  return (
    <Screen title={t('settings.regionTitle')} back>
      <ListGroup title={t('settings.language')} footer={t('settings.rtlNote')}>
        {LANGS.map((l) => (
          <ListRow
            key={l.key}
            title={l.label}
            selected={locale === l.key}
            onPress={() => {
              set('locale', l.key);
              const { needsRestart } = applyLocale(l.key);
              if (needsRestart) notify(t('settings.rtlNote'));
            }}
          />
        ))}
      </ListGroup>
      <ListGroup title={t('settings.region')}>
        {REGIONS.map((r) => (
          <ListRow key={r.key} title={r.label} selected={region === r.key} onPress={() => set('region', r.key)} />
        ))}
      </ListGroup>
    </Screen>
  );
}

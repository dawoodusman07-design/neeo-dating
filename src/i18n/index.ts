import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import en from './en';
import ur from './ur';
import ar from './ar';

export const RTL_LANGS = new Set(['ar', 'ur']);
export const SUPPORTED = ['en', 'ur', 'ar'] as const;
export type Locale = (typeof SUPPORTED)[number];

const deviceLang = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur }, ar: { translation: ar } },
  lng: 'en', // English ships first; user can opt in to ur/ar in Region & language.
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

I18nManager.allowRTL(true);

export function applyLocale(lang: Locale) {
  i18n.changeLanguage(lang);
  const rtl = RTL_LANGS.has(lang);
  const needsRestart = I18nManager.isRTL !== rtl;
  I18nManager.forceRTL(rtl);
  return { needsRestart };
}

export { deviceLang };
export default i18n;

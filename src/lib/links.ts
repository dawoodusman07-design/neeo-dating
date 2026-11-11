import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

export const WEB = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://neeo.app';
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@neeo.app';

export const links = {
  terms: `${WEB}/terms`,
  privacy: `${WEB}/privacy`,
  community: `${WEB}/community-guidelines`,
  safety: `${WEB}/safety`,
  childSafety: `${WEB}/child-safety`,
  deleteAccount: `${WEB}/delete-account`,
  help: `${WEB}/help`,
};

export const openLink = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
export const emailSupport = (subject = 'Neeo support') => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`);

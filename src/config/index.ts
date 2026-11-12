import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveRuntimeConfig } from './resolve';

export * from './resolve';

/**
 * Evaluated when first imported (src/app/_layout.tsx imports it before anything else),
 * so a misconfigured preview/production build stops at startup with a clear error
 * instead of silently running on mock data.
 * EXPO_PUBLIC_* values are inlined at build time; APP_VARIANT reaches the app via app.config.ts → extra.
 */
export const runtimeConfig = resolveRuntimeConfig({
  appVariant: (Constants.expoConfig?.extra?.appVariant as string | undefined) ?? process.env.EXPO_PUBLIC_APP_VARIANT,
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  revenueCatKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  }),
});

import type { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveRuntimeConfig } = require('./src/config/resolve.js') as typeof import('./src/config/resolve');

/**
 * Neeo app config. Native folders are generated (CNG); configure native
 * behaviour here and in config plugins only.
 *
 * Brand hex values below are native-config only (splash/adaptive icon) and
 * mirror tokens in src/theme/tokens.ts. They are excluded from the
 * hard-coded-colour check because native config cannot import TS tokens.
 */
// Fail closed at BUILD time too: a preview/production build that isn't wired to Supabase
// (or lacks a store key) never gets built. The app re-checks at startup (src/config).
const runtime = resolveRuntimeConfig({
  appVariant: process.env.APP_VARIANT,
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  revenueCatKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

const IS_PROD = process.env.APP_VARIANT === 'production';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const bundleId = IS_PROD ? 'app.neeo' : IS_PREVIEW ? 'app.neeo.preview' : 'app.neeo.dev';

const config: ExpoConfig = {
  name: IS_PROD ? 'Neeo' : IS_PREVIEW ? 'Neeo (Preview)' : 'Neeo (Dev)',
  slug: 'neeo',
  scheme: 'neeo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      NSCameraUsageDescription:
        'Neeo uses your camera so you can take profile photos and complete a selfie check that confirms you are the person in your photos.',
      NSPhotoLibraryUsageDescription:
        'Neeo needs access to your photos so you can choose pictures for your profile or share them in a chat.',
      NSMicrophoneUsageDescription:
        'Neeo uses your microphone only when you record a voice prompt or a voice note.',
      NSLocationWhenInUseUsageDescription:
        'Neeo uses your approximate location to introduce you to people nearby. Others only ever see a rounded distance, never your exact location.',
      NSContactsUsageDescription:
        'If you turn on “Block contacts”, Neeo checks your contacts on this device so people you know are not shown your profile. Numbers are hashed before they leave your phone.',
      NSUserTrackingUsageDescription: undefined,
    },
    // Privacy manifest (PrivacyInfo.xcprivacy) generated at prebuild.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        collected('NSPrivacyCollectedDataTypePhoneNumber', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeName', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypePhotosorVideos', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeAudioData', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeCoarseLocation', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeOtherUserContent', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeSensitiveInfo', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypePurchaseHistory', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
        collected('NSPrivacyCollectedDataTypeUserID', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']),
      ],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
      ],
    },
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      backgroundColor: '#FFFAFD',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Only the permissions we use, requested in context at runtime.
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_CONTACTS',
      'android.permission.POST_NOTIFICATIONS',
    ],
    blockedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#FFFAFD',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#1A1219' },
      },
    ],
    'expo-font',
    'expo-secure-store',
    'expo-image',
    'expo-localization',
    'expo-web-browser',
    ['expo-audio', { microphonePermission: 'Neeo uses your microphone only when you record a voice prompt or a voice note.' }],
    ['expo-camera', { cameraPermission: 'Neeo uses your camera for profile photos and the selfie check.', recordAudioAndroid: false }],
    ['expo-image-picker', { photosPermission: 'Neeo needs access to your photos so you can choose pictures for your profile.' }],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Neeo uses your approximate location to introduce you to people nearby. Others only see a rounded distance.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    ['expo-contacts', { contactsPermission: 'Used only for “Block contacts”, so people you know do not see your profile.' }],
    ['expo-notifications', { color: '#BD2858' }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID },
    appVariant: runtime.appVariant,
    dataMode: runtime.dataMode,
  },
  updates: process.env.EAS_PROJECT_ID ? { url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}` } : undefined,
};

function collected(type: string, purposes: string[]) {
  return {
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: purposes,
  };
}

export default config;

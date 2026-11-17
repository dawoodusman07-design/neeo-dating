import '@/config'; // validates build configuration first (fails closed outside development)
import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, SplashScreen } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/theme';
import { ToastHost } from '@/ui';
import { useSession } from '@/stores/session';
import { useBootSession } from '@/features/useBootSession';
import { useSettings } from '@/stores/settings';
import { applyLocale, RTL_LANGS } from '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const queryClient = useMemo(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
    [],
  );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootStack ready={fontsLoaded} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack({ ready }: { ready: boolean }) {
  const t = useTheme();
  const status = useSession((s) => s.status);
  const locale = useSettings((s) => s.locale);
  useBootSession();

  // Restore the saved language on launch (and apply changes made in Region & language).
  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.c.bg).catch(() => {});
  }, [t.c.bg]);

  useEffect(() => {
    if (ready && status !== 'unknown') SplashScreen.hideAsync().catch(() => {});
  }, [ready, status]);

  if (!ready || status === 'unknown') return null;

  const signedIn = status === 'active' || status === 'paused' || status === 'underReview';
  return (
    <WebColumn>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.c.bg } }}>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="match/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="plus" options={{ presentation: 'modal' }} />
          <Stack.Screen name="membership" />
          <Stack.Screen name="report/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="block/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="unblock/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="unmatch/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="photo-request/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="share-photos/[matchId]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="check-in/[matchId]" />
          <Stack.Screen name="check-in-prompt/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="support" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="appeals" />
          <Stack.Screen name="account-review" />
          <Stack.Screen name="reauth" />
          <Stack.Screen name="verify" />
        </Stack.Protected>
        <Stack.Screen name="state/[kind]" />
        <Stack.Screen name="info/[topic]" />
        <Stack.Screen name="dev" />
        <Stack.Screen name="index" />
      </Stack>
      <ToastHost />
    </WebColumn>
  );
}

/** On web, keep the phone layout: a centred column (max 480px) with `bg` outside it. Native: no-op. */
function WebColumn({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const locale = useSettings((s) => s.locale);
  // Keyboard focus ring in the theme's focus colour (the browser default is invisible on the dark theme). WCAG 2.4.7.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let el = document.getElementById('neeo-focus') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'neeo-focus';
      document.head.appendChild(el);
    }
    el.textContent = `:focus-visible{outline:3px solid ${t.c.focus} !important;outline-offset:2px !important;border-radius:6px}`;
  }, [t.c.focus]);
  if (Platform.OS !== 'web') return <>{children}</>;
  const dir = RTL_LANGS.has(locale) ? 'rtl' : 'ltr';
  return (
    <View style={{ flex: 1, backgroundColor: t.c.tint, alignItems: 'center' }}>
      <View
        // react-native-web resolves start/end styles from the nearest dir/lang
        {...({ dir, lang: locale } as object)}
        style={{
          flex: 1,
          width: '100%',
          maxWidth: t.size.appMaxWidth,
          backgroundColor: t.c.bg,
          borderStartWidth: 1,
          borderEndWidth: 1,
          borderColor: t.c.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

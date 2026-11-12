import '@/i18n';
import React, { useEffect, useMemo } from 'react';
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
  useBootSession();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.c.bg).catch(() => {});
  }, [t.c.bg]);

  useEffect(() => {
    if (ready && status !== 'unknown') SplashScreen.hideAsync().catch(() => {});
  }, [ready, status]);

  if (!ready || status === 'unknown') return null;

  const signedIn = status === 'active' || status === 'paused' || status === 'underReview';
  return (
    <>
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
    </>
  );
}

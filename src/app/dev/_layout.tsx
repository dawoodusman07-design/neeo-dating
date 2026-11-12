import { Redirect, Stack } from 'expo-router';
import { runtimeConfig } from '@/config';

/** Developer screens exist only in development builds. */
export default function Layout() {
  if (!runtimeConfig.allowMocks) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

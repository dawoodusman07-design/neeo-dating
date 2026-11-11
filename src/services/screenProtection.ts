/**
 * Screenshot protection.
 *  - Android: FLAG_SECURE via preventScreenCaptureAsync — screenshots and screen
 *    recording show a blank screen.
 *  - iOS: screenshots CANNOT be blocked. We detect them, blur sensitive content
 *    and notify the other person. The UI says this honestly.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { useSettings } from '@/stores/settings';

export const canBlockScreenshots = Platform.OS === 'android';

export function useScreenProtection(tag: string, onScreenshot?: () => void) {
  const enabled = useSettings((s) => s.screenshotProtection);
  const [justCaptured, setJustCaptured] = useState(false);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    if (Platform.OS === 'android') {
      ScreenCapture.preventScreenCaptureAsync(tag).catch(() => {});
      return () => {
        ScreenCapture.allowScreenCaptureAsync(tag).catch(() => {});
      };
    }
    // iOS: detect + blur the app-switcher snapshot.
    ScreenCapture.enableAppSwitcherProtectionAsync?.(0.6).catch(() => {});
    const sub = ScreenCapture.addScreenshotListener(() => {
      setJustCaptured(true);
      onScreenshot?.();
      setTimeout(() => setJustCaptured(false), 4000);
    });
    return () => {
      sub.remove();
      ScreenCapture.disableAppSwitcherProtectionAsync?.().catch(() => {});
    };
  }, [enabled, tag, onScreenshot]);

  return { enabled, justCaptured };
}

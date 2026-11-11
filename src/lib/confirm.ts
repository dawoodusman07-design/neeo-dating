import { Alert, Platform } from 'react-native';

type Opts = { title: string; message?: string; ok: string; cancel: string; destructive?: boolean };

/** Native Alert on iOS/Android; window.confirm on web (where Alert.alert is a no-op). */
export function confirm({ title, message, ok, cancel, destructive }: Opts): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm([title, message].filter(Boolean).join('\n\n')));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}

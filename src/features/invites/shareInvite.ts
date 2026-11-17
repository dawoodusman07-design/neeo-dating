import { Share } from 'react-native';

/** Open the system share sheet. Returns false when sharing isn't available (e.g. some desktop browsers). */
export async function shareInvite(message: string): Promise<boolean> {
  try {
    await Share.share({ message });
    return true;
  } catch {
    return false;
  }
}

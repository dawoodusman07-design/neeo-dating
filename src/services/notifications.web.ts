/**
 * Web build: no push notifications (the web build is a preview of the phone app).
 * expo-notifications only logs "not supported" warnings on web, so it is not imported here.
 * Reports "denied" so screens show the "how to turn notifications on" state instead of a dead prompt.
 */
export type PushPermission = 'granted' | 'denied' | 'undetermined';

export async function getPushPermission(): Promise<PushPermission> {
  return 'undetermined';
}

export async function requestPushPermission(): Promise<{ status: PushPermission; token?: string }> {
  return { status: 'denied' };
}

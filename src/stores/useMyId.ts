import { useSession } from './session';
/** Current user id ('me' in mock mode). */
export const useMyId = () => useSession((s) => s.userId) ?? 'me';

import { Redirect } from 'expo-router';
import { useSession } from '@/stores/session';

export default function Index() {
  const status = useSession((s) => s.status);
  if (status === 'onboarding') return <Redirect href="/onboarding/dob" />;
  if (status === 'signedOut' || status === 'unknown') return <Redirect href="/welcome" />;
  return <Redirect href="/discover" />;
}

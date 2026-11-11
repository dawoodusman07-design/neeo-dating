import { useEffect } from 'react';
import { DATA_MODE } from '@/data';
import { useSession } from '@/stores/session';
import { purchases } from '@/services/purchases';

/** Resolve the initial auth state once at launch. */
export function useBootSession() {
  const setStatus = useSession((s) => s.setStatus);
  const status = useSession((s) => s.status);
  useEffect(() => {
    if (status !== 'unknown') return;
    (async () => {
      if (DATA_MODE === 'mock') {
        setStatus('signedOut');
        return;
      }
      try {
        const { createSupabaseClient } = await import('@/data/supabase');
        const sb = createSupabaseClient();
        const { data } = await sb.auth.getSession();
        if (!data.session) return setStatus('signedOut');
        const { data: prof } = await sb.from('profiles').select('status').eq('id', data.session.user.id).maybeSingle();
        await purchases.init(data.session.user.id).catch(() => {});
        useSession.setState({ userId: data.session.user.id, phone: data.session.user.phone ?? null });
        if (!prof) return setStatus('onboarding');
        setStatus(prof.status === 'paused' ? 'paused' : prof.status === 'under_review' ? 'underReview' : 'active');
      } catch {
        setStatus('signedOut');
      }
    })();
  }, [status, setStatus]);
}

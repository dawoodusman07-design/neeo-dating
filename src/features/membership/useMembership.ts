import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isPlusActive, purchases } from '@/services/purchases';
import { useSession } from '@/stores/session';

export const membershipKey = ['membership'] as const;

/** Membership from the store (RevenueCat). Keeps session.isPlus in step with it. */
export function useMembership() {
  const setPlus = useSession((s) => s.setPlus);
  const q = useQuery({ queryKey: membershipKey, queryFn: () => purchases.getMembership(), staleTime: 10_000 });
  useEffect(() => {
    if (q.data) setPlus(isPlusActive(q.data.status));
  }, [q.data, setPlus]);
  return q;
}

export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => purchases.getPlans() });

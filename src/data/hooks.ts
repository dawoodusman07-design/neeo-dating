import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './index';
import type { LikeTarget, Message } from './types';

export const qk = {
  me: ['me'] as const,
  intros: ['intros'] as const,
  profile: (id: string) => ['profile', id] as const,
  likesReceived: ['likes', 'received'] as const,
  likesSent: ['likes', 'sent'] as const,
  matches: ['matches'] as const,
  match: (id: string) => ['match', id] as const,
  messages: (id: string) => ['messages', id] as const,
  blocked: ['blocked'] as const,
  photoRequests: ['photoRequests'] as const,
};

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: api.me.get });
export const useIntroductions = () => useQuery({ queryKey: qk.intros, queryFn: api.discover.introductions });
export const useProfile = (id: string) => useQuery({ queryKey: qk.profile(id), queryFn: () => api.discover.profile(id) });
export const useLikesReceived = () => useQuery({ queryKey: qk.likesReceived, queryFn: api.likes.received });
export const useLikesSent = () => useQuery({ queryKey: qk.likesSent, queryFn: api.likes.sent });
export const useMatches = () => useQuery({ queryKey: qk.matches, queryFn: api.matches.list });
export const useMatch = (id: string) => useQuery({ queryKey: qk.match(id), queryFn: () => api.matches.get(id) });
export const useBlocked = () => useQuery({ queryKey: qk.blocked, queryFn: api.safety.blocked });
export const usePhotoRequests = () => useQuery({ queryKey: qk.photoRequests, queryFn: api.privacy.requests });

/** Messages with a realtime subscription merged into the query cache. */
export function useMessages(matchId: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.messages(matchId), queryFn: () => api.messages.list(matchId) });
  useEffect(() => {
    const unsub = api.messages.subscribe(matchId, (m: Message) => {
      qc.setQueryData<Message[]>(qk.messages(matchId), (prev = []) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      qc.invalidateQueries({ queryKey: qk.matches });
    });
    return unsub;
  }, [matchId, qc]);
  return query;
}

export function useLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { profileId: string; target?: LikeTarget; comment?: string }) => api.discover.like(v.profileId, v.target, v.comment),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.intros });
      qc.invalidateQueries({ queryKey: qk.matches });
      qc.invalidateQueries({ queryKey: ['likes'] });
    },
  });
}

export function usePass() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.discover.pass, onSettled: () => qc.invalidateQueries({ queryKey: qk.intros }) });
}

export function useBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.safety.block,
    onSettled: () => qc.invalidateQueries(),
  });
}

export function useSendMessage(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.messages.send>[1]) => api.messages.send(matchId, input),
    onSuccess: (m) => {
      qc.setQueryData<Message[]>(qk.messages(matchId), (prev = []) => [...prev, m]);
      qc.invalidateQueries({ queryKey: qk.matches });
    },
  });
}

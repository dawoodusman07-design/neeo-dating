import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, ListGroup, ListRow, Screen, type IconName } from '@/ui';
import { api, type InboxItem } from '@/data';
import { formatDate } from '@/lib/time';

const ICON: Record<InboxItem['kind'], IconName> = {
  report_outcome: 'safety',
  photo_request_declined: 'photoPrivacy',
  photo_request_shared: 'show',
  appeal_outcome: 'report',
  support_reply: 'help',
  new_match: 'chats',
  new_like: 'likes',
};

/** Notification inbox (from name only): report outcomes, photo request decisions, appeal outcomes, support replies. */
export default function Inbox() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['inbox'], queryFn: api.inbox.list });
  const list = useMemo(() => q.data ?? [], [q.data]);
  useEffect(() => {
    if (list.some((i) => !i.read)) {
      const id = setTimeout(() => api.inbox.markAllRead().then(() => qc.invalidateQueries({ queryKey: ['inbox'] })), 1500);
      return () => clearTimeout(id);
    }
  }, [list, qc]);
  return (
    <Screen title={t('inbox.title')} back scroll={list.length > 0}>
      {list.length === 0 ? (
        <EmptyState icon="notifications" title={t('inbox.title')} body={t('inbox.empty')} />
      ) : (
        <ListGroup>
          {list.map((i) => (
            <ListRow
              key={i.id}
              icon={ICON[i.kind]}
              title={i.read ? i.title : `${i.title} · ${t('inbox.unread')}`}
              subtitle={`${i.body} · ${formatDate(i.createdAt)}`}
              onPress={i.href ? () => router.push(i.href as never) : undefined}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

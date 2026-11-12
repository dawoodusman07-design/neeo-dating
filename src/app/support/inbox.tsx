import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, ListGroup, ListRow, Screen } from '@/ui';
import { api } from '@/data';
import { formatDate } from '@/lib/time';

/** Help inbox: support requests and their replies. */
export default function SupportInbox() {
  const { t } = useTranslation();
  const router = useRouter();
  const q = useQuery({ queryKey: ['support'], queryFn: api.support.list });
  const list = q.data ?? [];
  return (
    <Screen title={t('support.inboxTitle')} back scroll={list.length > 0} footer={<Button title={t('support.newRequest')} onPress={() => router.push('/support')} testID="support-new" />}>
      {list.length === 0 ? (
        <EmptyState icon="help" title={t('support.inboxTitle')} body={t('support.inboxEmpty')} />
      ) : (
        <ListGroup>
          {list.map((s) => (
            <ListRow
              key={s.id}
              icon="help"
              title={`${t(`support.topic_${s.topic}`)} · ${t('support.reference', { ref: s.reference })}`}
              subtitle={`${t(`support.status_${s.status}`)} · ${formatDate(s.createdAt)}`}
              onPress={() => router.push({ pathname: '/support/[id]', params: { id: s.id } })}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

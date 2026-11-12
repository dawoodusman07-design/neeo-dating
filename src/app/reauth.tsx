import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/ui';
import { api } from '@/data';
import { ReauthForm } from '@/features/account/ReauthForm';

/** Reauthenticate (from name only). `for` = export | delete. */
export default function Reauth() {
  const router = useRouter();
  const { for: purpose } = useLocalSearchParams<{ for?: 'export' | 'delete' }>();
  return (
    <Screen back>
      <ReauthForm
        onLocked={() => router.replace({ pathname: '/state/[kind]', params: { kind: 'reauth-failed' } })}
        onVerified={async () => {
          if (purpose === 'export') {
            try {
              const r = await api.me.exportData();
              router.replace({ pathname: '/state/[kind]', params: { kind: r.status === 'ready' ? 'export-ready' : 'offline', url: r.url ?? '' } });
            } catch {
              router.replace({ pathname: '/state/[kind]', params: { kind: 'offline' } });
            }
          } else router.replace({ pathname: '/settings/delete-account', params: { step: 'confirm' } });
        }}
      />
    </Screen>
  );
}

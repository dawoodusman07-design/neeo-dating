import React from 'react';
import { I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { DATA_MODE } from '@/data';
import { MockPurchaseService, purchases } from '@/services/purchases';
import { useSession } from '@/stores/session';

const STATES = ['purchase-pending', 'purchase-failed', 'purchase-cancelled', 'restored', 'restore-none', 'billing-issue', 'session-expired', 'export-ready', 'export-expired', 'offline', 'upload-failed', 'account-review', 'suspended', 'paused', 'deleted', 'not-found'];

/** Developer menu (dev builds only). */
export default function Dev() {
  const router = useRouter();
  const { isPlus, setPlus } = useSession();
  return (
    <Screen title="Developer" back>
      <Text color="textMuted">Data mode: {DATA_MODE}</Text>
      <ListGroup title="Design system">
        <ListRow title="Component gallery (light + dark)" onPress={() => router.push('/dev/components')} />
      </ListGroup>
      <ListGroup title="Layout">
        <ListRow
          title="Force RTL"
          subtitle="Restart the app after toggling"
          toggle={{ value: I18nManager.isRTL, onValueChange: (v) => { I18nManager.forceRTL(v); toast('Restart the app to apply'); } }}
        />
      </ListGroup>
      <ListGroup title="Purchases (mock store)">
        <ListRow title="Has Plus" toggle={{ value: isPlus, onValueChange: setPlus }} />
        {purchases instanceof MockPurchaseService
          ? (['success', 'cancelled', 'pending', 'failed'] as const).map((o) => (
              <ListRow key={o} title={`Next purchase: ${o}`} selected={(purchases as MockPurchaseService).nextOutcome === o} onPress={() => { (purchases as MockPurchaseService).nextOutcome = o; toast(`Next purchase → ${o}`); }} />
            ))
          : null}
      </ListGroup>
      <ListGroup title="State screens">
        {STATES.map((k) => (
          <ListRow key={k} title={k} onPress={() => router.push({ pathname: '/state/[kind]', params: { kind: k } })} />
        ))}
      </ListGroup>
    </Screen>
  );
}

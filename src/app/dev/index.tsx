import React, { useState } from 'react';
import { I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ListGroup, ListRow, Screen, Text, toast } from '@/ui';
import { api, DATA_MODE } from '@/data';
import { MockPurchaseService, purchases, type MembershipStatus } from '@/services/purchases';
import { membershipKey } from '@/features/membership/useMembership';

const STATES = ['purchase-pending', 'purchase-failed', 'purchase-cancelled', 'purchase-success', 'restored', 'restore-none', 'billing-issue', 'session-expired', 'export-ready', 'export-expired', 'offline', 'upload-failed', 'account-review', 'suspended', 'paused', 'deleted', 'not-found', 'reauth-failed'];
const MEMBERSHIP: MembershipStatus[] = ['free', 'pending', 'active', 'renewal_off', 'billing_issue', 'expired'];

type MockState = {
  failUploads: boolean;
  failSends: boolean;
  review: { status: 'active' | 'under_review' | 'suspended'; reason?: string };
  appeals: { status: string; outcomeNote?: string }[];
  inbox: { id: string; kind: string; title: string; body: string; createdAt: string; read: boolean; href?: string }[];
};

/** Mock-only: reverse the latest appeal and deliver the outcome to the inbox. */
function decideLatestAppeal(mock: MockState) {
  const a = mock.appeals[0];
  if (!a) return false;
  a.status = 'overturned';
  a.outcomeNote = 'A second reviewer found the reports didn’t break our rules. Your account is active again.';
  mock.review = { status: 'active' };
  mock.inbox.unshift({ id: `in_${Date.now()}`, kind: 'appeal_outcome', title: 'Your appeal was successful', body: a.outcomeNote, createdAt: new Date().toISOString(), read: false, href: '/appeals' });
  return true;
}

/** Developer menu (dev builds and mock-data builds only — never in production). */
export default function Dev() {
  const router = useRouter();
  const qc = useQueryClient();
  const mock = (api as unknown as { _state?: MockState })._state;
  const store = purchases instanceof MockPurchaseService ? purchases : null;
  const [, rerender] = useState(0);
  const refresh = () => {
    rerender((n) => n + 1);
    qc.invalidateQueries();
  };
  return (
    <Screen title="Developer" back>
      <Text color="textMuted">Data mode: {DATA_MODE}</Text>
      <ListGroup title="Design system">
        <ListRow title="Component gallery (light + dark)" onPress={() => router.push('/dev/components')} />
      </ListGroup>
      <ListGroup title="Layout">
        <ListRow title="Force RTL" subtitle="Restart the app after toggling" toggle={{ value: I18nManager.isRTL, onValueChange: (v) => { I18nManager.forceRTL(v); toast('Restart the app to apply'); } }} />
      </ListGroup>
      {store ? (
        <>
          <ListGroup title="Mock store: next purchase">
            {(['success', 'cancelled', 'pending', 'failed'] as const).map((o) => (
              <ListRow key={o} title={`Next purchase: ${o}`} selected={store.nextOutcome === o} onPress={() => { store.nextOutcome = o; refresh(); }} testID={`dev-outcome-${o}`} />
            ))}
            <ListRow title="Store account already owns Plus (for Restore)" toggle={{ value: store.storeHasPurchase, onValueChange: (v) => { store.storeHasPurchase = v; refresh(); } }} />
          </ListGroup>
          <ListGroup title="Mock store: membership as RevenueCat reports it">
            {MEMBERSHIP.map((s) => (
              <ListRow key={s} title={s} onPress={async () => { store.simulate(s); await qc.invalidateQueries({ queryKey: membershipKey }); toast(`Membership → ${s}`); refresh(); }} testID={`dev-membership-${s}`} />
            ))}
          </ListGroup>
        </>
      ) : null}
      {mock ? (
        <ListGroup title="Mock backend">
          <ListRow title="Photo uploads fail" toggle={{ value: mock.failUploads, onValueChange: (v) => { mock.failUploads = v; refresh(); } }} />
          <ListRow title="Message sending fails" toggle={{ value: mock.failSends, onValueChange: (v) => { mock.failSends = v; refresh(); } }} testID="dev-fail-sends" />
          <ListRow title="Account under review" subtitle="Takes effect on next sign-in" toggle={{ value: mock.review.status !== 'active', onValueChange: (v) => { mock.review = v ? { status: 'under_review', reason: 'Several people reported messages that pressured them to share photos.' } : { status: 'active' }; refresh(); } }} />
          <ListRow
            title="Decide latest appeal (reverse)"
            onPress={() => {
              if (!decideLatestAppeal(mock)) return toast('No appeals yet');
              refresh();
              toast('Appeal decided');
            }}
          />
        </ListGroup>
      ) : null}
      <ListGroup title="State screens">
        {STATES.map((k) => (
          <ListRow key={k} title={k} onPress={() => router.push({ pathname: '/state/[kind]', params: { kind: k, name: 'Maya', ref: 'NE-000000' } })} />
        ))}
      </ListGroup>
    </Screen>
  );
}

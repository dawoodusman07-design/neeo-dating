import { membershipFromEntitlement, isPlusActive, MockPurchaseService } from '@/services/purchases';

type Ent = Partial<{ isActive: boolean; willRenew: boolean; billingIssueDetectedAt: string | null; unsubscribeDetectedAt: string | null; expirationDate: string | null; productIdentifier: string; store: string }>;
const info = (ent?: Ent) =>
  ({
    managementURL: 'https://apps.apple.com/account/subscriptions',
    entitlements: { all: ent ? { plus: { isActive: true, willRenew: true, billingIssueDetectedAt: null, unsubscribeDetectedAt: null, expirationDate: '2026-12-12T00:00:00Z', productIdentifier: 'monthly', store: 'APP_STORE', ...ent } } : {}, active: {} },
  }) as never;

describe('membership states map to RevenueCat entitlement data (package 34–45)', () => {
  it('free when there is no entitlement', () => expect(membershipFromEntitlement(info(), false).status).toBe('free'));
  it('pending while a purchase awaits the store', () => expect(membershipFromEntitlement(info(), true).status).toBe('pending'));
  it('active (41)', () => expect(membershipFromEntitlement(info({}), false)).toMatchObject({ status: 'active', store: 'app_store', expiresAt: '2026-12-12T00:00:00Z' }));
  it('renewal off (43) when auto-renew is turned off', () => expect(membershipFromEntitlement(info({ willRenew: false, unsubscribeDetectedAt: '2026-11-01' }), false).status).toBe('renewal_off'));
  it('billing issue (44) wins over renewal state', () => expect(membershipFromEntitlement(info({ billingIssueDetectedAt: '2026-11-10', willRenew: false }), false).status).toBe('billing_issue'));
  it('expired (45) when the entitlement is no longer active', () => expect(membershipFromEntitlement(info({ isActive: false }), false).status).toBe('expired'));
  it('Plus features stay on during renewal-off and billing grace', () => {
    expect(['active', 'renewal_off', 'billing_issue'].every((s) => isPlusActive(s as never))).toBe(true);
    expect(['free', 'pending', 'expired'].some((s) => isPlusActive(s as never))).toBe(false);
  });
});

describe('mock store lifecycle', () => {
  it('pending → check status → active', async () => {
    const s = new MockPurchaseService();
    s.nextOutcome = 'pending';
    const [plan] = await s.getPlans();
    expect((await s.purchase()).status).toBe('pending');
    expect((await s.refresh()).status).toBe('pending'); // first check: still waiting
    expect((await s.refresh()).status).toBe('active');
    void plan;
  }, 10000);
  it('failed and cancelled never activate Plus', async () => {
    const s = new MockPurchaseService();
    s.nextOutcome = 'failed';
    expect((await s.purchase()).status).toBe('failed');
    s.nextOutcome = 'cancelled';
    expect((await s.purchase()).status).toBe('cancelled');
    expect((await s.getMembership()).status).toBe('free');
  }, 10000);
  it('restore: nothing to restore, then restored when the store account owns Plus', async () => {
    const s = new MockPurchaseService();
    expect(await s.restore()).toBe('nothing_to_restore');
    s.storeHasPurchase = true;
    expect(await s.restore()).toBe('restored');
    expect((await s.getMembership()).status).toBe('active');
  }, 10000);
});

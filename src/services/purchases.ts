/**
 * Neeo Plus via RevenueCat (StoreKit / Google Play Billing).
 *
 * Prices ALWAYS come from the store; nothing is hard-coded. With no RevenueCat key
 * (development / mock data) a mock store is used, clearly labelled "Test store",
 * which can be driven through every membership state from the developer menu.
 *
 * Membership states (design package ids 34–45) are derived from RevenueCat's
 * CustomerInfo for the "plus" entitlement — see `membershipFromEntitlement`.
 */
import { Linking, Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENT = 'plus';

export type Plan = {
  id: string;
  title: string; // e.g. "1 month"
  priceString: string; // localised by the store
  periodLabel: string; // e.g. "monthly"
  badge?: string;
  pkg?: PurchasesPackage;
};

export type PurchaseOutcome =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'pending' } // Ask to Buy / deferred payment / slow card
  | { status: 'failed'; message: string };

export type MembershipStatus =
  | 'free' // no entitlement, never had one
  | 'pending' // purchase waiting for the store (Ask to Buy, deferred payment)
  | 'active' // entitlement active and renewing
  | 'renewal_off' // active, but the user turned off auto-renew (unsubscribeDetectedAt / willRenew=false)
  | 'billing_issue' // active in grace period, store reports a billing problem
  | 'expired'; // had Plus, entitlement no longer active

export type Membership = {
  status: MembershipStatus;
  expiresAt?: string;
  productId?: string;
  store?: 'app_store' | 'play_store' | 'test';
  managementUrl?: string;
};

export const isPlusActive = (s: MembershipStatus) => s === 'active' || s === 'renewal_off' || s === 'billing_issue';

export interface PurchaseService {
  readonly isTestStore: boolean;
  init(userId: string): Promise<void>;
  getPlans(): Promise<Plan[]>;
  purchase(plan: Plan): Promise<PurchaseOutcome>;
  restore(): Promise<'restored' | 'nothing_to_restore'>;
  /** Current membership from the store (cached by the SDK). */
  getMembership(): Promise<Membership>;
  /** Re-check with the store, e.g. "Check purchase status" on a pending purchase. */
  refresh(): Promise<Membership>;
  /** Open the store's own subscription management (cancel renewal, update billing). */
  manage(): Promise<void>;
}

const STORE_SUBSCRIPTIONS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

/** Pure mapping, unit-tested in __tests__/membership.test.ts. */
export function membershipFromEntitlement(
  info: Pick<CustomerInfo, 'entitlements' | 'managementURL'>,
  pendingPurchase: boolean,
): Membership {
  const ent = info.entitlements.all[ENTITLEMENT];
  const managementUrl = info.managementURL ?? undefined;
  if (!ent) return { status: pendingPurchase ? 'pending' : 'free', managementUrl };
  const base = {
    expiresAt: ent.expirationDate ?? undefined,
    productId: ent.productIdentifier,
    store: ent.store === 'APP_STORE' ? ('app_store' as const) : ent.store === 'PLAY_STORE' ? ('play_store' as const) : ('test' as const),
    managementUrl,
  };
  if (!ent.isActive) return { status: pendingPurchase ? 'pending' : 'expired', ...base };
  if (ent.billingIssueDetectedAt) return { status: 'billing_issue', ...base };
  if (!ent.willRenew || ent.unsubscribeDetectedAt) return { status: 'renewal_off', ...base };
  return { status: 'active', ...base };
}

const key = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

class RevenueCatService implements PurchaseService {
  readonly isTestStore = false;
  private pending = false;
  async init(userId: string) {
    if (!(await Purchases.isConfigured())) Purchases.configure({ apiKey: key!, appUserID: userId });
  }
  async getPlans(): Promise<Plan[]> {
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    return pkgs.map((pkg) => ({
      id: pkg.identifier,
      title: pkg.product.title,
      priceString: pkg.product.priceString,
      periodLabel: pkg.packageType.toLowerCase(),
      pkg,
    }));
  }
  async purchase(plan: Plan): Promise<PurchaseOutcome> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(plan.pkg!);
      if (customerInfo.entitlements.active[ENTITLEMENT]) return { status: 'success' };
      this.pending = true;
      return { status: 'pending' };
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; code?: string; message?: string };
      if (err.userCancelled) return { status: 'cancelled' };
      if (err.code === 'PAYMENT_PENDING_ERROR' || err.code === '20') {
        this.pending = true;
        return { status: 'pending' };
      }
      return { status: 'failed', message: err.message ?? 'Purchase failed' };
    }
  }
  async restore() {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT] ? 'restored' : 'nothing_to_restore';
  }
  async getMembership() {
    const m = membershipFromEntitlement(await Purchases.getCustomerInfo(), this.pending);
    if (isPlusActive(m.status)) this.pending = false;
    return m;
  }
  async refresh() {
    await Purchases.invalidateCustomerInfoCache();
    await Purchases.syncPurchases().catch(() => {});
    return this.getMembership();
  }
  async manage() {
    try {
      await Purchases.showManageSubscriptions();
    } catch {
      const m = await this.getMembership();
      await Linking.openURL(m.managementUrl ?? STORE_SUBSCRIPTIONS_URL!);
    }
  }
}

/**
 * Mock store for development and E2E. Shows "Test price" labels; never used in
 * production builds (production always has a RevenueCat key).
 */
export class MockPurchaseService implements PurchaseService {
  readonly isTestStore = true;
  /** What the next purchase does (developer menu). */
  nextOutcome: PurchaseOutcome['status'] = 'success';
  /** Whether the store account already owns Plus (for "Restore"). */
  storeHasPurchase = false;
  /** How many "Check purchase status" taps a pending purchase needs before it confirms. */
  pendingChecksLeft = 1;
  private status: MembershipStatus = 'free';
  private expiresAt?: string;

  async init() {}
  async getPlans(): Promise<Plan[]> {
    return [
      { id: 'monthly', title: '1 month', priceString: 'Test price A', periodLabel: 'monthly' },
      { id: 'quarterly', title: '3 months', priceString: 'Test price B', periodLabel: 'every 3 months', badge: 'Popular' },
      { id: 'annual', title: '12 months', priceString: 'Test price C', periodLabel: 'yearly' },
    ];
  }
  async purchase(): Promise<PurchaseOutcome> {
    await new Promise((r) => setTimeout(r, 600));
    switch (this.nextOutcome) {
      case 'success':
        this.activate();
        return { status: 'success' };
      case 'pending':
        this.status = 'pending';
        this.pendingChecksLeft = 1;
        return { status: 'pending' };
      case 'failed':
        return { status: 'failed', message: 'The store could not complete the purchase.' };
      default:
        return { status: 'cancelled' };
    }
  }
  async restore() {
    await new Promise((r) => setTimeout(r, 400));
    if (this.storeHasPurchase || isPlusActive(this.status)) {
      if (!isPlusActive(this.status)) this.activate();
      return 'restored' as const;
    }
    return 'nothing_to_restore' as const;
  }
  async getMembership(): Promise<Membership> {
    return { status: this.status, expiresAt: this.expiresAt, store: 'test', productId: 'monthly' };
  }
  async refresh() {
    await new Promise((r) => setTimeout(r, 400));
    if (this.status === 'pending') {
      if (this.pendingChecksLeft > 0) this.pendingChecksLeft -= 1;
      else this.activate();
    }
    return this.getMembership();
  }
  async manage() {
    await Linking.openURL(STORE_SUBSCRIPTIONS_URL!).catch(() => {});
  }
  /** Developer menu: simulate what RevenueCat would report. */
  simulate(status: MembershipStatus) {
    this.status = status;
    if (status === 'free') this.expiresAt = undefined;
    else if (status === 'expired') this.expiresAt = new Date(Date.now() - 86400_000).toISOString();
    else if (!this.expiresAt || status === 'active') this.expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
  }
  private activate() {
    this.status = 'active';
    this.expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
    this.storeHasPurchase = true;
  }
}

export const purchases: PurchaseService = key ? new RevenueCatService() : new MockPurchaseService();

/**
 * Neeo Plus via RevenueCat (StoreKit / Google Play Billing).
 * Prices ALWAYS come from the store; nothing is hard-coded. When no RevenueCat
 * key is configured (Expo Go / mock mode) a mock store is used so the paywall
 * states can be exercised, clearly marked as "Test store".
 */
import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENT = 'plus';

export type Plan = {
  id: string;
  title: string; // e.g. "1 month"
  priceString: string; // localised by the store
  periodLabel: string; // e.g. "per month"
  badge?: string;
  pkg?: PurchasesPackage;
};

export type PurchaseOutcome =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'pending' } // e.g. Ask to Buy / deferred payment
  | { status: 'failed'; message: string };

export interface PurchaseService {
  readonly isTestStore: boolean;
  init(userId: string): Promise<void>;
  getPlans(): Promise<Plan[]>;
  purchase(plan: Plan): Promise<PurchaseOutcome>;
  restore(): Promise<'restored' | 'nothing_to_restore'>;
  isPlus(): Promise<boolean>;
  billingIssue(): Promise<boolean>;
}

const key = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

class RevenueCatService implements PurchaseService {
  readonly isTestStore = false;
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
      periodLabel: pkg.packageType,
      pkg,
    }));
  }
  async purchase(plan: Plan): Promise<PurchaseOutcome> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(plan.pkg!);
      return customerInfo.entitlements.active[ENTITLEMENT] ? { status: 'success' } : { status: 'pending' };
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; code?: string; message?: string };
      if (err.userCancelled) return { status: 'cancelled' };
      if (err.code === 'PAYMENT_PENDING_ERROR' || err.code === '20') return { status: 'pending' };
      return { status: 'failed', message: err.message ?? 'Purchase failed' };
    }
  }
  async restore() {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT] ? 'restored' : 'nothing_to_restore';
  }
  async isPlus() {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[ENTITLEMENT]);
  }
  async billingIssue() {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[ENTITLEMENT]?.billingIssueDetectedAt);
  }
}

/** Mock store for development. Shows "Test store" prices; never ships in production builds. */
export class MockPurchaseService implements PurchaseService {
  readonly isTestStore = true;
  private plus = false;
  nextOutcome: PurchaseOutcome['status'] = 'success';
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
    const s = this.nextOutcome;
    if (s === 'success') this.plus = true;
    if (s === 'failed') return { status: 'failed', message: 'The store could not complete the purchase.' };
    return { status: s } as PurchaseOutcome;
  }
  async restore() {
    return this.plus ? ('restored' as const) : ('nothing_to_restore' as const);
  }
  async isPlus() {
    return this.plus;
  }
  async billingIssue() {
    return false;
  }
}

export const purchases: PurchaseService = key ? new RevenueCatService() : new MockPurchaseService();

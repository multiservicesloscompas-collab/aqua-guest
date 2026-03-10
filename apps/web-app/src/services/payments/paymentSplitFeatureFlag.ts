import type {
  MixedPaymentFeatureFlags,
  PaymentSplitModule,
} from '@/types/paymentSplits';

const DEFAULT_FLAGS: MixedPaymentFeatureFlags = {
  enabled: true,
  water: true,
  rentals: true,
};

export function createDefaultMixedPaymentFlags(): MixedPaymentFeatureFlags {
  return { ...DEFAULT_FLAGS };
}

export function isMixedPaymentEnabledForModule(
  _flags: MixedPaymentFeatureFlags | undefined,
  _module: PaymentSplitModule
): boolean {
  return true;
}

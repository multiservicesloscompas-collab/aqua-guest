import type {
  MixedPaymentFeatureFlags,
  PaymentSplitModule,
} from '@/types/paymentSplits';

const DEFAULT_FLAGS: MixedPaymentFeatureFlags = {
  enabled: true,
  water: true,
  rentals: true,
  expenses: true,
};

export function createDefaultMixedPaymentFlags(): MixedPaymentFeatureFlags {
  return { ...DEFAULT_FLAGS };
}

export function isMixedPaymentEnabledForModule(
  flags: MixedPaymentFeatureFlags | undefined,
  module: PaymentSplitModule
): boolean {
  if (!flags) return true;
  if (!flags.enabled) return false;
  return flags[module];
}

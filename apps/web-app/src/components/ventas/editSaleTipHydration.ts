import type { Sale } from '@/types';
import type { Tip } from '@/types/tips';

export function findTipBySaleOrigin(tips: readonly Tip[], saleId: string) {
  return tips.find(
    (tip) => tip.originType === 'sale' && tip.originId === saleId
  );
}

export function resolveEditSaleTipHydration(
  sale: Sale,
  tips: readonly Tip[]
): {
  enabled: boolean;
  amount: string;
  paymentMethod: Sale['paymentMethod'];
  notes: string;
} {
  const linkedTip = findTipBySaleOrigin(tips, sale.id);

  if (!linkedTip) {
    return {
      enabled: false,
      amount: '',
      paymentMethod: sale.paymentMethod,
      notes: '',
    };
  }

  return {
    enabled: linkedTip.amountBs > 0,
    amount: String(linkedTip.amountBs),
    paymentMethod: linkedTip.capturePaymentMethod,
    notes: linkedTip.notes || '',
  };
}

import type { Method, Payment, RentalShift } from '../ledger/types';

/** Tip captured together with a sale or a rental. */
export interface TipInput {
  amountBs: number;
  captureMethod: Method;
}

/**
 * One thing a person does in the app. Plain data (JSON-serializable) so a
 * scenario can be stored, passed through E2E_SCENARIO and explained in Spanish.
 */
export type Step =
  | {
      type: 'sale';
      id: string;
      baseBs: number;
      payment: Payment;
      tip?: TipInput;
    }
  | {
      type: 'rental';
      id: string;
      shift: RentalShift;
      deliveryFeeUsd?: number;
      payment: Payment;
      isPaid: boolean;
      tip?: TipInput;
    }
  | { type: 'expense'; id: string; amountBs: number; payment: Payment }
  | {
      type: 'transfer';
      id: string;
      from: Method;
      to: Method;
      outBs: number;
      inBs: number;
    }
  | { type: 'payTip'; originId: string; method: Method }
  | { type: 'markPaid'; rentalId: string }
  | { type: 'delete'; targetId: string }
  /**
   * Edit a sale, rental or expense that has a simple payment and no tip
   * (editing tips is the known bug B3, so scenarios stay clear of it).
   * `amountBs` is the sale subtotal or the expense amount; `shift` is for rentals.
   */
  | {
      type: 'edit';
      targetId: string;
      amountBs?: number;
      shift?: RentalShift;
      primary?: Method;
    };

export interface Scenario {
  id: string;
  titulo: string;
  area: string;
  intent: string;
  steps: Step[];
}

import type {
  MethodTotals,
  SupportedPaymentMethod,
} from '../masterLedger/ledgerTypes';

export type Method = SupportedPaymentMethod;
export type { MethodTotals };

export const METHODS: readonly Method[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

/** How a total is paid: the primary method takes whatever the secondary leaves. */
export interface Payment {
  primary: Method;
  secondary?: { method: Method; amountBs: number };
}

export interface Tip {
  amountBs: number;
  /** Method the tip was collected in (it joins the sale/rental split). */
  captureMethod: Method;
  /** Set once the tip was paid out, with the method it was paid from. */
  payoutMethod?: Method;
}

export interface SaleRecord {
  kind: 'sale';
  id: string;
  baseBs: number;
  payment: Payment;
  tip?: Tip;
}

export type RentalShift = 'medio' | 'completo' | 'doble';

export interface RentalRecord {
  kind: 'rental';
  id: string;
  shift: RentalShift;
  deliveryFeeUsd: number;
  payment: Payment;
  isPaid: boolean;
  tip?: Tip;
}

export interface ExpenseRecord {
  kind: 'expense';
  id: string;
  amountBs: number;
  payment: Payment;
}

export interface PrepaidRecord {
  kind: 'prepaid';
  id: string;
  amountBs: number;
  method: Method;
}

export interface TransferRecord {
  kind: 'transfer';
  id: string;
  from: Method;
  to: Method;
  outBs: number;
  inBs: number;
}

export type LedgerRecord =
  | SaleRecord
  | RentalRecord
  | ExpenseRecord
  | PrepaidRecord
  | TransferRecord;

export interface Ledger {
  exchangeRate: number;
  records: readonly LedgerRecord[];
}

/** What the dashboard and the tips module must show for a ledger. */
export interface Expected {
  incomeBs: number;
  expenseBs: number;
  netBs: number;
  /** Sales + paid rentals + transfers + tip payouts (prepaid and expenses do not count). */
  transactions: number;
  cards: MethodTotals;
  pendingTips: number;
  paidTips: number;
}

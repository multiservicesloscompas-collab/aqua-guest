export type SupportedPaymentMethod =
  | 'efectivo'
  | 'pago_movil'
  | 'punto_venta'
  | 'divisa';

export interface MethodTotals {
  efectivo: number;
  pago_movil: number;
  punto_venta: number;
  divisa: number;
}

export interface SplitEntry {
  method: SupportedPaymentMethod;
  amountBs: number;
  amountUsd?: number;
}

export interface CommercialLedgerState {
  incomeBs: number;
  expenseBs: number;
  netBs: number;
  dashboardTransactionsCount: number;
  timelineRowsCount: number;
  methodTotals: MethodTotals;
  exchangeRate: number;
}

export interface WaterSaleInput {
  basePriceBs: number;
  splits: SplitEntry[];
  tip?: {
    amountBs: number;
    method: SupportedPaymentMethod;
    paid: boolean;
  };
  noteMarker: string;
}

export interface WasherRentalInput {
  shift: 'medio' | 'completo' | 'doble' | string;
  deliveryFeeUsd?: number;
  totalUsd: number;
  isPaid: boolean;
  splits: SplitEntry[];
  tip?: {
    amountBs: number;
    method: SupportedPaymentMethod;
    paid: boolean;
  };
  customerName: string;
  notes?: string;
}

export interface ExpenseInput {
  description: string;
  amountBs: number;
  category:
    | 'operativo'
    | 'insumos'
    | 'servicios'
    | 'mantenimiento'
    | 'personal'
    | 'otros';
  splits: SplitEntry[];
  notes?: string;
}

export interface BalanceTransferInput {
  operationType: 'equilibrio' | 'avance';
  fromMethod: SupportedPaymentMethod;
  toMethod: SupportedPaymentMethod;
  amountOutBs: number;
  amountInBs: number;
  notes?: string;
}

export interface TipPayoutInput {
  tipId: string;
  amountBs: number;
  paymentMethod: SupportedPaymentMethod;
}

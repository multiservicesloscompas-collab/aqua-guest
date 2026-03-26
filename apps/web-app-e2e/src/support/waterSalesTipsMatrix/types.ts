export type SupportedPaymentMethod =
  | 'efectivo'
  | 'pago_movil'
  | 'punto_venta'
  | 'divisa';

export type TipScenarioState = 'paid' | 'pending' | 'none';

export interface MatrixScenario {
  id: string;
  noteMarker: string;
  paymentMethod: SupportedPaymentMethod;
  basePriceBs: number;
  tipState: TipScenarioState;
  tipAmountBs: number;
  tipPaymentMethod?: SupportedPaymentMethod;
}

export interface SaleSplitAmount {
  method: SupportedPaymentMethod;
  amountBs: number;
  amountUsd: number;
}

export interface ExpectedSaleArtifact {
  scenarioId: string;
  saleId: string;
  dailyNumber: number | null;
  totalBs: number;
  paymentMethod: SupportedPaymentMethod;
  splitAmounts: SaleSplitAmount[];
  tipId?: string;
  tipAmountBs?: number;
  tipPaymentMethod?: SupportedPaymentMethod;
}

export interface MethodTotals {
  efectivo: number;
  pago_movil: number;
  punto_venta: number;
  divisa: number;
}

export interface ExpectedLedger {
  seed: number;
  runMarker: string;
  scenarios: MatrixScenario[];
  saleArtifacts: ExpectedSaleArtifact[];
  incomeDeltaBs: number;
  expenseDeltaBs: number;
  netDeltaBs: number;
  transactionsDelta: number;
  methodTotalsDelta: MethodTotals;
  expectedTipsTotal: number;
  expectedTipsPending: number;
  expectedTipsPaid: number;
}

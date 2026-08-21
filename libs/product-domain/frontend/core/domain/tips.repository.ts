import type { PaymentMethod, Tip } from '@aqua-guest/domain';
import type { BaseRepository } from '../../shared/domain';

type TipEditableFields = Omit<
  Tip,
  'id' | 'paidPaymentMethod' | 'paidAt' | 'status' | 'createdAt' | 'updatedAt'
>;

type TipPayoutFields = Pick<Tip, 'tipDate' | 'paidAt' | 'id' | 'originType' | 'originId' | 'notes'>;

export type TipUpsertInput = TipEditableFields;

export interface TipDailyPayoutRequest {
  tipDate: TipPayoutFields['tipDate'];
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  paidAt?: TipPayoutFields['paidAt'];
}

export interface TipSinglePayoutRequest {
  tipId: TipPayoutFields['id'];
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  paidAt?: TipPayoutFields['paidAt'];
  tipDate?: TipPayoutFields['tipDate'];
}

export interface TipPayoutSummary {
  date: TipPayoutFields['tipDate'];
  paymentMethod: PaymentMethod;
  paidCount: number;
  totalAmountBs: number;
}

export interface TipsRepository
  extends BaseRepository<Tip, TipUpsertInput, Partial<TipUpsertInput>> {
  upsertByOrigin(input: TipUpsertInput): Promise<Tip>;
  deleteByOrigin(
    originType: TipPayoutFields['originType'],
    originId: TipPayoutFields['originId']
  ): Promise<void>;
  updateNote(tipId: TipPayoutFields['id'], notes?: TipPayoutFields['notes']): Promise<Tip>;
  payForDay(input: TipDailyPayoutRequest): Promise<TipPayoutSummary>;
  paySingle(input: TipSinglePayoutRequest): Promise<TipPayoutSummary>;
  loadByDateRange(startDate: string, endDate: string): Promise<Tip[]>;
  loadPaidByDateRange(startDate: string, endDate: string): Promise<Tip[]>;
}

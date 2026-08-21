import type {
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
} from '@aqua-guest/domain';
import type { BaseRepository } from '../../shared/domain';

export type PaymentBalanceRepository = BaseRepository<
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate
>;

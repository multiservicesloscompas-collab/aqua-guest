import type { ExchangeRateHistory } from '@aqua-guest/domain';
import type { BaseRepository } from '../../shared/domain';

export interface ExchangeRatesRepository
  extends BaseRepository<
    ExchangeRateHistory,
    ExchangeRateHistory,
    ExchangeRateHistory,
    ExchangeRateHistory['date']
  > {
  upsert(entry: ExchangeRateHistory): Promise<void>;
}

import type { LiterPricing } from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export interface LiterPricingRepository
  extends BaseRepository<
    LiterPricing,
    LiterPricing,
    Partial<LiterPricing>,
    LiterPricing['breakpoint']
  > {
  replace(items: readonly LiterPricing[]): Promise<void>;
}

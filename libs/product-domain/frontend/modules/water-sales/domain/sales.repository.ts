import type { Sale, SaleDraft } from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export interface SalesRepository
  extends BaseRepository<Sale, SaleDraft, Partial<SaleDraft>> {
  loadByDate(date: string): Promise<Sale[]>;
  loadByDates(dates: readonly string[]): Promise<Map<string, Sale[]>>;
  loadByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Sale[]>>;
}

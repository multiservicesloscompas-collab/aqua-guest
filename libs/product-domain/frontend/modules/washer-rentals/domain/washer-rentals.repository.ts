import type {
  WasherRental,
  WasherRentalDraft,
  WasherRentalUpdate,
} from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export interface WasherRentalsRepository
  extends BaseRepository<WasherRental, WasherRentalDraft, WasherRentalUpdate> {
  loadByDate(date: string): Promise<WasherRental[]>;
  loadByDates(dates: readonly string[]): Promise<Map<string, WasherRental[]>>;
  loadByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, WasherRental[]>>;
}

import type { Expense, ExpenseDraft, ExpenseUpdate } from '@aqua-guest/domain';
import type { BaseRepository } from '../../shared/domain';

export interface ExpensesRepository
  extends BaseRepository<Expense, ExpenseDraft, ExpenseUpdate> {
  loadByDate(date: string): Promise<Expense[]>;
  loadByDates(dates: readonly string[]): Promise<Map<string, Expense[]>>;
  loadByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Expense[]>>;
}

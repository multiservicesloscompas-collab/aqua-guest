import type { Expense } from '@/types';

export const dedupExpensesByDateRange = (
  currentItems: Expense[],
  newItems: Expense[],
  datesToExclude: Set<string>
): Expense[] => {
  const map = new Map<string, Expense>();

  currentItems
    .filter((item) => !datesToExclude.has(item.date))
    .forEach((item) => map.set(item.id, item));
  newItems.forEach((item) => map.set(item.id, item));

  return Array.from(map.values());
};

import type { Locator, Page } from '@playwright/test';

/** Rental card container that includes the given text (cards have no test id today). */
export function rentalCard(page: Page, text: string): Locator {
  return page.locator('.bg-card', { hasText: text }).first();
}

export const rentalCardEditButton = (card: Locator): Locator =>
  card.locator('button:has(svg.lucide-pencil)').first();

export const rentalCardDeleteButton = (card: Locator): Locator =>
  card.locator('button:has(svg.lucide-trash-2, svg.lucide-trash)').first();

export const rentalCardExtendButton = (card: Locator): Locator =>
  card.locator('[title="Extender tiempo"]').first();

export const saleRow = (page: Page, id: string): Locator => page.getByTestId(`sale-row-${id}`);

export const toMoney = (text: string | null): number => {
  const cleaned = (text ?? '').replace(/[^0-9,.-]/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  return Number.parseFloat(normalized);
};

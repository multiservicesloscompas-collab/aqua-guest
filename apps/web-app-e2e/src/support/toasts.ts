import { expect, type Page } from '@playwright/test';

export const TOAST_SALE_REGISTERED = '¡Venta registrada correctamente!';

/**
 * Waits until a toast with this text is visible.
 *
 * Do not use a bare `getByText(text).toBeVisible()` for a toast: a test that
 * registers several records in a row can have the previous toast (about 4 s)
 * still on screen when the next one appears, and Playwright then fails with
 * "strict mode violation" because two elements match. The toast is only the
 * UI signal; what proves that a record exists is the database check each test
 * does afterwards.
 */
export async function expectToast(
  page: Page,
  text: string,
  options: { timeout?: number } = {}
): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible(options);
}

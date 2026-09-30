import type { Page } from '@playwright/test';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const rest = (table: string) => `**/rest/v1/${table}*`;

/** Answers matching Supabase REST calls with the given HTTP status. */
export async function failRoute(
  page: Page,
  table: string,
  method: HttpMethod,
  status = 500
): Promise<void> {
  await page.route(rest(table), (route) => {
    if (route.request().method() === method) {
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'e2e injected failure', code: 'E2E' }),
      });
    }
    return route.continue();
  });
}

/** Delays matching Supabase REST calls; `delayFor` picks the delay per request index. */
export async function delayRoute(
  page: Page,
  table: string,
  method: HttpMethod,
  delayFor: (index: number) => number
): Promise<void> {
  let index = 0;
  await page.route(rest(table), async (route) => {
    if (route.request().method() !== method) return route.continue();
    const ms = delayFor(index++);
    await new Promise((resolve) => setTimeout(resolve, ms));
    return route.continue();
  });
}

/** Lets the first matching request reach the server, then drops the response (client sees a network error). */
export async function abortAfterCommit(
  page: Page,
  table: string,
  method: HttpMethod
): Promise<void> {
  let aborted = false;
  await page.route(rest(table), async (route) => {
    if (!aborted && route.request().method() === method) {
      aborted = true;
      await route.fetch();
      return route.abort('failed');
    }
    return route.continue();
  });
}

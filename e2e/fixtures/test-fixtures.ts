import { test as base, type Page } from '@playwright/test';
import { BudgetPage } from '../pages/budget-page';
import { AccountPage } from '../pages/account-page';
import { TransactionPage } from '../pages/transaction-page';
import { ApiClient } from '../api/api-client';

interface TestFixtures {
  budgetPage: BudgetPage;
  accountPage: AccountPage;
  transactionPage: TransactionPage;
  apiClient: ApiClient;
}

/**
 * `test` is the Playwright test runner extended with project-specific fixtures.
 *
 * Import `test` and `expect` from this file in every spec file instead of
 * importing directly from `@playwright/test`. This keeps all fixture wiring
 * in one place and lets spec files stay lean.
 *
 * The `page` fixture is overridden so that every test automatically starts
 * on the budget page, having gone through the initial app setup if needed.
 * This keeps individual tests free of repetitive navigation boilerplate.
 */
export const test = base.extend<TestFixtures>({
  /**
   * Override `page` to perform app-level setup before each test.
   *
   * The storageState saved by `global.setup.ts` already contains the
   * server-selection choice (localStorage), so the only remaining setup
   * step is selecting the demo budget when the welcome screen appears.
   */
  page: async ({ page }, use) => {
    await navigateToBudget(page);
    await use(page);
  },

  budgetPage: async ({ page }, use) => {
    await use(new BudgetPage(page));
  },

  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },

  transactionPage: async ({ page }, use) => {
    await use(new TransactionPage(page));
  },

  apiClient: async ({ request }, use) => {
    const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3001';
    await use(new ApiClient(request, baseUrl));
  },
});

// Re-export expect so spec files have a single import source
export { expect } from '@playwright/test';

/**
 * Navigates to the app and handles any setup screens.
 *
 * Setup screen sequence:
 *   1. Server selection (/config-server) → click "Don't use a server".
 *      The app stores this preference in OPFS/SQLite (not localStorage), so
 *      storageState does not skip this screen — every test must click through.
 *   2. Budget selection → click "View demo" to load a pre-populated demo budget.
 *
 * Uses waitFor({ state: 'visible' }) instead of isVisible() because isVisible()
 * is not a wait method — it checks the current DOM state synchronously and
 * returns false before React has finished mounting.
 */
async function navigateToBudget(page: Page): Promise<void> {
  await page.goto('/');

  // Always appears on fresh contexts — storageState doesn't persist the server choice.
  const noServerButton = page.getByRole('button', { name: /don't use a server/i });
  const noServerAppeared = await noServerButton
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (noServerAppeared) {
    await noServerButton.click();
  }

  const viewDemoButton = page.getByRole('button', { name: /view demo/i });
  const viewDemoAppeared = await viewDemoButton
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (viewDemoAppeared) {
    await viewDemoButton.click();
  }

  await page.waitForURL(/\/(budget|accounts)/, { timeout: 30_000 });
}

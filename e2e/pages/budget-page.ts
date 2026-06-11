import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { clickReactAriaButton, fillReactInput } from '../utils/react-helpers';

/**
 * BudgetPage represents the main `/budget` view and its sidebar.
 *
 * Assertions belong in spec files — this class only encapsulates user actions.
 */
export class BudgetPage extends BasePage {
  readonly addAccountButton: Locator;
  readonly sidebarAllAccountsBalance: Locator;
  readonly sidebarOnBudgetBalance: Locator;
  readonly sidebarOffBudgetBalance: Locator;
  readonly budgetTable: Locator;
  readonly budgetTotals: Locator;

  constructor(page: Page) {
    super(page);
    this.addAccountButton          = this.getByRole('button', { name: 'Add account' });
    this.sidebarAllAccountsBalance = this.getByTestId('sidebar-all-accounts-balance');
    this.sidebarOnBudgetBalance    = this.getByTestId('sidebar-on-budget-balance');
    this.sidebarOffBudgetBalance   = this.getByTestId('sidebar-off-budget-balance');
    this.budgetTable               = this.getByTestId('budget-table');
    this.budgetTotals              = this.getByTestId('budget-totals');
  }

  async goto(): Promise<void> {
    await this.page.goto('/budget');
    await this.waitForNetworkIdle();
  }

  async openAddAccountModal(): Promise<void> {
    await this.addAccountButton.click();
  }

  /**
   * Creates a local (on-budget) account with an initial balance.
   * Waits until the account link appears in the sidebar before returning.
   *
   * @param name    Account display name — use a unique timestamp-based name from
   *                `generateAccountData()` to prevent collisions in parallel runs.
   * @param balance Initial balance in dollars (e.g. 500 → "$500.00").
   */
  async createLocalAccount(name: string, balance: number): Promise<void> {
    await this.openAddAccountModal();

    await clickReactAriaButton(this.getByRole('button', { name: 'Create a local account' }));
    await fillReactInput(this.getByLabel('Name'), name);
    await fillReactInput(this.getByLabel('Balance'), String(balance));
    await clickReactAriaButton(this.getByRole('button', { name: 'Create', exact: true }));

    await this.page
      .getByRole('link', { name: new RegExp(`^${escapeRegExp(name)}`) })
      .waitFor({ state: 'visible' });
  }

  /**
   * Clicks the account link in the sidebar and waits for the account URL.
   * The link text is matched by prefix to tolerate balance suffixes in the label.
   */
  async navigateToAccount(name: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(`^${escapeRegExp(name)}`) }).click();
    await this.waitForUrl(/\/accounts\//);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * AccountPage represents a single account's detail view at `/accounts/:id`.
 *
 * Assertions belong in spec files — this class only encapsulates user actions.
 */
export class AccountPage extends BasePage {
  readonly accountName: Locator;
  readonly accountBalance: Locator;
  readonly accountMenuButton: Locator;
  readonly addNewTransactionButton: Locator;
  readonly transactionTable: Locator;
  /** All transaction rows currently rendered in the table. */
  readonly transactionRows: Locator;

  constructor(page: Page) {
    super(page);
    this.accountName             = this.getByTestId('account-name');
    this.accountBalance          = this.getByTestId('account-balance');
    this.accountMenuButton       = this.getByRole('button', { name: 'Account menu' });
    this.addNewTransactionButton = this.getByRole('button', { name: 'Add New' });
    this.transactionTable        = this.getByTestId('transaction-table');
    this.transactionRows         = this.transactionTable.getByTestId('row');
  }

  /** Reads the raw text of the account balance element, e.g. "$500.00", "-$75.00". */
  async getBalanceText(): Promise<string> {
    return this.accountBalance.innerText();
  }

  /** Clicks "Add New" to open the inline transaction entry row. */
  async clickAddNewTransaction(): Promise<void> {
    await this.addNewTransactionButton.click();
    await this.getByTestId('new-transaction').waitFor({ state: 'visible' });
  }

  /**
   * Waits until at least `count` rows are visible in the transaction table.
   * Uses nth-element presence instead of count assertion to keep page
   * objects free of expect() calls.
   */
  async waitForTransactionCount(count: number): Promise<void> {
    await this.transactionRows.nth(count - 1).waitFor({ state: 'visible' });
  }

  /**
   * Closes the account via the account menu.
   * Used in afterEach cleanup to keep the budget tidy across test runs.
   *
   * If the account has a remaining balance, the modal requires selecting a
   * transfer destination. Defaults to "Ally Savings" from the demo budget.
   */
  async closeAccount(transferAccountName = 'Ally Savings'): Promise<void> {
    await this.accountMenuButton.click();
    await this.getByRole('button', { name: 'Close Account' }).click();

    const closeModal = this.getByTestId('close-account-modal');
    await closeModal.waitFor({ state: 'visible' });

    // The modal shows a "Select account..." transfer picker when the account
    // has a non-zero balance. Select the transfer destination before closing.
    const transferInput = closeModal.getByPlaceholder('Select account...');
    if (await transferInput.isVisible()) {
      await transferInput.pressSequentially(transferAccountName);
      await this.page.keyboard.press('Enter');
    }

    await closeModal.getByRole('button', { name: 'Close Account' }).click();
    await closeModal.waitFor({ state: 'hidden' });
  }
}

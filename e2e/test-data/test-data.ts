import type { AccountData, TransactionData, BudgetMonth } from '../interfaces/test-data';

export type { AccountData, TransactionData, BudgetMonth };

/**
 * Generates a unique account name using a high-resolution timestamp.
 * The timestamp suffix guarantees no two parallel workers collide even
 * when they start within the same second.
 */
export function generateUniqueAccountName(prefix = 'Test Checking'): string {
  return `${prefix} ${Date.now()}`;
}

/**
 * Returns a fully-populated `AccountData` object.
 * Any field can be overridden via the optional `overrides` argument.
 */
export function generateAccountData(overrides?: Partial<AccountData>): AccountData {
  return {
    name: generateUniqueAccountName(),
    initialBalance: 1000,
    offBudget: false,
    ...overrides,
  };
}

/**
 * Returns a fully-populated `TransactionData` object.
 * The payee name includes a timestamp to keep each transaction unique.
 */
export function generateTransactionData(overrides?: Partial<TransactionData>): TransactionData {
  return {
    payee: `Test Payee ${Date.now()}`,
    notes: 'Automated E2E transaction',
    amount: 75,
    type: 'debit',
    ...overrides,
  };
}

/**
 * Computes the expected account balance after a list of transactions
 * is applied to an initial balance.
 *
 * @param initialBalance Starting balance in dollars.
 * @param transactions   List of transactions to apply in order.
 * @returns Expected balance in dollars.
 */
export function computeExpectedBalance(
  initialBalance: number,
  transactions: TransactionData[],
): number {
  return transactions.reduce((balance, tx) => {
    return tx.type === 'debit' ? balance - tx.amount : balance + tx.amount;
  }, initialBalance);
}

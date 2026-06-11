export interface AccountData {
  /** Display name shown in the sidebar and account header. */
  name: string;
  /** Opening balance in dollars. */
  initialBalance: number;
  /** When true, the account is excluded from the budget envelope math. */
  offBudget?: boolean;
}

export interface TransactionData {
  /** Payee name. Free text — will not be matched to an existing payee. */
  payee: string;
  notes?: string;
  category?: string;
  /**
   * Absolute dollar amount (always positive).
   * Direction is determined by `type`.
   */
  amount: number;
  /** 'debit' = money out; 'credit' = money in. */
  type: 'debit' | 'credit';
}

export interface BudgetMonth {
  /** ISO date string for the first day of the month, e.g. "2024-01-01". */
  month: string;
  /** Category group name. */
  groupName: string;
  /** Category name within the group. */
  categoryName: string;
  /** Dollar amount to budget. */
  budgeted: number;
}

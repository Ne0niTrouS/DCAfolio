import { MONEY_DECIMALS, SHARE_DECIMALS } from './constants';

/**
 * Validation shared by the add and edit forms. The database enforces the same
 * rules as CHECK constraints — this layer exists so the user gets a sentence
 * instead of a constraint-violation error.
 */

export type TransactionDraft = {
  purchaseDate: string;
  stockId: string;
  investedAmount: string;
  shares: string;
};

export type TransactionFieldErrors = Partial<Record<keyof TransactionDraft, string>>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function decimalPlaces(value: string): number {
  const [, fraction] = value.split('.');
  return fraction?.length ?? 0;
}

function isPositiveDecimal(value: string): boolean {
  return /^\d*\.?\d+$/.test(value) && Number(value) > 0;
}

/**
 * @param today ISO `YYYY-MM-DD`. Passed in rather than read from the clock so
 *   the rule is testable and the caller controls the timezone.
 */
export function validateTransaction(
  draft: TransactionDraft,
  today: string,
): TransactionFieldErrors {
  const errors: TransactionFieldErrors = {};

  const date = draft.purchaseDate.trim();
  if (!date) {
    errors.purchaseDate = 'Select a purchase date.';
  } else if (!ISO_DATE.test(date)) {
    errors.purchaseDate = 'Enter a valid date.';
  } else if (date > today) {
    errors.purchaseDate = 'Purchase date cannot be in the future.';
  }

  if (!draft.stockId.trim()) {
    errors.stockId = 'Select a stock.';
  }

  const amount = draft.investedAmount.trim();
  if (!amount) {
    errors.investedAmount = 'Enter the amount invested.';
  } else if (!isPositiveDecimal(amount)) {
    errors.investedAmount = 'Invested amount must be greater than 0.';
  } else if (decimalPlaces(amount) > MONEY_DECIMALS) {
    errors.investedAmount = `Use at most ${MONEY_DECIMALS} decimal places.`;
  }

  const shares = draft.shares.trim();
  if (!shares) {
    errors.shares = 'Enter the number of shares received.';
  } else if (!isPositiveDecimal(shares)) {
    errors.shares = 'Shares must be greater than 0.';
  } else if (decimalPlaces(shares) > SHARE_DECIMALS) {
    errors.shares = `Use at most ${SHARE_DECIMALS} decimal places.`;
  }

  return errors;
}

export function hasErrors(errors: TransactionFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

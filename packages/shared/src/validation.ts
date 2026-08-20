import { MONEY_DECIMALS, SHARE_DECIMALS } from './constants';

/**
 * Validation shared by the add and edit forms. The database enforces the same
 * rules as CHECK constraints — this layer exists so the user gets a sentence
 * instead of a constraint-violation error.
 *
 * The result carries message *codes*, not sentences: this package is
 * locale-free, and the client turns each code into text in the reader's
 * language. The two decimal-place codes name their limit rather than carrying
 * it as a parameter, so the translations must stay in step with
 * MONEY_DECIMALS and SHARE_DECIMALS.
 */

export type TransactionDraft = {
  purchaseDate: string;
  stockId: string;
  investedAmount: string;
  shares: string;
};

export type ValidationCode =
  | 'validation.selectPurchaseDate'
  | 'validation.invalidDate'
  | 'validation.futureDate'
  | 'validation.selectStock'
  | 'validation.investedAmountRequired'
  | 'validation.investedAmountPositive'
  | 'validation.moneyDecimals'
  | 'validation.sharesRequired'
  | 'validation.sharesPositive'
  | 'validation.shareDecimals';

export type TransactionFieldErrors = Partial<Record<keyof TransactionDraft, ValidationCode>>;

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
    errors.purchaseDate = 'validation.selectPurchaseDate';
  } else if (!ISO_DATE.test(date)) {
    errors.purchaseDate = 'validation.invalidDate';
  } else if (date > today) {
    errors.purchaseDate = 'validation.futureDate';
  }

  if (!draft.stockId.trim()) {
    errors.stockId = 'validation.selectStock';
  }

  const amount = draft.investedAmount.trim();
  if (!amount) {
    errors.investedAmount = 'validation.investedAmountRequired';
  } else if (!isPositiveDecimal(amount)) {
    errors.investedAmount = 'validation.investedAmountPositive';
  } else if (decimalPlaces(amount) > MONEY_DECIMALS) {
    errors.investedAmount = 'validation.moneyDecimals';
  }

  const shares = draft.shares.trim();
  if (!shares) {
    errors.shares = 'validation.sharesRequired';
  } else if (!isPositiveDecimal(shares)) {
    errors.shares = 'validation.sharesPositive';
  } else if (decimalPlaces(shares) > SHARE_DECIMALS) {
    errors.shares = 'validation.shareDecimals';
  }

  return errors;
}

export function hasErrors(errors: TransactionFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

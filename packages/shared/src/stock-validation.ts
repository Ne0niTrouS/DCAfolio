/**
 * Validation for a new stock-master entry.
 *
 * Shared deliberately: the browser form and the Edge Function that actually
 * writes the row apply the same rules, and the database CHECK constraints in
 * `0001_init.sql` are the third and final line of defence. Codes, not
 * sentences — this package stays locale-free.
 */

export type StockDraft = {
  symbol: string;
  nameTh: string;
};

export type StockValidationCode =
  | 'validation.symbolRequired'
  | 'validation.symbolFormat'
  | 'validation.symbolTooLong'
  | 'validation.nameThRequired'
  | 'validation.nameThTooLong';

export type StockFieldErrors = Partial<Record<keyof StockDraft, StockValidationCode>>;

/** SET tickers are letters and digits, sometimes with `&`, `-` or a `.` suffix. */
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9&.-]*$/;

export const SYMBOL_MAX_LENGTH = 20;
export const NAME_TH_MAX_LENGTH = 200;

/** Uppercased and trimmed — the schema requires `symbol = upper(symbol)`. */
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function validateStock(draft: StockDraft): StockFieldErrors {
  const errors: StockFieldErrors = {};

  const symbol = normalizeSymbol(draft.symbol);
  if (!symbol) {
    errors.symbol = 'validation.symbolRequired';
  } else if (symbol.length > SYMBOL_MAX_LENGTH) {
    errors.symbol = 'validation.symbolTooLong';
  } else if (!SYMBOL_PATTERN.test(symbol)) {
    errors.symbol = 'validation.symbolFormat';
  }

  const nameTh = draft.nameTh.trim();
  if (!nameTh) {
    errors.nameTh = 'validation.nameThRequired';
  } else if (nameTh.length > NAME_TH_MAX_LENGTH) {
    errors.nameTh = 'validation.nameThTooLong';
  }

  return errors;
}

export function hasStockErrors(errors: StockFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

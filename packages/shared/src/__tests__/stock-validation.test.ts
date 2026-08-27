import { describe, expect, it } from 'vitest';

import {
  NAME_TH_MAX_LENGTH,
  SYMBOL_MAX_LENGTH,
  hasStockErrors,
  normalizeSymbol,
  validateStock,
} from '../stock-validation';

const VALID = { symbol: 'CPALL', nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)' };

describe('normalizeSymbol', () => {
  it('uppercases and trims, because the schema requires upper(symbol)', () => {
    expect(normalizeSymbol('  cpall ')).toBe('CPALL');
    expect(normalizeSymbol('PttEp')).toBe('PTTEP');
  });
});

describe('validateStock', () => {
  it('accepts a normal entry', () => {
    expect(validateStock(VALID)).toEqual({});
    expect(hasStockErrors(validateStock(VALID))).toBe(false);
  });

  it('accepts the punctuation real SET tickers use', () => {
    for (const symbol of ['SCB', 'CPALL', 'M-CHAI', 'S&J', 'PTT.R', 'BE8']) {
      expect(validateStock({ ...VALID, symbol }).symbol, symbol).toBeUndefined();
    }
  });

  it('requires a symbol', () => {
    expect(validateStock({ ...VALID, symbol: '' }).symbol).toBe('validation.symbolRequired');
    expect(validateStock({ ...VALID, symbol: '   ' }).symbol).toBe('validation.symbolRequired');
  });

  it('rejects a symbol that is not a ticker', () => {
    expect(validateStock({ ...VALID, symbol: 'ซีพี' }).symbol).toBe('validation.symbolFormat');
    expect(validateStock({ ...VALID, symbol: 'CP ALL' }).symbol).toBe(
      'validation.symbolFormat',
    );
    expect(validateStock({ ...VALID, symbol: '-CP' }).symbol).toBe('validation.symbolFormat');
  });

  it('judges the symbol after normalising, so lower case is fine', () => {
    expect(validateStock({ ...VALID, symbol: 'cpall' })).toEqual({});
  });

  it('bounds the lengths', () => {
    expect(
      validateStock({ ...VALID, symbol: 'A'.repeat(SYMBOL_MAX_LENGTH) }).symbol,
    ).toBeUndefined();
    expect(validateStock({ ...VALID, symbol: 'A'.repeat(SYMBOL_MAX_LENGTH + 1) }).symbol).toBe(
      'validation.symbolTooLong',
    );
    expect(validateStock({ ...VALID, nameTh: 'ก'.repeat(NAME_TH_MAX_LENGTH + 1) }).nameTh).toBe(
      'validation.nameThTooLong',
    );
  });

  it('requires the Thai company name', () => {
    expect(validateStock({ ...VALID, nameTh: '  ' }).nameTh).toBe('validation.nameThRequired');
  });

  it('reports both broken fields at once', () => {
    const errors = validateStock({ symbol: '', nameTh: '' });

    expect(Object.keys(errors).sort()).toEqual(['nameTh', 'symbol']);
    expect(hasStockErrors(errors)).toBe(true);
  });
});

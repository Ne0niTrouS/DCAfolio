import { describe, expect, it } from 'vitest';

import {
  Decimal,
  InvalidFinancialValueError,
  add,
  isPositive,
  multiply,
  parseDecimal,
  roundMoney,
  roundPercent,
  roundShares,
  safeDivide,
  subtract,
  toPercentNumber,
} from '../decimal';

describe('parseDecimal', () => {
  it('accepts decimal strings and finite numbers', () => {
    expect(parseDecimal('12500.00').toString()).toBe('12500');
    expect(parseDecimal('0.0001').toString()).toBe('0.0001');
    expect(parseDecimal(62.5).toString()).toBe('62.5');
    expect(parseDecimal('-1800.55').toString()).toBe('-1800.55');
  });

  it('rejects anything that is not a finite number', () => {
    for (const bad of ['', '   ', 'abc', '12,500', null, undefined, NaN, Infinity, -Infinity]) {
      expect(() => parseDecimal(bad as never)).toThrow(InvalidFinancialValueError);
    }
  });

  it('names the offending field so the failure is actionable', () => {
    expect(() => parseDecimal('abc', 'investedAmount')).toThrow(/investedAmount/);
  });

  it('passes an already-parsed value straight through', () => {
    const parsed = parseDecimal('62.50');
    expect(parseDecimal(parsed)).toBe(parsed);
  });

  it('rejects a non-finite value however it is expressed', () => {
    expect(() => parseDecimal('Infinity')).toThrow(InvalidFinancialValueError);
    expect(() => parseDecimal('-Infinity')).toThrow(InvalidFinancialValueError);
    expect(() => parseDecimal(new Decimal(Infinity))).toThrow(InvalidFinancialValueError);
  });
});

describe('arithmetic', () => {
  it('adds without floating point drift', () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point.
    expect(add('0.1', '0.2').toString()).toBe('0.3');
    expect(add('12500.10', '7499.90').toString()).toBe('20000');
  });

  it('subtracts without floating point drift', () => {
    expect(subtract('1265200.00', '1250000.00').toString()).toBe('15200');
    expect(subtract('0.3', '0.1').toString()).toBe('0.2');
  });

  it('multiplies without floating point drift', () => {
    expect(multiply('1250', '65.25').toString()).toBe('81562.5');
    expect(multiply('1.1', '3').toString()).toBe('3.3');
  });
});

describe('safeDivide', () => {
  it('divides exactly', () => {
    expect(safeDivide('12500', '200')?.toString()).toBe('62.5');
  });

  it('returns null instead of dividing by zero', () => {
    expect(safeDivide('12500', '0')).toBeNull();
    expect(safeDivide('0', '0')).toBeNull();
    expect(safeDivide('12500', '0.00')).toBeNull();
  });

  it('never produces NaN or Infinity', () => {
    const result = safeDivide('1', '0');
    expect(result).toBeNull();
    expect(Number.isNaN(Number(result))).toBe(false);
  });

  it('still rejects invalid operands', () => {
    expect(() => safeDivide('abc', '1')).toThrow(InvalidFinancialValueError);
    expect(() => safeDivide('1', 'abc')).toThrow(InvalidFinancialValueError);
  });
});

describe('rounding', () => {
  it('rounds money to two decimals, half away from zero', () => {
    expect(roundMoney('62.505')).toBe('62.51');
    expect(roundMoney('62.504')).toBe('62.50');
    expect(roundMoney('-62.505')).toBe('-62.51');
    expect(roundMoney('1250')).toBe('1250.00');
  });

  it('rounds shares to four decimals', () => {
    expect(roundShares('200')).toBe('200');
    expect(roundShares('200.12345')).toBe('200.1235');
  });

  it('rounds percentages to two decimals and returns a number', () => {
    expect(roundPercent(1.2249)).toBe(1.22);
    expect(roundPercent(-3.505)).toBe(-3.51);
  });
});

describe('helpers', () => {
  it('recognises a positive value', () => {
    expect(isPositive('0.0001')).toBe(true);
    expect(isPositive('0')).toBe(false);
    expect(isPositive('-1')).toBe(false);
  });

  it('converts a decimal to a rounded percentage number', () => {
    expect(toPercentNumber(parseDecimal('1.2249'))).toBe(1.22);
  });
});

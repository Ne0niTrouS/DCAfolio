import { pricePerShare } from '@dcafolio/calculation';
import {
  formatMoney,
  hasErrors,
  validateTransaction,
  type Stock,
  type TransactionFieldErrors,
} from '@dcafolio/shared';
import { useMemo, useState, type FormEvent } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';

import type { TransactionInput } from './mutations';

export type TransactionFormValues = TransactionInput;

type TransactionFormProps = {
  stocks: Stock[];
  initialValues?: Partial<TransactionFormValues>;
  submitLabel: string;
  pending?: boolean;
  error?: string | null;
  /** ISO `YYYY-MM-DD`. Injected so the future-date rule is testable. */
  today: string;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
};

/** Safe to compute mid-typing: an incomplete value simply has no price yet. */
function calculatedPrice(investedAmount: string, shares: string): string | null {
  try {
    return pricePerShare(investedAmount, shares);
  } catch {
    return null;
  }
}

export function TransactionForm({
  stocks,
  initialValues,
  submitLabel,
  pending = false,
  error = null,
  today,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>({
    purchaseDate: initialValues?.purchaseDate ?? today,
    stockId: initialValues?.stockId ?? '',
    investedAmount: initialValues?.investedAmount ?? '',
    shares: initialValues?.shares ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<TransactionFieldErrors>({});

  const derivedPrice = useMemo(
    () => calculatedPrice(values.investedAmount, values.shares),
    [values.investedAmount, values.shares],
  );

  function update<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateTransaction(values, today);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    onSubmit({
      purchaseDate: values.purchaseDate.trim(),
      stockId: values.stockId,
      investedAmount: values.investedAmount.trim(),
      shares: values.shares.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}

      <TextField
        label="Purchase Date"
        type="date"
        max={today}
        value={values.purchaseDate}
        error={fieldErrors.purchaseDate}
        onChange={(event) => update('purchaseDate', event.target.value)}
      />

      <SelectField
        label="Stock"
        value={values.stockId}
        error={fieldErrors.stockId}
        onChange={(event) => update('stockId', event.target.value)}
      >
        <option value="">Select a stock</option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.symbol} — {stock.nameTh}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Invested Amount"
        type="text"
        inputMode="decimal"
        placeholder="12500"
        value={values.investedAmount}
        error={fieldErrors.investedAmount}
        onChange={(event) => update('investedAmount', event.target.value)}
      />

      <TextField
        label="Shares Received"
        type="text"
        inputMode="decimal"
        placeholder="200"
        value={values.shares}
        error={fieldErrors.shares}
        onChange={(event) => update('shares', event.target.value)}
      />

      <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
        Calculated:{' '}
        <span className="tnum font-medium text-ink">
          {derivedPrice === null ? '—' : `${formatMoney(derivedPrice)}/share`}
        </span>
      </p>

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" pending={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

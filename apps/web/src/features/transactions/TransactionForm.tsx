import { pricePerShare } from '@dcafolio/calculation';
import {
  UNAVAILABLE,
  formatMoney,
  hasErrors,
  validateTransaction,
  type Stock,
  type TransactionFieldErrors,
} from '@dcafolio/shared';
import { useMemo, useState, type FormEvent } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { ComboBox, type ComboBoxOption } from '@/components/ComboBox';
import { TextField } from '@/components/TextField';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';

import type { TransactionInput } from './mutations';

export type TransactionFormValues = TransactionInput;

type TransactionFormProps = {
  stocks: Stock[];
  initialValues?: Partial<TransactionFormValues>;
  submitLabel: string;
  pending?: boolean;
  error?: TranslationKey | null;
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
  const t = useT();

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

  // Both the symbol and the Thai name are searchable: "ปตท" finds PTT.
  const stockOptions = useMemo<ComboBoxOption[]>(
    () => stocks.map((stock) => ({ value: stock.id, label: stock.symbol, hint: stock.nameTh })),
    [stocks],
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
      {error ? <Alert>{t(error)}</Alert> : null}

      <TextField
        label={t('purchase.purchaseDate')}
        type="date"
        max={today}
        value={values.purchaseDate}
        error={fieldErrors.purchaseDate ? t(fieldErrors.purchaseDate) : undefined}
        onChange={(event) => update('purchaseDate', event.target.value)}
      />

      <ComboBox
        label={t('purchase.stock')}
        value={values.stockId}
        placeholder={t('purchase.selectStock')}
        error={fieldErrors.stockId ? t(fieldErrors.stockId) : undefined}
        options={stockOptions}
        onChange={(stockId) => update('stockId', stockId)}
      />

      <TextField
        label={t('purchase.investedAmount')}
        type="text"
        inputMode="decimal"
        placeholder="12500"
        value={values.investedAmount}
        error={fieldErrors.investedAmount ? t(fieldErrors.investedAmount) : undefined}
        onChange={(event) => update('investedAmount', event.target.value)}
      />

      <TextField
        label={t('purchase.sharesReceived')}
        type="text"
        inputMode="decimal"
        placeholder="200"
        value={values.shares}
        error={fieldErrors.shares ? t(fieldErrors.shares) : undefined}
        onChange={(event) => update('shares', event.target.value)}
      />

      <p className="flex items-baseline justify-between gap-3 rounded-xl border border-accent/20 bg-accent-subtle px-3 py-2.5 text-sm text-ink-muted">
        {t('purchase.calculated')}
        <span className="tnum text-base font-semibold text-accent-strong">
          {derivedPrice === null
            ? UNAVAILABLE
            : t('purchase.perShare', { value: formatMoney(derivedPrice) })}
        </span>
      </p>

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="flex-1" pending={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

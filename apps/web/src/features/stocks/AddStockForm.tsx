import {
  hasStockErrors,
  normalizeSymbol,
  validateStock,
  type StockFieldErrors,
} from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';

import { StockAdminError, useCreateStock } from './create-stock';

/**
 * Adds one entry to the shared stock master.
 *
 * The same rules run three times: here, so the user gets a sentence rather than
 * a rejection; in the Edge Function, because a browser check protects nobody;
 * and as CHECK constraints in the schema, which is the last word.
 */
export function AddStockForm() {
  const t = useT();
  const create = useCreateStock();

  const [symbol, setSymbol] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [fieldErrors, setFieldErrors] = useState<StockFieldErrors>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setAdded(null);

    const draft = { symbol, nameTh };
    const errors = validateStock(draft);
    setFieldErrors(errors);
    if (hasStockErrors(errors)) return;

    create.mutate(
      { symbol: normalizeSymbol(symbol), nameTh: nameTh.trim() },
      {
        onSuccess: (stock) => {
          setAdded(stock.symbol);
          setSymbol('');
          setNameTh('');
        },
        onError: (error) => {
          setFormError(error instanceof StockAdminError ? error.key : 'error.generic');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{t(formError)}</Alert> : null}
      {added ? <Alert tone="success">{t('master.added', { symbol: added })}</Alert> : null}

      <TextField
        label={t('master.symbol')}
        placeholder={t('master.symbolPlaceholder')}
        value={symbol}
        autoCapitalize="characters"
        spellCheck={false}
        error={fieldErrors.symbol ? t(fieldErrors.symbol) : undefined}
        onChange={(event) => setSymbol(event.target.value)}
      />

      <TextField
        label={t('master.nameTh')}
        placeholder={t('master.nameThPlaceholder')}
        value={nameTh}
        error={fieldErrors.nameTh ? t(fieldErrors.nameTh) : undefined}
        onChange={(event) => setNameTh(event.target.value)}
      />

      <p className="text-xs text-ink-faint">{t('master.serverNote')}</p>

      <Button type="submit" pending={create.isPending}>
        {t('master.submit')}
      </Button>
    </form>
  );
}

import type { Stock } from '@dcafolio/shared';

import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { useT } from '@/i18n/use-language';

import type { HistoryFilters as Filters } from './use-transaction-history';

type HistoryFiltersProps = {
  filters: Filters;
  /** Only stocks the user actually holds — an unowned filter finds nothing. */
  stocks: Stock[];
  hasFilters: boolean;
  onChange: (filters: Filters) => void;
  onClear: () => void;
};

export function HistoryFilters({
  filters,
  stocks,
  hasFilters,
  onChange,
  onClear,
}: HistoryFiltersProps) {
  const t = useT();

  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
      <div className="md:flex-1">
        <TextField
          label={t('history.search')}
          type="search"
          placeholder={t('history.searchPlaceholder')}
          value={filters.search ?? ''}
          onChange={(event) => update({ search: event.target.value })}
        />
      </div>

      <SelectField
        label={t('history.stock')}
        value={filters.stockId ?? ''}
        onChange={(event) => update({ stockId: event.target.value || undefined })}
      >
        <option value="">{t('history.allStocks')}</option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.symbol}
          </option>
        ))}
      </SelectField>

      <TextField
        label={t('history.from')}
        type="date"
        value={filters.from ?? ''}
        onChange={(event) => update({ from: event.target.value || undefined })}
      />

      <TextField
        label={t('history.to')}
        type="date"
        value={filters.to ?? ''}
        onChange={(event) => update({ to: event.target.value || undefined })}
      />

      {hasFilters ? (
        <Button variant="secondary" onClick={onClear}>
          {t('history.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}

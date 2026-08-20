import type { Stock } from '@dcafolio/shared';

import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';

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
  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
      <div className="md:flex-1">
        <TextField
          label="Search"
          type="search"
          placeholder="Symbol or Thai name"
          value={filters.search ?? ''}
          onChange={(event) => update({ search: event.target.value })}
        />
      </div>

      <SelectField
        label="Stock"
        value={filters.stockId ?? ''}
        onChange={(event) => update({ stockId: event.target.value || undefined })}
      >
        <option value="">All stocks</option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.symbol}
          </option>
        ))}
      </SelectField>

      <TextField
        label="From"
        type="date"
        value={filters.from ?? ''}
        onChange={(event) => update({ from: event.target.value || undefined })}
      />

      <TextField
        label="To"
        type="date"
        value={filters.to ?? ''}
        onChange={(event) => update({ to: event.target.value || undefined })}
      />

      {hasFilters ? (
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

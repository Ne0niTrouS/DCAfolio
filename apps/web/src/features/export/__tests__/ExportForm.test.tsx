import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchTransactions: vi.fn(),
  downloadBlob: vi.fn(),
  xlsxBlob: vi.fn(async () => new Blob(['xlsx'])),
}));

vi.mock('@/features/transactions/queries', () => ({
  fetchTransactions: mocks.fetchTransactions,
}));
vi.mock('@/lib/download', () => ({ downloadBlob: mocks.downloadBlob }));
vi.mock('../xlsx', () => ({ xlsxBlob: mocks.xlsxBlob }));

import { pickOption, searchOptions } from '@/test/combobox';
import { phrase } from '@/test/i18n-harness';

const { ExportForm } = await import('../ExportForm');

const CPALL: Stock = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

const PTT: Stock = {
  id: 'stock-ptt',
  symbol: 'PTT',
  nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

const TRANSACTION: TransactionWithStock = {
  id: 't1',
  userId: 'user-1',
  stockId: 'stock-cpall',
  purchaseDate: '2026-08-09',
  investedAmount: '12500.00',
  shares: '200',
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
  stock: CPALL,
};

function setup() {
  render(<ExportForm stocks={[CPALL, PTT]} currentYear={2026} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchTransactions.mockResolvedValue([TRANSACTION]);
  mocks.xlsxBlob.mockResolvedValue(new Blob(['xlsx']));
});

describe('ExportForm', () => {
  it('offers the four scopes and both formats', async () => {
    setup();

    expect(screen.getByLabelText(phrase('export.stock'))).toBeInTheDocument();
    expect(screen.getByLabelText(phrase('export.period'))).toBeInTheDocument();
    expect(screen.getByLabelText(phrase('export.format'))).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'XLSX' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CSV' })).toBeInTheDocument();

    // The stock field is a combobox, so its options exist only once opened.
    expect(screen.getByLabelText(phrase('export.stock'))).toHaveValue(
      phrase('export.allStocks'),
    );
    await userEvent.click(screen.getByLabelText(phrase('export.stock')));
    const list = await screen.findByRole('listbox', { name: phrase('export.stock') });
    expect(
      within(list).getByRole('option', { name: phrase('export.allStocks') }),
    ).toBeInTheDocument();
  });

  it('offers only the stocks the user actually holds, searchable', async () => {
    setup();

    await searchOptions(phrase('export.stock'), 'ปตท');

    const list = screen.getByRole('listbox', { name: phrase('export.stock') });
    expect(within(list).getByRole('option', { name: /^PTT/ })).toBeInTheDocument();
    expect(within(list).queryByRole('option', { name: /^CPALL/ })).not.toBeInTheDocument();
  });

  it('asks for a month only when the period is monthly', async () => {
    setup();

    expect(screen.queryByLabelText('Year')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Month')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(phrase('export.period')), 'yearly');
    expect(screen.getByLabelText(phrase('export.year'))).toBeInTheDocument();
    expect(screen.queryByLabelText('Month')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(phrase('export.period')), 'monthly');
    expect(screen.getByLabelText(phrase('export.month'))).toBeInTheDocument();
  });

  it('exports all stocks over all time as XLSX by default', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: phrase('export.export') }));

    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalled());
    expect(mocks.fetchTransactions).toHaveBeenCalledWith({
      stockId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(mocks.xlsxBlob).toHaveBeenCalledWith([TRANSACTION]);
    expect(mocks.downloadBlob.mock.calls[0]?.[1]).toBe('dcafolio_all_all-time.xlsx');
  });

  it('exports one stock for one month as CSV', async () => {
    setup();

    await pickOption(phrase('export.stock'), /^CPALL/);
    await userEvent.selectOptions(screen.getByLabelText(phrase('export.period')), 'monthly');
    await userEvent.selectOptions(screen.getByLabelText(phrase('export.month')), '8');
    await userEvent.selectOptions(screen.getByLabelText(phrase('export.format')), 'csv');
    await userEvent.click(screen.getByRole('button', { name: phrase('export.export') }));

    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalled());
    expect(mocks.fetchTransactions).toHaveBeenCalledWith({
      stockId: 'stock-cpall',
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(mocks.xlsxBlob).not.toHaveBeenCalled();
    expect(mocks.downloadBlob.mock.calls[0]?.[1]).toBe('dcafolio_CPALL_2026-08.csv');
  });

  it('exports a whole year', async () => {
    setup();

    await userEvent.selectOptions(screen.getByLabelText(phrase('export.period')), 'yearly');
    await userEvent.click(screen.getByRole('button', { name: phrase('export.export') }));

    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalled());
    expect(mocks.fetchTransactions).toHaveBeenCalledWith({
      stockId: undefined,
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });

  it('says so instead of producing an empty file', async () => {
    mocks.fetchTransactions.mockResolvedValue([]);
    setup();

    await userEvent.click(screen.getByRole('button', { name: phrase('export.export') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('export.noMatches'));
    expect(mocks.downloadBlob).not.toHaveBeenCalled();
  });

  it('reports a failed export instead of failing silently', async () => {
    mocks.fetchTransactions.mockRejectedValue(new Error('permission denied for table'));
    setup();

    await userEvent.click(screen.getByRole('button', { name: phrase('export.export') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('error.forbidden'));
    expect(mocks.downloadBlob).not.toHaveBeenCalled();
  });
});

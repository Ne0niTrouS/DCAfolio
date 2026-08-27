import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import { renderWithQuery } from '@/test/query-harness';
import { phrase } from '@/test/i18n-harness';

const { AddStockForm } = await import('../AddStockForm');

const CPALL_ROW = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  name_th: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  is_active: true,
};

function setup() {
  renderWithQuery(<AddStockForm />);
}

async function fill(symbol: string, nameTh: string) {
  await userEvent.type(screen.getByLabelText(phrase('master.symbol')), symbol);
  await userEvent.type(screen.getByLabelText(phrase('master.nameTh')), nameTh);
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: phrase('master.submit') }));
}

/** A non-2xx reply from an Edge Function, as supabase-js reports it. */
function functionError(status: number, key: string) {
  return {
    data: null,
    error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: key }), { status }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invoke.mockResolvedValue({ data: { stock: CPALL_ROW }, error: null });
});

describe('AddStockForm', () => {
  it('refuses an empty form without calling the server', async () => {
    setup();

    await submit();

    expect(screen.getByText(phrase('validation.symbolRequired'))).toBeInTheDocument();
    expect(screen.getByText(phrase('validation.nameThRequired'))).toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('refuses a symbol that is not a ticker without calling the server', async () => {
    setup();

    await fill('ซีพี ออลล์', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
    await submit();

    expect(screen.getByText(phrase('validation.symbolFormat'))).toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('sends the symbol uppercased and trimmed', async () => {
    setup();

    await fill('  cpall  ', '  บริษัท ซีพี ออลล์ จำกัด (มหาชน)  ');
    await submit();

    await waitFor(() =>
      expect(mocks.invoke).toHaveBeenCalledWith('stock-admin', {
        body: { symbol: 'CPALL', nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)' },
      }),
    );
  });

  it('confirms and clears the form so the next one can be typed straight away', async () => {
    setup();

    await fill('CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      phrase('master.added', { symbol: 'CPALL' }),
    );
    expect(screen.getByLabelText(phrase('master.symbol'))).toHaveValue('');
    expect(screen.getByLabelText(phrase('master.nameTh'))).toHaveValue('');
  });

  it('says the symbol is taken rather than showing a raw conflict', async () => {
    mocks.invoke.mockResolvedValue(functionError(409, 'error.symbolTaken'));
    setup();

    await fill('CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('error.symbolTaken'));
  });

  it('explains an expired session', async () => {
    mocks.invoke.mockResolvedValue(functionError(401, 'error.sessionExpired'));
    setup();

    await fill('CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('error.sessionExpired'));
  });

  it('never leaks an unrecognised failure', async () => {
    mocks.invoke.mockResolvedValue(functionError(500, 'something raw from postgres'));
    setup();

    await fill('CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('error.generic'));
  });
});

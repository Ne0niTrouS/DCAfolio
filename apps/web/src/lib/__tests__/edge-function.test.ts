import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

const { EdgeFunctionError, invokeEdgeFunction } = await import('../edge-function');

/** A non-2xx reply, as supabase-js reports it: the body hangs off `context`. */
function httpError(status: number, body: unknown) {
  return {
    data: null,
    error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify(body), { status }),
    }),
  };
}

/**
 * A fetch that never completed, as supabase-js reports it.
 *
 * The important detail is that `context` is the underlying *error*, not a
 * Response — the same field, a completely different type.
 */
function fetchError() {
  return {
    data: null,
    error: Object.assign(new Error('Failed to send a request to the Edge Function'), {
      context: new TypeError('Failed to fetch'),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('invokeEdgeFunction', () => {
  it('returns the payload when the call succeeds', async () => {
    mocks.invoke.mockResolvedValue({ data: { captured: 3 }, error: null });

    await expect(invokeEdgeFunction('market-data')).resolves.toEqual({ captured: 3 });
  });

  it('passes the body through', async () => {
    mocks.invoke.mockResolvedValue({ data: {}, error: null });

    await invokeEdgeFunction('stock-admin', { symbol: 'PTT' });

    expect(mocks.invoke).toHaveBeenCalledWith('stock-admin', { body: { symbol: 'PTT' } });
  });

  it('reads the phrase key the function replied with', async () => {
    mocks.invoke.mockResolvedValue(httpError(409, { error: 'error.symbolTaken' }));

    await expect(invokeEdgeFunction('stock-admin')).rejects.toThrow(
      expect.objectContaining({ key: 'error.symbolTaken' }),
    );
  });

  it('names an undeployed function rather than blaming the app', async () => {
    mocks.invoke.mockResolvedValue(httpError(404, { code: 'NOT_FOUND' }));

    await expect(invokeEdgeFunction('market-data')).rejects.toThrow(
      expect.objectContaining({ key: 'error.functionMissing' }),
    );
  });

  it('reports a request that never landed as a connection problem', async () => {
    // Regression: `context` is truthy here but is a TypeError, not a Response.
    // Testing it for truthiness alone reported a blocked CORS preflight as
    // "something went wrong" and sent the search in the wrong direction.
    mocks.invoke.mockResolvedValue(fetchError());

    await expect(invokeEdgeFunction('market-data')).rejects.toThrow(
      expect.objectContaining({ key: 'error.network' }),
    );
  });

  it('never leaks a raw server message', async () => {
    mocks.invoke.mockResolvedValue(
      httpError(500, { error: 'permission denied for table transactions' }),
    );

    await expect(invokeEdgeFunction('market-data')).rejects.toThrow(
      expect.objectContaining({ key: 'error.generic' }),
    );
  });

  it('logs an unrecognised failure so it is diagnosable at all', async () => {
    mocks.invoke.mockResolvedValue(httpError(503, { code: 'BOOT_ERROR' }));

    await expect(invokeEdgeFunction('market-data')).rejects.toBeInstanceOf(EdgeFunctionError);
    expect(console.error).toHaveBeenCalledWith('Edge Function "market-data" failed with 503:', {
      code: 'BOOT_ERROR',
    });
  });
});

import { vi } from 'vitest';

/**
 * A recording stand-in for the Supabase query builder.
 *
 * It records the table, the operation and every filter applied, so tests can
 * assert on the request that would be sent without pretending to reimplement
 * PostgREST. Only the I/O boundary is mocked — never the code under test.
 */
export type RecordedCall = {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  select?: string;
  payload?: unknown;
  filters: { method: string; args: unknown[] }[];
  order: { column: string; options?: unknown }[];
};

export function createSupabaseMock(result: { data?: unknown; error?: unknown } = {}) {
  const calls: RecordedCall[] = [];

  function builderFor(call: RecordedCall) {
    const response = { data: result.data ?? [], error: result.error ?? null };

    const builder: Record<string, unknown> = {
      // Awaiting the builder is what actually issues the request.
      then: (resolve: (value: typeof response) => unknown) =>
        Promise.resolve(resolve(response)),
    };

    for (const method of ['eq', 'gte', 'lte', 'in', 'ilike', 'neq']) {
      builder[method] = (...args: unknown[]) => {
        call.filters.push({ method, args });
        return builder;
      };
    }

    builder.order = (column: string, options?: unknown) => {
      call.order.push({ column, options });
      return builder;
    };

    builder.select = (select: string) => {
      call.select = select;
      return builder;
    };

    return builder;
  }

  const from = vi.fn((table: string) => ({
    select: (select: string) => {
      const call: RecordedCall = { table, operation: 'select', select, filters: [], order: [] };
      calls.push(call);
      return builderFor(call);
    },
    insert: (payload: unknown) => {
      const call: RecordedCall = {
        table,
        operation: 'insert',
        payload,
        filters: [],
        order: [],
      };
      calls.push(call);
      return builderFor(call);
    },
    update: (payload: unknown) => {
      const call: RecordedCall = {
        table,
        operation: 'update',
        payload,
        filters: [],
        order: [],
      };
      calls.push(call);
      return builderFor(call);
    },
    delete: () => {
      const call: RecordedCall = { table, operation: 'delete', filters: [], order: [] };
      calls.push(call);
      return builderFor(call);
    },
  }));

  return { supabase: { from }, calls, from };
}

import type { Market, Stock, TransactionWithStock } from '@dcafolio/shared';

/**
 * PostgREST serialises `numeric` as a JSON number, which would quietly round a
 * large amount. Every query therefore casts money and share columns to text
 * (`invested_amount::text`), and these mappers normalise whatever arrives back
 * into the decimal strings the rest of the app expects.
 */

export type StockRow = {
  id: string;
  symbol: string;
  name_th: string;
  market: string;
  is_active: boolean;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  stock_id: string;
  purchase_date: string;
  invested_amount: string | number;
  shares: string | number;
  created_at: string;
  updated_at: string;
  stocks: StockRow | null;
};

function toDecimalString(value: string | number): string {
  return typeof value === 'string' ? value : String(value);
}

export function mapStock(row: StockRow): Stock {
  return {
    id: row.id,
    symbol: row.symbol,
    nameTh: row.name_th,
    market: row.market as Market,
    isActive: row.is_active,
  };
}

const UNKNOWN_STOCK: Omit<Stock, 'id'> = {
  symbol: '—',
  nameTh: 'Unknown stock',
  market: 'SET',
  isActive: false,
};

export function mapTransaction(row: TransactionRow): TransactionWithStock {
  return {
    id: row.id,
    userId: row.user_id,
    stockId: row.stock_id,
    purchaseDate: row.purchase_date,
    investedAmount: toDecimalString(row.invested_amount),
    shares: toDecimalString(row.shares),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // A transaction cannot exist without its stock (FK + RESTRICT), but the
    // join is typed as nullable, so degrade rather than crash the page.
    stock: row.stocks ? mapStock(row.stocks) : { id: row.stock_id, ...UNKNOWN_STOCK },
  };
}

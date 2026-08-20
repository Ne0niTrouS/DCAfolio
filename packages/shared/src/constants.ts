/** Product identity. Used in the login screen, page titles and export metadata. */
export const APP_NAME = 'DCAfolio';
export const APP_SUBTITLE = 'Personal Stock Tracker';
export const APP_CREDIT = 'NeOniTrouS';

/** V1 is deliberately Thai SET only. Widening this is a scope change. */
export const SUPPORTED_MARKETS = ['SET'] as const;
export type Market = (typeof SUPPORTED_MARKETS)[number];

export const CURRENCY_CODE = 'THB';
export const CURRENCY_SYMBOL = '฿';

/** Decimal places used at the display/storage boundary. */
export const MONEY_DECIMALS = 2;
export const SHARE_DECIMALS = 4;
export const PERCENT_DECIMALS = 2;

/**
 * A cached market price older than this is treated as stale at read time, even
 * if nothing has flagged it. Keeps staleness honest when the refresh job stops.
 */
export const MARKET_PRICE_STALE_AFTER_MINUTES = 30;

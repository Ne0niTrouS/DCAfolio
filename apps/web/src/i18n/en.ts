/**
 * English dictionary — the source of truth for the key set.
 *
 * `TranslationKey` is derived from this object, so every other language is
 * checked against it at compile time: a missing or misspelled Thai key is a
 * type error, not a string that silently renders as its own key at runtime.
 *
 * Placeholders use `{name}` and are substituted by `t()`.
 */
export const en = {
  // --- common ---------------------------------------------------------
  'common.appSubtitle': 'Personal Stock Tracker',
  'common.dashboard': 'Dashboard',
  'common.history': 'History',
  'common.export': 'Export',
  'common.addPurchase': 'Add Purchase',
  'common.logout': 'Logout',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.loading': 'Loading…',
  'common.working': 'Working…',
  'common.tryAgain': 'Try again',
  'common.skipToContent': 'Skip to content',
  'common.backToDashboard': 'Back to the dashboard',
  'common.backToLogin': 'Back to login',
  'common.notFoundTitle': 'Page not found',
  'common.notFoundBody': 'That page does not exist.',
  'common.language': 'Language',
  'common.account': 'Account',
  'common.sharesUnit': 'shares',

  // --- accessible labels for signed figures ---------------------------
  'value.profit': 'profit',
  'value.loss': 'loss',
  'value.breakEven': 'break-even',

  // --- relative time --------------------------------------------------
  'time.justNow': 'just now',
  'time.minutesAgo': '{count} min ago',
  'time.hourAgo': '1 hour ago',
  'time.hoursAgo': '{count} hours ago',
  'time.dayAgo': '1 day ago',
  'time.daysAgo': '{count} days ago',

  // --- auth -----------------------------------------------------------
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.login': 'Login',
  'auth.invalidEmail': 'Enter a valid email address.',
  'auth.passwordRequired': 'Enter your password.',
  'auth.resetTitle': 'Reset your password',
  'auth.sendResetLink': 'Send reset link',
  'auth.resetSent': 'If an account exists for that address, a reset link has been sent.',
  'auth.chooseNewPassword': 'Choose a new password',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.updatePassword': 'Update password',
  'auth.passwordHint': 'At least {count} characters.',
  'auth.passwordTooShort': 'Use at least {count} characters.',
  'auth.passwordsDoNotMatch': 'Passwords do not match.',

  // --- errors (mapped from Supabase failures) -------------------------
  'error.generic': 'Something went wrong. Please try again.',
  'error.invalidCredentials': 'Incorrect email or password.',
  'error.emailNotConfirmed': 'This email address has not been confirmed yet.',
  'error.rateLimited': 'Too many attempts. Please wait a moment and try again.',
  'error.network': 'Could not reach the server. Check your connection and try again.',
  'error.passwordTooShort': 'That password is too short.',
  'error.samePassword': 'The new password must be different from the current one.',
  'error.linkExpired': 'This link is no longer valid. Request a new password reset email.',
  'error.investedAmountPositive': 'Invested amount must be greater than 0.',
  'error.sharesPositive': 'Shares must be greater than 0.',
  'error.purchaseDateFuture': 'Purchase date cannot be in the future.',
  'error.stockUnavailable': 'That stock is no longer available. Pick another one.',
  'error.forbidden': 'You do not have access to that record.',
  'error.sessionExpired': 'Your session has expired. Sign in again.',

  // --- form validation (codes come from @dcafolio/shared) -------------
  'validation.selectPurchaseDate': 'Select a purchase date.',
  'validation.invalidDate': 'Enter a valid date.',
  'validation.futureDate': 'Purchase date cannot be in the future.',
  'validation.selectStock': 'Select a stock.',
  'validation.investedAmountRequired': 'Enter the amount invested.',
  'validation.investedAmountPositive': 'Invested amount must be greater than 0.',
  /** Mirrors MONEY_DECIMALS in @dcafolio/shared. */
  'validation.moneyDecimals': 'Use at most 2 decimal places.',
  'validation.sharesRequired': 'Enter the number of shares received.',
  'validation.sharesPositive': 'Shares must be greater than 0.',
  /** Mirrors SHARE_DECIMALS in @dcafolio/shared. */
  'validation.shareDecimals': 'Use at most 4 decimal places.',

  // --- dashboard ------------------------------------------------------
  'dashboard.title': 'Dashboard',
  'dashboard.portfolioValue': 'Portfolio Value',
  'dashboard.totalInvested': 'Total Invested',
  'dashboard.profitLoss': 'Profit/Loss',
  'dashboard.returnPercent': 'Return %',
  'dashboard.dcaPerMonth': 'DCA / Month',
  'dashboard.partialPricing': 'Partial — some stocks have no price yet',
  'dashboard.allocation': 'Portfolio Allocation',
  'dashboard.recentTransactions': 'Recent Transactions',
  'dashboard.viewAll': 'View All',
  'dashboard.emptyTitle': 'No investments yet.',
  'dashboard.emptyBody': 'Add your first stock purchase.',
  'dashboard.loadError': 'Could not load your portfolio.',
  'dashboard.loadingPortfolio': 'Loading your portfolio…',

  // --- market data ----------------------------------------------------
  'market.open': 'Market open',
  'market.closed': 'Market closed',
  'market.unknown': 'Market status unknown',
  'market.provider': 'Provider: {provider}',
  'market.updated': 'Updated {time}',
  'market.mockBadge': 'Mock data — not real prices',
  'market.cachedBadge': 'Cached — may be out of date',
  'market.noPriceYet': 'No market price yet',
  'market.cachedPrice': 'Cached price — may be out of date',

  // --- history --------------------------------------------------------
  'history.title': 'History',
  'history.search': 'Search',
  'history.searchPlaceholder': 'Symbol or Thai name',
  'history.stock': 'Stock',
  'history.allStocks': 'All stocks',
  'history.from': 'From',
  'history.to': 'To',
  'history.date': 'Date',
  'history.investedAmount': 'Invested Amount',
  'history.shares': 'Shares',
  'history.pricePerShare': 'Price/Share',
  'history.actions': 'Actions',
  'history.clearFilters': 'Clear filters',
  'history.caption': 'Purchase history',
  'history.emptyTitle': 'No transactions yet.',
  'history.noMatches': 'No transactions match these filters.',
  'history.loadError': 'Could not load your transactions.',
  'history.loadingTransactions': 'Loading your transactions…',
  'history.editRow': 'Edit {symbol} on {date}',
  'history.deleteRow': 'Delete {symbol} on {date}',

  // --- add / edit purchase --------------------------------------------
  'purchase.addTitle': 'Add Purchase',
  'purchase.editTitle': 'Edit Purchase',
  'purchase.purchaseDate': 'Purchase Date',
  'purchase.stock': 'Stock',
  'purchase.selectStock': 'Select a stock',
  'purchase.investedAmount': 'Invested Amount',
  'purchase.sharesReceived': 'Shares Received',
  'purchase.calculated': 'Calculated',
  'purchase.perShare': '{value}/share',
  'purchase.deleteTitle': 'Delete Transaction?',
  'purchase.deleteWarning': 'This will recalculate the portfolio.',

  // --- export ---------------------------------------------------------
  'export.title': 'Export Data',
  'export.description': 'Your purchases as CSV or XLSX.',
  'export.privacyNote': 'Exports contain only your own data.',
  'export.stock': 'Stock',
  'export.allStocks': 'All Stocks',
  'export.period': 'Period',
  'export.allTime': 'All time',
  'export.monthly': 'Monthly',
  'export.yearly': 'Yearly',
  'export.year': 'Year',
  'export.month': 'Month',
  'export.format': 'Format',
  'export.export': 'Export',
  'export.noMatches': 'No transactions match this selection.',
  'export.month.1': 'January',
  'export.month.2': 'February',
  'export.month.3': 'March',
  'export.month.4': 'April',
  'export.month.5': 'May',
  'export.month.6': 'June',
  'export.month.7': 'July',
  'export.month.8': 'August',
  'export.month.9': 'September',
  'export.month.10': 'October',
  'export.month.11': 'November',
  'export.month.12': 'December',

  // --- stock detail ---------------------------------------------------
  'stock.shares': 'Shares',
  'stock.totalInvested': 'Total Invested',
  'stock.averageCost': 'Average Cost',
  'stock.currentPrice': 'Current Price',
  'stock.currentValue': 'Current Value',
  'stock.profitLoss': 'Profit/Loss',
  'stock.return': 'Return',
  'stock.allocation': 'Allocation',
  'stock.purchaseHistory': 'Purchase history',
  'stock.loading': 'Loading {symbol}…',
  'stock.loadError': 'Could not load this stock.',
  'stock.emptyTitle': 'No purchases recorded for {symbol}.',
  'stock.emptyBody': 'Once you record a purchase of this stock it will appear here.',
  'stock.noPriceCaptured': 'No market price has been captured for this stock yet.',
  'stock.priceFrom': 'Price from {provider}, updated {time}',
  'stock.priceFromCached': 'Price from {provider}, updated {time} — cached, may be out of date',
} as const;

export type TranslationKey = keyof typeof en;

/** Every language ships the full key set; no runtime fallback is needed. */
export type Dictionary = Record<TranslationKey, string>;

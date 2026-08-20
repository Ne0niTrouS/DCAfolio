/**
 * Pure, decimal-safe financial math for DCAfolio.
 *
 * No React, no Supabase, no I/O. Everything here is testable with plain data,
 * so a future API or React Native client can reuse it unchanged.
 */
export * from './decimal';
export * from './primitives';
export * from './dca';
export * from './portfolio';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'shared',
          root: './packages/shared',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'calculation',
          root: './packages/calculation',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // Schema, constraint and RLS tests run against an in-process Postgres
        // (PGlite) with a minimal Supabase shim, so they need no Docker.
        test: {
          name: 'database',
          root: './supabase',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: './apps/web/vite.config.ts',
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          // Placeholder credentials so modules that assert on configuration can
          // load. The Supabase client itself is mocked in tests.
          env: {
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key',
            VITE_MARKET_DATA_PROVIDER: 'mock',
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**', 'apps/web/src/**'],
      exclude: ['**/__tests__/**', '**/*.test.*'],
    },
  },
});

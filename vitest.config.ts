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

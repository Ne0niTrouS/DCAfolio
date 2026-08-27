import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Where the site is served from.
 *
 * `/` for a site root — Cloudflare Pages, or an IIS site of its own. An IIS
 * *application* nested under a site is served from a sub-path, and needs that
 * path here with both slashes (`/dcafolio/`); otherwise every asset URL points
 * one level too high and the page loads blank.
 *
 * Read from the process rather than Vite's env, because `base` is needed before
 * the env plugin has run.
 */
const base = process.env['VITE_BASE_PATH'] ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  // .env lives at the monorepo root, next to .env.example. Without this Vite
  // would look in apps/web/ and silently find nothing.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Rolldown emits a single chunk by default. Splitting keeps the export
    // writer — the largest dependency — out of the initial download for
    // someone who never exports.
    rolldownOptions: {
      output: { codeSplitting: true },
    },
  },
});

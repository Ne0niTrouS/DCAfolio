import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

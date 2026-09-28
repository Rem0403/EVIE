import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Firebase alone is ~500 kB minified (~150 kB gzip); it is split out below and cached long-term.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/]@?firebase/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    // Rules tests need the Firestore emulator, so they only run under `npm run test:rules`.
    exclude: process.env.FIRESTORE_EMULATOR_HOST ? configDefaults.exclude : [...configDefaults.exclude, 'test/**'],
  },
});

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
    // Tests never talk to the real Firebase project. Blanking its config here makes a local run behave
    // like CI (which has no .env.local): a test that forgets to mock the data layer fails on this PC too,
    // instead of quietly using the real project.
    env: {
      VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_AUTH_DOMAIN: '', VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '', VITE_FIREBASE_APP_ID: '', VITE_APPCHECK_SITE_KEY: '',
    },
    // Rules tests need the Firestore emulator, so they only run under `npm run test:rules`.
    exclude: process.env.FIRESTORE_EMULATOR_HOST ? configDefaults.exclude : [...configDefaults.exclude, 'test/**'],
  },
});

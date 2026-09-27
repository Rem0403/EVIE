import { describe, it, expect } from 'vitest';
import { missingConfig, REQUIRED_ENV } from './config.js';

describe('missingConfig', () => {
  it('returns nothing when every key is set', () => {
    const env = Object.fromEntries(REQUIRED_ENV.map((k) => [k, 'x']));
    expect(missingConfig(env)).toEqual([]);
  });
  it('lists keys that are missing or blank', () => {
    const env = Object.fromEntries(REQUIRED_ENV.map((k) => [k, 'x']));
    delete env.VITE_FIREBASE_API_KEY;
    env.VITE_FIREBASE_APP_ID = '';
    expect(missingConfig(env)).toEqual(['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_APP_ID']);
  });
});

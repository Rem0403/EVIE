import { afterEach, describe, it, expect, vi } from 'vitest';
import { withTimeout } from './timeout.js';

afterEach(() => vi.useRealTimers());

describe('withTimeout', () => {
  it('passes through a result that arrives in time', async () => {
    await expect(withTimeout(Promise.resolve(5), 1000)).resolves.toBe(5);
  });
  it('rejects when the promise never settles', async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 1000);
    vi.advanceTimersByTime(1000);
    await expect(p).rejects.toThrow('timed out');
  });
});

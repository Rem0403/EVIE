import { afterEach, beforeAll, expect, test, vi } from 'vitest';

// Loads public/sw.js against a fake service worker scope and cache.
const handlers = {};
const store = new Map();
beforeAll(async () => {
  globalThis.self = { location: new URL('https://evie.test/'), addEventListener: (type, fn) => { handlers[type] = fn; } };
  globalThis.caches = {
    open: async () => ({ put: async (key, res) => store.set(typeof key === 'string' ? key : new URL(key.url).pathname, res) }),
    match: async (key) => store.get(typeof key === 'string' ? key : new URL(key.url).pathname),
  };
  await import('../public/sw.js');
});
afterEach(() => {
  store.clear();
  vi.useRealTimers();
});

function request(path, mode = 'cors') {
  let responded;
  handlers.fetch({ request: { url: `https://evie.test${path}`, method: 'GET', mode }, respondWith: (p) => { responded = p; } });
  return responded;
}
const html = (body) => new Response(body, { headers: { 'content-type': 'text/html' } });

test('a hanging network opens the saved copy after a few seconds', async () => {
  vi.useFakeTimers();
  store.set('/', html('saved'));
  globalThis.fetch = () => new Promise(() => {}); // weak signal: never answers
  const res = request('/', 'navigate');
  await vi.advanceTimersByTimeAsync(4000);
  expect(await (await res).text()).toBe('saved');
});

test('index.html served for a missing asset is not cached as that asset', async () => {
  globalThis.fetch = async () => html('<!doctype html>');
  await request('/assets/App-old.js');
  await new Promise((r) => setTimeout(r, 0));
  expect(store.has('/assets/App-old.js')).toBe(false);
});

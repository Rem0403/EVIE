// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { clearEvieStorage, deleteMediaDatabase, setNextNotice, takeNotice } from './wipe.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

it("clears EVIE's saved state but keeps appearance and other sites' data", () => {
  localStorage.setItem('evie.session', '{"circleId":"c1"}');
  localStorage.setItem('evie.seizureDraft', '{}');
  localStorage.setItem('evie.gettingStarted.hidden.c1', '1');
  localStorage.setItem('evie.theme', 'dark');
  localStorage.setItem('evie.palette', 'blue');
  localStorage.setItem('other', 'x');
  clearEvieStorage();
  expect(Object.keys(localStorage).sort()).toEqual(['evie.palette', 'evie.theme', 'other']);
});

it('deletes the media database, and never hangs when it is blocked or unavailable', async () => {
  const fakeIdb = (event) => ({
    deleteDatabase(name) {
      const req = { name };
      setTimeout(() => req[event]?.());
      return req;
    },
  });
  expect(await deleteMediaDatabase(fakeIdb('onsuccess'))).toBe(true);
  expect(await deleteMediaDatabase(fakeIdb('onblocked'))).toBe(false);
  expect(await deleteMediaDatabase(fakeIdb('onerror'))).toBe(false);
  expect(await deleteMediaDatabase(null)).toBe(false);
});

it('carries one message across the reload, then forgets it', () => {
  setNextNotice('You left');
  expect(takeNotice()).toBe('You left');
  expect(takeNotice()).toBe('');
});

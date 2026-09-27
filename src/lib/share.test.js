// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { shareJoinCode, shareMessage } from './share.js';

const circle = { personName: 'Evie', joinCode: 'EVIE-1234' };

afterEach(() => {
  delete navigator.share;
  vi.restoreAllMocks();
});

describe('shareJoinCode', () => {
  it('treats closing the share sheet as cancelled, not failed', async () => {
    navigator.share = vi.fn(() => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })));
    expect(await shareJoinCode(circle)).toBe('cancelled');
  });
});

describe('shareMessage', () => {
  it('confirms a copy', () => expect(shareMessage('copied', circle)).toBe('Invite copied!'));
  it('tells the user the code when sharing fails', () => {
    expect(shareMessage('failed', circle)).toBe("Couldn't share. Give them the code EVIE-1234.");
  });
  it('says nothing after a native share or a cancel', () => {
    expect(shareMessage('shared', circle)).toBe('');
    expect(shareMessage('cancelled', circle)).toBe('');
  });
});

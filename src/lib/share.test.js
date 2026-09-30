// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { inviteCodeFrom, inviteLink, shareJoinCode, shareMessage } from './share.js';

const circle = { personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP' };

afterEach(() => {
  delete navigator.share;
  vi.restoreAllMocks();
});

describe('inviteLink', () => {
  it('carries the code so the join form opens filled in', () => {
    expect(inviteLink(circle)).toBe(`${location.origin}/#join=MAYA-7KQ4-M2XP`);
  });
  it('reads the code back from new #join links and older ?join links', () => {
    expect(inviteCodeFrom({ hash: '#join=MAYA-7KQ4-M2XP', search: '' })).toBe('MAYA-7KQ4-M2XP');
    expect(inviteCodeFrom({ hash: '', search: '?join=EVIE-7KQ4-M2XP' })).toBe('EVIE-7KQ4-M2XP');
    expect(inviteCodeFrom({ hash: '', search: '?demo=1' })).toBe('');
  });
});

describe('shareJoinCode', () => {
  it('shares the invite link', async () => {
    navigator.share = vi.fn(() => Promise.resolve());
    expect(await shareJoinCode(circle)).toBe('shared');
    expect(navigator.share.mock.calls[0][0].url).toBe(inviteLink(circle));
  });
  it('treats closing the share sheet as cancelled, not failed', async () => {
    navigator.share = vi.fn(() => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })));
    expect(await shareJoinCode(circle)).toBe('cancelled');
  });
});

describe('shareMessage', () => {
  it('confirms a copy', () => expect(shareMessage('copied', circle)).toBe('Invite copied.'));
  it('tells the user the code when sharing fails', () => {
    expect(shareMessage('failed', circle)).toBe("Couldn't share. Give them the code MAYA-7KQ4-M2XP.");
  });
  it('says nothing after a native share or a cancel', () => {
    expect(shareMessage('shared', circle)).toBe('');
    expect(shareMessage('cancelled', circle)).toBe('');
  });
});

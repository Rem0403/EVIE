// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSeizureDraft, loadSeizureDraft, saveSeizureDraft } from './seizureDraft.js';

const HOUR = 3600 * 1000;

beforeEach(() => localStorage.clear());

describe('seizure draft', () => {
  it('keeps timing and answers, including across the app closing (localStorage)', () => {
    saveSeizureDraft({ startMs: 1000, stopMs: 61000, step: 3, seizureType: 'focal', triggers: ['fever'] });
    expect(loadSeizureDraft()).toMatchObject({ startMs: 1000, stopMs: 61000, step: 3, seizureType: 'focal', triggers: ['fever'] });
    expect(sessionStorage.length).toBe(0);
  });

  it('drops a draft left for more than 12 hours', () => {
    saveSeizureDraft({ startMs: Date.now() });
    expect(loadSeizureDraft(Date.now() + 11 * HOUR)).not.toBeNull();
    expect(loadSeizureDraft(Date.now() + 13 * HOUR)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('ignores missing or broken drafts', () => {
    expect(loadSeizureDraft()).toBeNull();
    localStorage.setItem('evie.seizureDraft', '{not json');
    expect(loadSeizureDraft()).toBeNull();
  });

  it('clears', () => {
    saveSeizureDraft({ startMs: 1 });
    clearSeizureDraft();
    expect(loadSeizureDraft()).toBeNull();
  });
});

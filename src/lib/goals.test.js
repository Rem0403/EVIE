import { describe, expect, it } from 'vitest';
import { cleanGoal, EMPTY_GOAL, goalProgress, goalTally, practiceText, progressText, sortGoals } from './goals.js';
import { detailRows, entryTitle } from './format.js';
import { sinceText } from './handoff.js';
import { summaryReport } from './summary.js';

const DAY = 24 * 3600 * 1000;
const tryOf = (goalId, occurredAt, result, goalTitle = 'Ask for more') => ({ type: 'goal', goalId, goalTitle, occurredAt, result });

describe('cleanGoal', () => {
  it('trims and keeps the fields', () => {
    expect(cleanGoal({ ...EMPTY_GOAL, title: '  Ask for more ', workingWith: ' speech ' })).toEqual([
      { title: 'Ask for more', area: 'communication', status: 'active', details: '', workingWith: 'speech' }, null,
    ]);
  });
  it('needs a title', () => {
    expect(cleanGoal({ ...EMPTY_GOAL, title: '  ' })).toEqual([null, 'Say what the goal is.']);
  });
  it('refuses ID numbers', () => {
    expect(cleanGoal({ ...EMPTY_GOAL, title: 'Call about Medicaid ID 12345678901' })[1]).toMatch(/ID numbers/);
  });
});

describe('sortGoals', () => {
  it('puts goals being worked on first, then paused, then met, newest first', () => {
    const goals = [
      { id: 'met', status: 'met', createdAt: 5 },
      { id: 'old', status: 'active', createdAt: 1 },
      { id: 'paused', status: 'paused', createdAt: 9 },
      { id: 'new', status: 'active', createdAt: 3 },
    ];
    expect(sortGoals(goals).map((g) => g.id)).toEqual(['new', 'old', 'paused', 'met']);
  });
});

describe('goalProgress', () => {
  const entries = [
    tryOf('g1', 10 * DAY, 'own'), tryOf('g1', 11 * DAY, 'help'), tryOf('g1', 12 * DAY, 'help'),
    tryOf('g1', 2 * DAY, 'not_yet'), tryOf('g2', 12 * DAY, 'own'), { type: 'note', occurredAt: 12 * DAY },
  ];
  it('counts one goal’s tries since a time, and finds the latest', () => {
    const p = goalProgress(entries, 'g1', 5 * DAY);
    expect(p).toMatchObject({ total: 3, own: 1, help: 2, notYet: 0 });
    expect(p.last.occurredAt).toBe(12 * DAY);
    expect(progressText(p)).toBe('1 on their own · 2 with help');
  });
  it('is empty for a goal never practiced', () => {
    expect(goalProgress(entries, 'nope')).toMatchObject({ total: 0, last: null });
  });
});

describe('goalTally', () => {
  it('groups tries by goal, most practiced first, titled by the newest try', () => {
    const rows = goalTally([
      tryOf('g1', 1, 'own', 'Old name'), tryOf('g1', 3, 'help', 'Ask for more'), tryOf('g1', 2, 'own', 'Old name'),
      tryOf('g2', 1, 'not_yet', 'Shoes'),
    ]);
    expect(rows.map((r) => [r.title, r.total])).toEqual([['Ask for more', 3], ['Shoes', 1]]);
    expect(practiceText(rows[0])).toBe('Practiced 3 times: 2 on their own · 1 with help');
    expect(practiceText(rows[1])).toBe('Practiced 1 time: 1 not yet');
  });
});

describe('goal entries elsewhere', () => {
  const e = { ...tryOf('g1', Date.now(), 'help'), createdByName: 'Mom' };
  it('reads on the timeline and in the entry details', () => {
    expect(entryTitle(e)).toBe('Ask for more · With help');
    expect(detailRows(e).slice(2)).toEqual([['Goal', 'Ask for more'], ['How it went', 'With help']]);
  });
  it('is counted in a handoff', () => {
    expect(sinceText([e, { ...e }], 0, Date.now() + 1)).toBe('2 goal practices');
  });
  it('is in the care summary', () => {
    expect(summaryReport([e], 7).goals.map((g) => g.title)).toEqual(['Ask for more']);
  });
});

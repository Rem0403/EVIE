import { describe, expect, it } from 'vitest';
import { currentHandoff, sinceText, untilFromTime } from './handoff.js';

const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();

describe('currentHandoff', () => {
  it('is the latest handoff entry, whatever the list order', () => {
    const a = { type: 'handoff', occurredAt: at(28, 7) };
    const b = { type: 'handoff', occurredAt: at(28, 15) };
    expect(currentHandoff([a, { type: 'note', occurredAt: at(28, 16) }, b])).toBe(b);
    expect(currentHandoff([{ type: 'note', occurredAt: at(28) }])).toBeNull();
  });
});

describe('sinceText', () => {
  it('sums up what was logged after a time, in plain words', () => {
    const entries = [
      { type: 'seizure', occurredAt: at(28, 9) },
      { type: 'med', occurredAt: at(28, 8, 5), status: 'given' },
      { type: 'med', occurredAt: at(28, 12), status: 'given' },
      { type: 'med', occurredAt: at(28, 20), status: 'missed' },
      { type: 'med', occurredAt: at(28, 9, 3), status: 'rescue' },
      { type: 'behavior', occurredAt: at(28, 10), kind: 'meltdown' },
      { type: 'behavior', occurredAt: at(28, 11), kind: 'meltdown' },
      { type: 'note', occurredAt: at(28, 12) },
      { type: 'handoff', occurredAt: at(28, 13) },
      { type: 'seizure', occurredAt: at(28, 6) }, // before
    ];
    expect(sinceText(entries, at(28, 7), at(28, 21))).toBe(
      '1 seizure · rescue med given · 2 doses given · 1 missed dose · 2 meltdowns · 1 note',
    );
  });
  it('words every behavior kind correctly', () => {
    const b = (kind, h) => ({ type: 'behavior', occurredAt: at(28, h), kind });
    expect(sinceText([b('self_injury', 8), b('self_injury', 9), b('anxious', 10), b('good_day', 11), b('mystery', 12)], at(28, 7), at(28, 21)))
      .toBe('2 self-injuries · 1 anxious or distressed time · 1 good day · 1 other behavior');
  });
  it('says so when nothing was logged', () => {
    expect(sinceText([], at(28, 7), at(28, 9))).toBe('Nothing logged');
  });
});

describe('untilFromTime', () => {
  it('uses today, or tomorrow when the time has already passed', () => {
    expect(untilFromTime('15:00', at(28, 9))).toBe(at(28, 15));
    expect(untilFromTime('07:00', at(28, 22))).toBe(at(29, 7));
    expect(untilFromTime('', at(28, 9))).toBeUndefined();
  });
});

describe('sinceText, rescue on the seizure', () => {
  it('mentions rescue med given during a logged seizure', () => {
    expect(sinceText([{ type: 'seizure', occurredAt: at(28, 9), rescueMedGiven: true }], at(28, 7), at(28, 10)))
      .toBe('1 seizure · rescue med given');
  });
});

import { describe, expect, it } from 'vitest';
import { lastSleep, recentSeizures } from './home.js';

const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();

describe('recentSeizures', () => {
  it('counts seizures in the last 7 days and finds the latest', () => {
    const entries = [
      { type: 'seizure', occurredAt: at(27, 6, 50) },
      { type: 'seizure', occurredAt: at(22, 9) },
      { type: 'seizure', occurredAt: at(20, 9) }, // 8 days before now: outside the window
      { type: 'note', occurredAt: at(28, 8) },
    ];
    expect(recentSeizures(entries, at(28, 10))).toEqual({ count: 2, last: entries[0] });
  });
  it('handles none', () => {
    expect(recentSeizures([], at(28, 10))).toEqual({ count: 0, last: null });
  });
});

describe('lastSleep', () => {
  it('is the most recent sleep log from the last 36 hours, with its length', () => {
    const night = { type: 'sleep', occurredAt: at(28, 6), bedtime: at(28, 0, 15), wakeTime: at(28, 6), quality: 1 };
    const older = { type: 'sleep', occurredAt: at(27, 7), bedtime: at(26, 22), wakeTime: at(27, 7), quality: 3 };
    expect(lastSleep([older, night], at(28, 10))).toEqual({ entry: night, minutes: 345 });
  });
  it('ignores logs older than 36 hours', () => {
    expect(lastSleep([{ type: 'sleep', occurredAt: at(26, 7), bedtime: at(25, 22), wakeTime: at(26, 7) }], at(28, 10))).toBeNull();
  });
});

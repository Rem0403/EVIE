import { describe, it, expect } from 'vitest';
import { buildDemoWeek } from './demoWeek.js';
import { patterns, seizureStats } from './summary.js';

const now = new Date(2026, 8, 26, 12, 0).getTime();
const me = { uid: 'u1', name: 'Remy' };

describe('buildDemoWeek', () => {
  const entries = buildDemoWeek(now, me);

  it('produces realistic volume across every entry type', () => {
    const types = new Set(entries.map((e) => e.type));
    expect([...types].sort()).toEqual(['behavior', 'med', 'note', 'seizure', 'sleep']);
    expect(entries.length).toBeGreaterThan(30);
  });

  it('has 4 seizures', () => expect(seizureStats(entries).count).toBe(4));

  it('triggers the poor-sleep and morning patterns, but not missed-med', () => {
    expect(patterns(entries).map((p) => p.id)).toEqual(['poor_sleep', 'time_of_day']);
  });

  it('never puts entries in the future and attributes every entry', () => {
    for (const e of entries) {
      expect(e.occurredAt).toBeLessThanOrEqual(now);
      expect(e.createdBy).toBe('u1');
      expect(e.createdByName).toBeTruthy();
    }
  });

  it('is sorted newest first', () => {
    const times = entries.map((e) => e.occurredAt);
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

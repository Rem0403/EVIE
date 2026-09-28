import { describe, it, expect } from 'vitest';
import { seizureStats, dayStrip, patterns, countByType, triggerCounts, clusterCount, previousSeizureCount, summaryReport } from './summary.js';

const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();
const seizure = (occurredAt, extra = {}) => ({ type: 'seizure', occurredAt, durationSec: 60, seizureType: 'unknown', ...extra });
const sleep = (bedtime, wakeTime, quality = 3) => ({ type: 'sleep', occurredAt: wakeTime, bedtime, wakeTime, quality });
const missed = (occurredAt) => ({ type: 'med', occurredAt, medName: 'Keppra', status: 'missed' });

describe('seizureStats', () => {
  it('computes count, average, max, rescue uses and type breakdown', () => {
    const stats = seizureStats([
      seizure(at(20, 7), { durationSec: 100, seizureType: 'tonic-clonic', rescueMedGiven: true }),
      seizure(at(21, 7), { durationSec: 50, seizureType: 'focal' }),
      { type: 'med', occurredAt: at(21, 8), status: 'given' },
    ]);
    expect(stats).toEqual({
      count: 2, avgDurationSec: 75, maxDurationSec: 100, rescueCount: 1, byType: { 'tonic-clonic': 1, focal: 1 },
    });
  });
  it('handles no seizures', () => {
    expect(seizureStats([])).toEqual({ count: 0, avgDurationSec: 0, maxDurationSec: 0, rescueCount: 0, byType: {} });
  });
  it('treats missing duration and type as 0 / unknown', () => {
    expect(seizureStats([{ type: 'seizure', occurredAt: at(20, 7) }])).toEqual({
      count: 1, avgDurationSec: 0, maxDurationSec: 0, rescueCount: 0, byType: { unknown: 1 },
    });
  });
});

describe('dayStrip', () => {
  it('builds one row per day, oldest first, with markers', () => {
    const rows = dayStrip(
      [seizure(at(21, 7)), missed(at(21, 20)), sleep(at(21, 23), at(22, 7), 1), seizure(at(19, 7))],
      at(20, 0),
      at(22, 23, 59),
    );
    expect(rows).toEqual([
      { date: at(20), seizures: 0, missedMeds: 0, sleepQuality: null },
      { date: at(21), seizures: 1, missedMeds: 1, sleepQuality: null },
      { date: at(22), seizures: 0, missedMeds: 0, sleepQuality: 1 },
    ]);
  });
});

describe('patterns', () => {
  it('returns nothing with fewer than 2 seizures', () => {
    expect(patterns([seizure(at(20, 7)), sleep(at(20, 1), at(20, 5))])).toEqual([]);
  });

  it('flags seizures after short sleep', () => {
    const result = patterns([
      sleep(at(20, 1), at(20, 6)), seizure(at(20, 14)), // 5h sleep
      sleep(at(21, 0), at(21, 5)), seizure(at(21, 15)), // 5h sleep
    ]);
    expect(result.find((p) => p.id === 'poor_sleep')).toEqual({
      id: 'poor_sleep', matched: 2, total: 2, text: '2 of 2 seizures followed a night under 6h sleep or poor sleep.',
    });
  });

  it('counts poor-quality sleep even when it was long', () => {
    const result = patterns([
      sleep(at(19, 21), at(20, 7), 1), seizure(at(20, 14)),
      sleep(at(20, 21), at(21, 7), 1), seizure(at(21, 15)),
    ]);
    expect(result.map((p) => p.id)).toContain('poor_sleep');
  });

  it('ignores sleep that ended more than 18h before the seizure', () => {
    const result = patterns([
      sleep(at(19, 1), at(19, 5)), seizure(at(20, 14)), // 33h gap
      sleep(at(20, 1), at(20, 5)), seizure(at(21, 15)), // 34h gap
    ]);
    expect(result.map((p) => p.id)).not.toContain('poor_sleep');
  });

  it('uses the most recent sleep before the seizure', () => {
    // Each seizure has a short sleep AND a later good sleep within 18h; only the later one counts.
    const result = patterns([
      sleep(at(19, 22), at(20, 0, 30)), sleep(at(20, 1), at(20, 9), 3), seizure(at(20, 14)),
      sleep(at(20, 22), at(21, 0, 30)), sleep(at(21, 1), at(21, 9), 3), seizure(at(21, 15)),
    ]);
    expect(result.map((p) => p.id)).not.toContain('poor_sleep');
  });

  it('flags seizures within 24h after a missed dose', () => {
    const result = patterns([
      missed(at(19, 20)), seizure(at(20, 7)),
      missed(at(21, 20)), seizure(at(22, 14)),
    ]);
    expect(result.find((p) => p.id === 'missed_med')).toEqual({
      id: 'missed_med', matched: 2, total: 2, text: '2 of 2 seizures came within 24h of a missed dose.',
    });
  });

  it('ignores a missed dose more than 24h before, or after, the seizure', () => {
    const result = patterns([
      missed(at(18, 20)), seizure(at(20, 7)),
      seizure(at(22, 7)), missed(at(22, 20)),
    ]);
    expect(result.map((p) => p.id)).not.toContain('missed_med');
  });

  it('needs at least 2 matches and at least half the seizures', () => {
    // 1 of 2 → hidden
    expect(patterns([missed(at(19, 20)), seizure(at(20, 7)), seizure(at(23, 14))]).map((p) => p.id)).not.toContain('missed_med');
    // 2 of 5 → hidden
    const two = [missed(at(19, 20)), seizure(at(20, 7)), missed(at(20, 20)), seizure(at(21, 7))];
    const others = [seizure(at(23, 14)), seizure(at(24, 15)), seizure(at(25, 16))];
    expect(patterns([...two, ...others]).map((p) => p.id)).not.toContain('missed_med');
    // 2 of 4 → shown
    expect(patterns([...two, ...others.slice(0, 2)]).map((p) => p.id)).toContain('missed_med');
  });

  it('reports the dominant time of day', () => {
    const result = patterns([seizure(at(20, 7)), seizure(at(21, 8)), seizure(at(22, 19))]);
    expect(result).toEqual([
      { id: 'time_of_day', matched: 2, total: 3, text: '2 of 3 seizures happened in the morning (6 AM–12 PM).' },
    ]);
  });

  it('only counts seizures inside the range but uses context from before it', () => {
    const start = at(20, 6, 30);
    const result = patterns(
      [
        seizure(at(19, 7)), // before range: excluded
        sleep(at(20, 1), at(20, 6)), seizure(at(20, 7)), // sleep ended before range start
        sleep(at(21, 1), at(21, 6)), seizure(at(21, 7)),
      ],
      start,
      at(26, 23),
    );
    expect(result.find((p) => p.id === 'poor_sleep')).toMatchObject({ matched: 2, total: 2 });
  });
});

describe('countByType', () => {
  it('counts every log type in display order, zero included', () => {
    expect(countByType([
      seizure(at(20, 7)),
      missed(at(20, 8)),
      { type: 'med', occurredAt: at(21, 8), status: 'given' },
      { type: 'note', occurredAt: at(21, 9) },
    ])).toEqual([['seizure', 1], ['med', 2], ['sleep', 0], ['behavior', 0], ['note', 1]]);
  });
});

describe('triggerCounts', () => {
  it('counts triggers across seizures, most common first', () => {
    expect(triggerCounts([
      seizure(at(20, 7), { triggers: ['illness', 'poor_sleep'] }),
      seizure(at(21, 7), { triggers: ['poor_sleep'] }),
      seizure(at(22, 7)),
    ])).toEqual([['poor_sleep', 2], ['illness', 1]]);
  });
});

describe('clusterCount', () => {
  it('counts runs of 2+ seizures each within 24h of the previous one', () => {
    expect(clusterCount([
      seizure(at(10, 7)), seizure(at(10, 20)), seizure(at(11, 18)), // one chained cluster
      seizure(at(15, 7)), // alone
      seizure(at(20, 7)), seizure(at(20, 9)), // second cluster
    ])).toBe(2);
  });
  it('ignores order and single seizures', () => {
    expect(clusterCount([seizure(at(12, 7)), seizure(at(10, 7))])).toBe(0);
    expect(clusterCount([seizure(at(11, 7)), seizure(at(10, 8))])).toBe(1);
    expect(clusterCount([])).toBe(0);
  });
});

describe('previousSeizureCount', () => {
  it('counts seizures in the equal-length window before start', () => {
    const entries = [seizure(at(15, 7)), seizure(at(18, 7)), seizure(at(22, 7)), { type: 'note', occurredAt: at(1) }];
    expect(previousSeizureCount(entries, at(20), 7)).toBe(2); // Sep 13–19
  });
  it('returns null when logging started inside the previous window', () => {
    expect(previousSeizureCount([seizure(at(15, 7)), seizure(at(22, 7))], at(20), 7)).toBeNull();
  });
});

describe('summaryReport', () => {
  it('combines stats, long seizures, clusters, triggers and comparison for the range', () => {
    const r = summaryReport([
      seizure(at(26, 7), { durationSec: 320, triggers: ['illness'], seizureType: 'focal' }),
      seizure(at(26, 20), { triggers: ['illness', 'poor_sleep'] }),
      seizure(at(18, 7)),
      { type: 'note', occurredAt: at(5) },
    ], 7, at(27, 12));
    expect(r.stats.count).toBe(2);
    expect(r.longCount).toBe(1);
    expect(r.clusters).toBe(1);
    expect(r.typeText).toBe('Focal ×1, Unknown ×1');
    expect(r.triggerText).toBe('Illness ×2, Poor sleep ×1');
    expect(r.compareText).toBe('vs previous 7 days: 1 → 2 seizures');
    expect(r.seizureFreeText).toBe('6 of 7 days seizure-free');
    expect(r.strip[0].date).toBe(at(27)); // newest first
  });
});

describe('behavior and seizure patterns', () => {
  const beh = (occurredAt, kind = 'meltdown') => ({ type: 'behavior', occurredAt, kind });
  it('shows when hard behaviors came in the 24h before most seizures', () => {
    const found = patterns([
      seizure(at(20, 9)), seizure(at(22, 9)), seizure(at(24, 9)),
      beh(at(19, 18)), beh(at(21, 20), 'shutdown'), beh(at(24, 12), 'good_day'),
    ]);
    expect(found.find((p) => p.id === 'behavior_before')?.text)
      .toBe('2 of 3 seizures had a meltdown, shutdown, self-injury or anxious time logged in the 24h before.');
    expect(found.find((p) => p.id === 'behavior_after')).toBeUndefined();
  });
  it('shows hard behaviors in the 24h after seizures', () => {
    const found = patterns([seizure(at(20, 9)), seizure(at(22, 9)), beh(at(20, 15), 'anxious'), beh(at(23, 8), 'self_injury')]);
    expect(found.find((p) => p.id === 'behavior_after')?.matched).toBe(2);
  });
});

describe('summaryReport, care details', () => {
  it('counts sleep seizures, scheduled doses and behavior details', () => {
    const r = summaryReport([
      seizure(at(26, 3), { duringSleep: true }),
      seizure(at(25, 9)),
      { type: 'med', occurredAt: at(26, 8), medName: 'Keppra', status: 'given', slot: '08:00' },
      { type: 'med', occurredAt: at(26, 20), medName: 'Keppra', status: 'missed', slot: '20:00' },
      { type: 'behavior', occurredAt: at(24, 16), kind: 'meltdown', before: ['sensory', 'tired'], helped: ['quiet'] },
      { type: 'behavior', occurredAt: at(25, 16), kind: 'meltdown', before: ['sensory'] },
      { type: 'behavior', occurredAt: at(26, 16), kind: 'good_day', before: ['pain'] },
    ], 7, at(27, 12));
    expect(r.sleepCount).toBe(1);
    expect(r.doseText).toBe('1/2');
    expect(r.behaviorText).toBe('Meltdown ×2, Good day ×1');
    expect(r.beforeText).toBe('Sensory (noise, light, crowds) ×2, Tired ×1'); // hard behaviors only
    expect(r.helpedText).toBe('Quiet or dim space ×1');
  });
  it('shows a dash when no scheduled doses were logged', () => {
    expect(summaryReport([], 7, at(27, 12)).doseText).toBe('—');
  });
});

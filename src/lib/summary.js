import { startOfDay, TYPE_META } from './format.js';

const HOUR = 3600 * 1000;

const TIME_BUCKETS = [
  { from: 0, to: 6, text: 'at night (12–6 AM)' },
  { from: 6, to: 12, text: 'in the morning (6 AM–12 PM)' },
  { from: 12, to: 18, text: 'in the afternoon (12–6 PM)' },
  { from: 18, to: 24, text: 'in the evening (6 PM–12 AM)' },
];

const isShown = (matched, total) => matched >= 2 && matched / total >= 0.5;

export function countByType(entries) {
  return Object.keys(TYPE_META).map((t) => [t, entries.filter((e) => e.type === t).length]);
}

export function seizureStats(entries) {
  const seizures = entries.filter((e) => e.type === 'seizure');
  const durations = seizures.map((s) => s.durationSec || 0);
  const total = durations.reduce((a, b) => a + b, 0);
  const byType = {};
  for (const s of seizures) {
    const t = s.seizureType || 'unknown';
    byType[t] = (byType[t] || 0) + 1;
  }
  return {
    count: seizures.length,
    avgDurationSec: seizures.length ? Math.round(total / seizures.length) : 0,
    maxDurationSec: seizures.length ? Math.max(...durations) : 0,
    rescueCount: seizures.filter((s) => s.rescueMedGiven).length,
    byType,
  };
}

export function dayStrip(entries, start, end) {
  const days = [];
  const cursor = new Date(startOfDay(start));
  while (cursor.getTime() <= end) {
    days.push({ date: cursor.getTime(), seizures: 0, missedMeds: 0, sleepQuality: null });
    cursor.setDate(cursor.getDate() + 1);
  }
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const e of entries) {
    if (e.occurredAt < start || e.occurredAt > end) continue;
    const day = byDate.get(startOfDay(e.occurredAt));
    if (!day) continue;
    if (e.type === 'seizure') day.seizures += 1;
    else if (e.type === 'med' && e.status === 'missed') day.missedMeds += 1;
    else if (e.type === 'sleep' && e.quality) day.sleepQuality = e.quality;
  }
  return days;
}

function lastSleepBefore(sleeps, t) {
  let last = null;
  for (const s of sleeps) {
    if (s.wakeTime <= t && s.wakeTime >= t - 18 * HOUR && (!last || s.wakeTime > last.wakeTime)) last = s;
  }
  return last;
}

export function patterns(entries, start = -Infinity, end = Infinity) {
  const seizures = entries.filter((e) => e.type === 'seizure' && e.occurredAt >= start && e.occurredAt <= end);
  const total = seizures.length;
  if (total < 2) return [];

  const sleeps = entries.filter((e) => e.type === 'sleep' && e.bedtime && e.wakeTime);
  const missedDoses = entries.filter((e) => e.type === 'med' && e.status === 'missed');
  const found = [];

  const afterPoorSleep = seizures.filter((s) => {
    const night = lastSleepBefore(sleeps, s.occurredAt);
    return night && (night.wakeTime - night.bedtime < 6 * HOUR || night.quality === 1);
  }).length;
  if (isShown(afterPoorSleep, total)) {
    found.push({
      id: 'poor_sleep', matched: afterPoorSleep, total,
      text: `${afterPoorSleep} of ${total} seizures followed a night under 6h sleep or poor sleep.`,
    });
  }

  const nearMissed = seizures.filter((s) =>
    missedDoses.some((m) => m.occurredAt <= s.occurredAt && m.occurredAt >= s.occurredAt - 24 * HOUR),
  ).length;
  if (isShown(nearMissed, total)) {
    found.push({
      id: 'missed_med', matched: nearMissed, total,
      text: `${nearMissed} of ${total} seizures came within 24h of a missed dose.`,
    });
  }

  const counts = TIME_BUCKETS.map((b) =>
    seizures.filter((s) => {
      const h = new Date(s.occurredAt).getHours();
      return h >= b.from && h < b.to;
    }).length,
  );
  const top = counts.indexOf(Math.max(...counts));
  if (isShown(counts[top], total)) {
    found.push({
      id: 'time_of_day', matched: counts[top], total,
      text: `${counts[top]} of ${total} seizures happened ${TIME_BUCKETS[top].text}.`,
    });
  }

  return found;
}

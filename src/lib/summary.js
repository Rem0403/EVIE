import {
  BEHAVIOR_BEFORE, BEHAVIOR_HELPED, BEHAVIOR_KINDS, HARD_BEHAVIORS, labelOf, SEIZURE_TYPES, startOfDay, TRIGGERS, TYPE_META,
} from './format.js';
import { doseAdherence } from './meds.js';

const HOUR = 3600 * 1000;

const TIME_BUCKETS = [
  { from: 0, to: 6, text: 'at night (12–6 AM)' },
  { from: 6, to: 12, text: 'in the morning (6 AM–12 PM)' },
  { from: 12, to: 18, text: 'in the afternoon (12–6 PM)' },
  { from: 18, to: 24, text: 'in the evening (6 PM–12 AM)' },
];

const isShown = (matched, total) => matched >= 2 && matched / total >= 0.5;

// Care logs only: handoffs record who was there, which isn't clinical data for the doctor.
export function countByType(entries) {
  return Object.keys(TYPE_META).filter((t) => t !== 'handoff').map((t) => [t, entries.filter((e) => e.type === t).length]);
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

  // Autism and epilepsy together: were they struggling in the day before, or after, most seizures?
  const hard = entries.filter((e) => e.type === 'behavior' && HARD_BEHAVIORS.includes(e.kind));
  const hardBefore = seizures.filter((s) =>
    hard.some((b) => b.occurredAt < s.occurredAt && b.occurredAt >= s.occurredAt - 24 * HOUR),
  ).length;
  if (isShown(hardBefore, total)) {
    found.push({
      id: 'behavior_before', matched: hardBefore, total,
      text: `${hardBefore} of ${total} seizures had a meltdown, shutdown, self-injury or anxious time logged in the 24h before.`,
    });
  }
  const hardAfter = seizures.filter((s) =>
    hard.some((b) => b.occurredAt > s.occurredAt && b.occurredAt <= s.occurredAt + 24 * HOUR),
  ).length;
  if (isShown(hardAfter, total)) {
    found.push({
      id: 'behavior_after', matched: hardAfter, total,
      text: `${hardAfter} of ${total} seizures were followed by a meltdown, shutdown, self-injury or anxious time within 24h.`,
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

// Seizures at or over this length are flagged in the summary and trigger the timer alert.
// ponytail: fixed at the common 5-minute rule; make it a per-circle setting if a family's plan differs.
export const LONG_SEIZURE_SEC = 300;

// [[key, count], ...], most common first, counting every value in each entry's `field` list.
function tally(entries, field) {
  const counts = {};
  for (const e of entries) for (const k of e[field] || []) counts[k] = (counts[k] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
const tallyText = (pairs, options) => pairs.map(([k, n]) => `${labelOf(options, k)} ×${n}`).join(', ');

export const triggerCounts = (seizures) => tally(seizures, 'triggers');

// A cluster is a run of 2+ seizures, each within 24h of the one before (runs can chain past 24h).
export function clusterCount(seizures) {
  const times = seizures.map((s) => s.occurredAt).sort((a, b) => a - b);
  let clusters = 0;
  let run = 1;
  for (let i = 1; i <= times.length; i++) {
    if (i < times.length && times[i] - times[i - 1] <= 24 * HOUR) run += 1;
    else {
      if (run >= 2) clusters += 1;
      run = 1;
    }
  }
  return clusters;
}

// Seizures in the `days` before `start`, or null if nothing was logged before that window began:
// either the circle is newer than that, or older entries weren't loaded, so a count would mislead.
export function previousSeizureCount(entries, start, days) {
  const d = new Date(start);
  d.setDate(d.getDate() - days);
  const prevStart = d.getTime();
  if (!entries.some((e) => e.occurredAt < prevStart)) return null;
  return entries.filter((e) => e.type === 'seizure' && e.occurredAt >= prevStart && e.occurredAt < start).length;
}

// Everything the Summary screen and the PDF show for the last `days` days, so the two can't disagree.
export function summaryReport(entries, days, now = Date.now()) {
  const startDate = new Date(startOfDay(now));
  startDate.setDate(startDate.getDate() - (days - 1));
  const start = startDate.getTime();
  const end = now;
  const inRange = entries.filter((e) => e.occurredAt >= start && e.occurredAt <= end);
  const seizures = inRange.filter((e) => e.type === 'seizure');
  const stats = seizureStats(inRange);
  const strip = dayStrip(entries, start, end).reverse(); // newest day first
  const prevCount = previousSeizureCount(entries, start, days);
  const seizureFree = strip.filter((d) => d.seizures === 0).length;
  const doses = doseAdherence(inRange);
  const behaviors = inRange.filter((e) => e.type === 'behavior');
  const hardBehaviors = behaviors.filter((b) => HARD_BEHAVIORS.includes(b.kind));
  return {
    start, end, days, inRange, seizures, stats, strip,
    patterns: patterns(entries, start, end),
    longCount: seizures.filter((s) => (s.durationSec || 0) >= LONG_SEIZURE_SEC).length,
    clusters: clusterCount(seizures),
    typeText: Object.entries(stats.byType).map(([t, n]) => `${labelOf(SEIZURE_TYPES, t)} ×${n}`).join(', '),
    triggerText: tallyText(triggerCounts(seizures), TRIGGERS),
    sleepCount: seizures.filter((s) => s.duringSleep).length,
    doseText: doses.total ? `${doses.given}/${doses.total}` : '—',
    behaviorText: tallyText(tally(behaviors.map((b) => ({ kinds: [b.kind || 'other'] })), 'kinds'), BEHAVIOR_KINDS),
    beforeText: tallyText(tally(hardBehaviors, 'before'), BEHAVIOR_BEFORE),
    helpedText: tallyText(tally(hardBehaviors, 'helped'), BEHAVIOR_HELPED),
    compareText: prevCount === null
      ? `Not enough history to compare with the previous ${days} days.`
      : `vs previous ${days} days: ${prevCount} → ${stats.count} seizures`,
    seizureFreeText: `${seizureFree} of ${strip.length} days seizure-free`,
  };
}

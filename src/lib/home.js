// Numbers for the two stat tiles at the top of home.
const HOUR = 3600 * 1000;

export function recentSeizures(entries, now = Date.now()) {
  const seizures = entries.filter((e) => e.type === 'seizure' && e.occurredAt <= now && e.occurredAt > now - 7 * 24 * HOUR);
  const last = seizures.reduce((a, b) => (!a || b.occurredAt > a.occurredAt ? b : a), null);
  return { count: seizures.length, last };
}

// Last night's sleep: the newest sleep log that ended within 36 hours.
export function lastSleep(entries, now = Date.now()) {
  const recent = entries.filter((e) => e.type === 'sleep' && e.wakeTime && e.wakeTime <= now && e.wakeTime > now - 36 * HOUR);
  const entry = recent.reduce((a, b) => (!a || b.wakeTime > a.wakeTime ? b : a), null);
  return entry ? { entry, minutes: Math.round((entry.wakeTime - entry.bedtime) / 60000) } : null;
}

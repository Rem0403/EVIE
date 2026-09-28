// How each behavior reads in a count: [one, many].
const BEHAVIOR_WORDS = {
  meltdown: ['meltdown', 'meltdowns'],
  shutdown: ['shutdown', 'shutdowns'],
  self_injury: ['self-injury', 'self-injuries'],
  anxious: ['anxious or distressed time', 'anxious or distressed times'],
  good_day: ['good day', 'good days'],
  other: ['other behavior', 'other behaviors'],
};

// Who has them now: the latest handoff entry.
export function currentHandoff(entries) {
  let latest = null;
  for (const e of entries) if (e.type === 'handoff' && (!latest || e.occurredAt > latest.occurredAt)) latest = e;
  return latest;
}

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

// "1 seizure · 2 doses given · 1 meltdown": what the next person should know since `since`.
export function sinceText(entries, since, now) {
  const recent = entries.filter((e) => e.occurredAt > since && e.occurredAt <= now);
  const count = (fn) => recent.filter(fn).length;
  const parts = [];
  const seizures = count((e) => e.type === 'seizure');
  if (seizures) parts.push(plural(seizures, 'seizure'));
  // Rescue med is usually recorded on the seizure itself (step 2), sometimes as a med entry.
  if (count((e) => (e.type === 'med' && e.status === 'rescue') || (e.type === 'seizure' && e.rescueMedGiven))) {
    parts.push('rescue med given');
  }
  const given = count((e) => e.type === 'med' && e.status === 'given');
  if (given) parts.push(`${plural(given, 'dose')} given`);
  const missed = count((e) => e.type === 'med' && e.status === 'missed');
  if (missed) parts.push(plural(missed, 'missed dose'));
  for (const [kind, [one, many]] of Object.entries(BEHAVIOR_WORDS)) {
    const n = count((e) => e.type === 'behavior' && (BEHAVIOR_WORDS[e.kind] ? e.kind : 'other') === kind);
    if (n) parts.push(plural(n, one, many));
  }
  const notes = count((e) => e.type === 'note');
  if (notes) parts.push(plural(notes, 'note'));
  return parts.join(' · ') || 'Nothing logged';
}

// An "until" time today, or tomorrow when it has already passed (taking over for the night).
export function untilFromTime(hhmm, now) {
  if (!hhmm) return undefined;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

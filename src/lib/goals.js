import { findIdNumber, ID_NUMBER_MESSAGE } from './privacy.js';

// Skills the family and therapists are working on: new words, asking for help, getting dressed.
// Each goal is a doc in circles/{id}/goals; practice is logged as a 'goal' entry on the timeline.
export const GOAL_AREAS = [
  ['communication', 'Speech and communication'],
  ['social', 'Social'],
  ['daily_living', 'Daily living'],
  ['regulation', 'Coping and calming'],
  ['movement', 'Movement'],
  ['learning', 'School and learning'],
  ['other', 'Other'],
];
export const GOAL_STATUS = [
  ['active', 'Working on it'],
  ['paused', 'Paused'],
  ['met', 'Met'],
];
// How one try went. Families and therapists commonly note whether a skill was done alone or with help.
export const GOAL_RESULTS = [
  ['own', 'On their own'],
  ['help', 'With help'],
  ['not_yet', 'Not yet'],
];
const STATUS_ORDER = ['active', 'paused', 'met'];

export const EMPTY_GOAL = { title: '', area: 'communication', status: 'active', details: '', workingWith: '' };

// Form → stored fields, or an error to show.
export function cleanGoal(f) {
  const g = {
    title: f.title.trim(),
    area: f.area || 'other',
    status: f.status || 'active',
    details: (f.details || '').trim(),
    workingWith: (f.workingWith || '').trim(),
  };
  if (!g.title) return [null, 'Say what the goal is.'];
  if (findIdNumber([g.title, g.details, g.workingWith].join('\n'))) return [null, ID_NUMBER_MESSAGE];
  return [g, null];
}

// Working on it first, then paused, then met; newest first within each.
export function sortGoals(goals) {
  return [...goals].sort((a, b) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (b.createdAt || 0) - (a.createdAt || 0));
}

function countTries(tries) {
  const count = (result) => tries.filter((e) => e.result === result).length;
  const last = tries.reduce((a, e) => (!a || e.occurredAt > a.occurredAt ? e : a), null);
  return { total: tries.length, own: count('own'), help: count('help'), notYet: count('not_yet'), last };
}

// Tries of one goal since `since`: counts by result, and the latest one.
export function goalProgress(entries, goalId, since = 0) {
  return countTries(entries.filter((e) => e.type === 'goal' && e.goalId === goalId && e.occurredAt >= since));
}

// "2 on their own · 1 with help · 1 not yet", leaving out results that didn't happen.
export function progressText(p) {
  return [[p.own, 'on their own'], [p.help, 'with help'], [p.notYet, 'not yet']]
    .filter(([n]) => n).map(([n, word]) => `${n} ${word}`).join(' · ');
}

// "Practiced 4 times: 2 on their own · 2 with help" for one goalTally row.
export const practiceText = (p) => `Practiced ${p.total} ${p.total === 1 ? 'time' : 'times'}: ${progressText(p)}`;

// One row per goal practiced in these entries, most practiced first. The title comes from the
// newest entry, so a goal that was since renamed or removed still reads correctly.
export function goalTally(entries) {
  const byGoal = new Map();
  for (const e of entries) {
    if (e.type !== 'goal') continue;
    const key = e.goalId || e.goalTitle;
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key).push(e);
  }
  return [...byGoal.values()]
    .map((tries) => {
      const p = countTries(tries);
      return { title: p.last.goalTitle || 'Goal', ...p };
    })
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title));
}

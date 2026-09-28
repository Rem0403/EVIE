import { findIdNumber, ID_NUMBER_MESSAGE } from './privacy.js';

// The family's weekly caregiver schedule, stored on the circle as
// [{ name, days: [0-6, Sunday = 0], start: 'HH:MM', end: 'HH:MM', note }].
// It's a plan of who's working when, not a timesheet: paid Medicaid personal care has to be
// recorded in the state's electronic visit verification (EVV) system (42 U.S.C. § 1396b(l)).

export const EVV_NOTE =
  'This is your family’s own schedule, not a timesheet. If a caregiver is paid through Medicaid for personal care, '
  + 'their visits usually have to be recorded in your state’s electronic visit verification (EVV) system. '
  + 'Don’t rely on EVIE for hours or pay.';

export const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];

function timeOn(dayMs, hhmm, addDays = 0) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(dayMs);
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// Each time a shift runs on the given day, as [from, to]; an overnight shift ends the next morning.
function occurrence(shift, dayMs) {
  if (!shift.days.includes(new Date(dayMs).getDay())) return null;
  const from = timeOn(dayMs, shift.start);
  return [from, timeOn(dayMs, shift.end, shift.end <= shift.start ? 1 : 0)];
}

// Who is scheduled at `now`, and until when (including last night's overnight shift).
export function onNow(schedule = [], now = Date.now()) {
  const yesterday = timeOn(now, '00:00', -1);
  const found = [];
  for (const shift of schedule) {
    for (const day of [yesterday, now]) {
      const span = occurrence(shift, day);
      if (span && span[0] <= now && now < span[1]) found.push({ shift, until: span[1] });
    }
  }
  return found;
}

export function nextToday(schedule = [], now = Date.now()) {
  const later = schedule
    .map((shift) => ({ shift, span: occurrence(shift, now) }))
    .filter(({ span }) => span && span[0] > now)
    .sort((a, b) => a.span[0] - b.span[0])[0];
  return later ? { shift: later.shift, from: later.span[0] } : null;
}

export function weekRows(schedule = []) {
  return WEEKDAYS.map(([day, label]) => ({
    day,
    label,
    shifts: schedule.filter((s) => s.days.includes(day)).sort((a, b) => a.start.localeCompare(b.start)),
  }));
}

export function cleanSchedule(rows) {
  const shifts = rows
    .map((r) => ({
      name: r.name.trim(), days: [...r.days].sort((a, b) => a - b), start: r.start || '', end: r.end || '', note: r.note.trim(),
    }))
    .filter((r) => r.name || r.note || r.days.length);
  for (const s of shifts) {
    if (!s.name) return [null, 'Give each shift a name.'];
    if (!s.days.length) return [null, `Pick at least one day for ${s.name}.`];
    if (!s.start || !s.end) return [null, `Add a start and end time for ${s.name}.`];
    if (s.start === s.end) return [null, `${s.name}’s shift starts and ends at the same time.`];
  }
  if (findIdNumber(shifts.map((s) => `${s.name}\n${s.note}`).join('\n'))) return [null, ID_NUMBER_MESSAGE];
  return [shifts, null];
}

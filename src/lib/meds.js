import { formatTime, startOfDay } from './format.js';

// A scheduled dose is logged as a med entry with `slot: 'HH:MM'`. It counts for today when
// today has an entry for the same medication and slot.
// ponytail: matched by calendar day, so a dose for an 11 PM slot given after midnight counts
// for the next day; store the slot's date on the entry if late-night doses become common.

function slotTime(slot, now) {
  const [h, m] = slot.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export const formatSlot = (slot) => formatTime(slotTime(slot, Date.now()));

const NEAR_MS = 3 * 3600 * 1000;

// One row per scheduled dose today: given / missed / due (time passed) / upcoming.
// A dose logged another way (+ Log → Med, or before the schedule's time was changed) still
// counts when it's the same medication within 3 hours, so nobody is offered a second dose.
export function todaysDoses(meds = [], entries, now = Date.now()) {
  const today = startOfDay(now);
  const logged = entries.filter((e) =>
    e.type === 'med' && (e.status === 'given' || e.status === 'missed') && startOfDay(e.occurredAt) === today);
  const rows = [];
  for (const med of meds) {
    for (const slot of med.times) rows.push({ med, slot, at: slotTime(slot, now), entry: null });
  }
  const used = new Set();
  const claim = (row, e) => {
    row.entry = e;
    used.add(e);
  };
  for (const row of rows) {
    const exact = logged.find((e) => !used.has(e) && e.medName === row.med.name && e.slot === row.slot);
    if (exact) claim(row, exact);
  }
  for (const row of rows) {
    if (row.entry) continue;
    const near = logged
      .filter((e) => !used.has(e) && e.medName === row.med.name && Math.abs(e.occurredAt - row.at) <= NEAR_MS)
      .sort((a, b) => Math.abs(a.occurredAt - row.at) - Math.abs(b.occurredAt - row.at))[0];
    if (near) claim(row, near);
  }
  for (const row of rows) row.state = row.entry ? row.entry.status : row.at <= now ? 'due' : 'upcoming';
  return rows.sort((a, b) => a.slot.localeCompare(b.slot) || a.med.name.localeCompare(b.med.name));
}

// Only doses someone logged from the schedule count; the schedule may have changed since.
export function doseAdherence(entries) {
  const logged = entries.filter((e) => e.type === 'med' && e.slot && (e.status === 'given' || e.status === 'missed'));
  return { given: logged.filter((e) => e.status === 'given').length, total: logged.length };
}

// Care plan form rows → the stored schedule, or an error to show.
export function cleanMeds(rows) {
  const meds = rows
    .map((r) => ({
      name: r.name.trim(),
      dose: r.dose.trim(),
      times: [...new Set(r.times.filter(Boolean))].sort(),
      purpose: (r.purpose || '').trim(),
      notes: (r.notes || '').trim(),
    }))
    .filter((r) => r.name || r.dose || r.times.length || r.purpose || r.notes);
  const unnamed = meds.find((m) => !m.name);
  if (unnamed) return [null, 'Give each medication a name.'];
  const untimed = meds.find((m) => !m.times.length);
  if (untimed) return [null, `Add at least one time for ${untimed.name}.`];
  const seen = new Set();
  for (const m of meds) {
    for (const t of m.times) {
      const key = `${m.name.toLowerCase()}@${t}`;
      if (seen.has(key)) return [null, `${m.name} is listed twice at the same time. Combine them into one dose.`];
      seen.add(key);
    }
  }
  return [meds, null];
}

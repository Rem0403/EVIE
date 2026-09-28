export const SEIZURE_TYPES = [
  ['tonic-clonic', 'Tonic-clonic'],
  ['focal', 'Focal'],
  ['absence', 'Absence'],
  ['atonic', 'Atonic'],
  ['unknown', 'Unknown'],
];
// Seizure triggers, from Wikipedia's Epilepsy article (sleep deprivation, stress, fever, illness,
// menstruation, certain medications, flashing lights, sudden sounds), plus overstimulation for autism.
export const TRIGGERS = [
  ['poor_sleep', 'Poor sleep'],
  ['missed_med', 'Missed med'],
  ['illness', 'Illness'],
  ['fever', 'Fever'],
  ['stress', 'Stress'],
  ['overstimulation', 'Overstimulation'],
  ['flashing_lights', 'Flashing lights'],
  ['sudden_sounds', 'Sudden sounds'],
  ['period', 'Period'],
  ['med_change', 'Medication change'],
  ['other', 'Other'],
];
export const BEHAVIOR_KINDS = [
  ['meltdown', 'Meltdown'],
  ['shutdown', 'Shutdown'],
  ['self_injury', 'Self-injury'],
  ['anxious', 'Anxious or distressed'],
  ['good_day', 'Good day'],
  ['other', 'Other'],
];
// The kinds that mean they were struggling; summary patterns look at these.
export const HARD_BEHAVIORS = ['meltdown', 'shutdown', 'self_injury', 'anxious'];
// What came before, based on Wikipedia's Autism article: meltdown triggers are "sensory or social…
// unpredictability, unmet basic needs, and emotional situations", and pain can show as distress.
export const BEHAVIOR_BEFORE = [
  ['sensory', 'Sensory (noise, light, crowds)'],
  ['routine', 'Change of routine'],
  ['demand', 'Transition or demand'],
  ['hungry', 'Hungry or thirsty'],
  ['tired', 'Tired'],
  ['pain', 'Pain or unwell'],
  ['social', 'Social'],
  ['upset', 'Upset or emotional'],
  ['unknown', 'Not sure'],
];
export const BEHAVIOR_HELPED = [
  ['removed', 'Removed what upset them'],
  ['quiet', 'Quiet or dim space'],
  ['comfort', 'Comfort item or stim'],
  ['space', 'Time and space'],
  ['nothing', 'Nothing yet'],
  ['other', 'Other'],
];
export const BEHAVIOR_LENGTH = [
  ['lt5', 'Under 5 min'],
  ['5to15', '5–15 min'],
  ['15to30', '15–30 min'],
  ['gt30', '30+ min'],
];
export const INTENSITY = [
  ['mild', 'Mild'],
  ['moderate', 'Moderate'],
  ['severe', 'Severe'],
];
export const MED_STATUS = [
  ['given', 'Given'],
  ['missed', 'Missed'],
  ['rescue', 'Rescue med'],
];
export const SLEEP_QUALITY = [
  [1, 'Poor'],
  [2, 'OK'],
  [3, 'Good'],
];
// Care plan options. Most common alongside epilepsy and autism first, then syndromes linked to
// epilepsy, then other conditions (see docs/superpowers/specs/2026-09-28-care-plan-meds-handoff-behavior-design.md).
export const DIAGNOSES = [
  ['epilepsy', 'Epilepsy'],
  ['autism', 'Autism'],
  ['adhd', 'ADHD'],
  ['intellectual_disability', 'Intellectual disability'],
  ['anxiety', 'Anxiety'],
  ['sleep_problems', 'Sleep problems'],
  ['dravet', 'Dravet syndrome'],
  ['lennox_gastaut', 'Lennox–Gastaut syndrome'],
  ['west', 'West syndrome / infantile spasms'],
  ['tuberous_sclerosis', 'Tuberous sclerosis'],
  ['sturge_weber', 'Sturge–Weber syndrome'],
  ['fragile_x', 'Fragile X syndrome'],
  ['down', 'Down syndrome'],
  ['angelman', 'Angelman syndrome'],
  ['rett', 'Rett syndrome'],
  ['cerebral_palsy', 'Cerebral palsy'],
];
export const COMMUNICATION = [
  ['speaks', 'Speaks'],
  ['some_words', 'Some words'],
  ['non_speaking', 'Non-speaking'],
  ['aac', 'Uses AAC or signs'],
];
// "Epilepsy, Autism, CDKL5" from a care plan, or '' when none are recorded.
export function diagnosisText(profile) {
  if (!profile) return '';
  return [...(profile.diagnoses || []).map((k) => labelOf(DIAGNOSES, k)), profile.diagnosisOther].filter(Boolean).join(', ');
}
export const TYPE_META = {
  seizure: { label: 'Seizure' },
  med: { label: 'Med' },
  sleep: { label: 'Sleep' },
  behavior: { label: 'Behavior' },
  note: { label: 'Note' },
  handoff: { label: 'Handoff' },
};

export function labelOf(pairs, key) {
  const hit = pairs.find(([k]) => k === key);
  return hit ? hit[1] : String(key ?? '');
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

export function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function elapsedSec(startMs, nowMs) {
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

export function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayLabel(ms, now = Date.now()) {
  const day = startOfDay(ms);
  const today = startOfDay(now);
  if (day === today) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === yesterday.getTime()) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(ms) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function groupByDay(entries, now = Date.now()) {
  const sorted = [...entries].sort((a, b) => b.occurredAt - a.occurredAt);
  const groups = [];
  for (const entry of sorted) {
    const key = startOfDay(entry.occurredAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: dayLabel(entry.occurredAt, now), entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function sleepHours(e) {
  return e.bedtime && e.wakeTime ? `${((e.wakeTime - e.bedtime) / 3600000).toFixed(1)}h` : null;
}

export function entryTitle(e) {
  switch (e.type) {
    case 'seizure': {
      const parts = [labelOf(SEIZURE_TYPES, e.seizureType || 'unknown'), formatDuration(e.durationSec)];
      if (e.rescueMedGiven) parts.push('rescue med');
      if (e.clipStatus === 'done') parts.push('video');
      return parts.join(' · ');
    }
    case 'med': {
      const status = { given: '', missed: 'MISSED', rescue: 'rescue' }[e.status] || '';
      return [e.medName || 'Medication', e.dose, status].filter(Boolean).join(' · ');
    }
    case 'sleep':
      return ['Sleep', sleepHours(e), e.quality ? labelOf(SLEEP_QUALITY, e.quality) : null].filter(Boolean).join(' · ');
    case 'behavior':
      return [
        labelOf(BEHAVIOR_KINDS, e.kind || 'other'),
        e.intensity && labelOf(INTENSITY, e.intensity).toLowerCase(),
        e.length && labelOf(BEHAVIOR_LENGTH, e.length),
      ].filter(Boolean).join(' · ');
    case 'note':
      return e.note ? truncate(e.note, 60) : 'Note';
    case 'handoff':
      return `${e.createdByName || 'Someone'} took over${e.until ? ` until ${formatTime(e.until)}` : ''}`;
    default:
      return 'Entry';
  }
}

export function detailRows(e) {
  const rows = [
    ['When', `${dayLabel(e.occurredAt)} ${formatTime(e.occurredAt)}`],
    ['Logged by', e.createdByName || 'Someone'],
  ];
  if (e.type === 'seizure') {
    rows.push(
      ['Type', labelOf(SEIZURE_TYPES, e.seizureType || 'unknown')],
      ['Duration', formatDuration(e.durationSec)],
      ['Rescue med', e.rescueMedGiven ? 'Yes' : 'No'],
    );
    if (e.triggers?.length) rows.push(['Possible triggers', e.triggers.map((t) => labelOf(TRIGGERS, t)).join(', ')]);
    if (e.duringSleep) rows.push(['During sleep', 'Yes']);
  }
  if (e.type === 'med') {
    rows.push(['Medication', e.medName || '—'], ['Dose', e.dose || '—'], ['Status', labelOf(MED_STATUS, e.status) || '—']);
    if (e.slot) {
      const [h, m] = e.slot.split(':').map(Number);
      rows.push(['Scheduled for', formatTime(new Date(2000, 0, 1, h, m).getTime())]);
    }
  }
  if (e.type === 'sleep') {
    rows.push(
      ['Bedtime', e.bedtime ? formatTime(e.bedtime) : '—'],
      ['Woke', e.wakeTime ? formatTime(e.wakeTime) : '—'],
      ['Hours', sleepHours(e) || '—'],
      ['Quality', e.quality ? labelOf(SLEEP_QUALITY, e.quality) : '—'],
    );
  }
  if (e.type === 'behavior') {
    rows.push(['What happened', labelOf(BEHAVIOR_KINDS, e.kind || 'other')]);
    if (e.before?.length) rows.push(['Before', e.before.map((k) => labelOf(BEHAVIOR_BEFORE, k)).join(', ')]);
    if (e.helped?.length) rows.push(['What helped', e.helped.map((k) => labelOf(BEHAVIOR_HELPED, k)).join(', ')]);
    if (e.length) rows.push(['How long', labelOf(BEHAVIOR_LENGTH, e.length)]);
    if (e.intensity) rows.push(['Intensity', labelOf(INTENSITY, e.intensity)]);
  }
  if (e.type === 'handoff' && e.until) rows.push(['Until', `${dayLabel(e.until)} ${formatTime(e.until)}`]);
  if (e.note) rows.push(['Note', e.note]);
  return rows;
}

export function toLocalInput(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(str) {
  if (!str) return null;
  const t = new Date(str).getTime(); // "YYYY-MM-DDTHH:mm" parses as local time
  return Number.isNaN(t) ? null : t;
}

export function defaultSleepTimes(now) {
  const wake = new Date(now);
  wake.setHours(7, 0, 0, 0);
  const bed = new Date(wake);
  bed.setDate(bed.getDate() - 1);
  bed.setHours(21, 0, 0, 0);
  return { bedtime: bed.getTime(), wakeTime: Math.min(wake.getTime(), now) };
}

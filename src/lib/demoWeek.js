import { startOfDay } from './format.js';

// Ten days of realistic entries. Designed so that:
//  - 3 of 4 seizures follow poor sleep   → poor_sleep callout
//  - 3 of 4 seizures are in the morning  → time_of_day callout
//  - 1 of 4 follows a missed dose        → missed_med stays hidden (borderline)
export function buildDemoWeek(now, me) {
  const base = startOfDay(now);
  const at = (daysAgo, h, m = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const names = ['Mom', 'Dad', me.name || 'Remy'];
  const entries = [];
  let n = 0;
  const add = (entry) => entries.push({ createdBy: me.uid, createdByName: names[n++ % names.length], ...entry });

  const poorNights = {
    8: { bed: at(8, 0, 30), wake: at(8, 5, 45), quality: 1 },
    5: { bed: at(6, 23, 0), wake: at(5, 6, 30), quality: 1 },
    1: { bed: at(1, 1, 0), wake: at(1, 6, 0), quality: 1 },
  };

  for (let d = 9; d >= 0; d--) {
    const night = poorNights[d] || { bed: at(d + 1, 21, 30), wake: at(d, 7, 0), quality: d % 2 ? 3 : 2 };
    add({ type: 'sleep', occurredAt: night.wake, bedtime: night.bed, wakeTime: night.wake, quality: night.quality });
    add({ type: 'med', occurredAt: at(d, 8, 0), medName: 'Keppra', dose: '500 mg', status: 'given' });
    if (d === 2) {
      add({ type: 'med', occurredAt: at(2, 20, 0), medName: 'Keppra', dose: '500 mg', status: 'missed', note: 'Fell asleep early, dose skipped' });
    } else {
      add({ type: 'med', occurredAt: at(d, 20, 0), medName: 'Keppra', dose: '500 mg', status: 'given' });
    }
  }

  add({ type: 'seizure', occurredAt: at(8, 7, 10), durationSec: 102, seizureType: 'tonic-clonic', triggers: ['poor_sleep'], rescueMedGiven: false, clipStatus: 'none', note: 'Woke up very early. Seizure at breakfast table.' });
  add({ type: 'seizure', occurredAt: at(5, 8, 20), durationSec: 45, seizureType: 'focal', triggers: ['poor_sleep', 'overstimulation'], rescueMedGiven: false, clipStatus: 'none', note: 'Staring, lip smacking, then confused for ~10 min.' });
  add({ type: 'seizure', occurredAt: at(3, 19, 40), durationSec: 12, seizureType: 'absence', triggers: [], rescueMedGiven: false, clipStatus: 'none' });
  add({ type: 'seizure', occurredAt: at(1, 6, 50), durationSec: 138, seizureType: 'tonic-clonic', triggers: ['poor_sleep', 'missed_med'], rescueMedGiven: true, clipStatus: 'none', note: 'Over 2 min, gave rescue med.' });
  add({ type: 'med', occurredAt: at(1, 6, 53), medName: 'Diastat', dose: '10 mg', status: 'rescue' });

  add({ type: 'behavior', occurredAt: at(7, 16, 0), kind: 'meltdown', note: 'Fire drill at school, very loud. Calmed with headphones.' });
  add({ type: 'behavior', occurredAt: at(4, 15, 0), kind: 'good_day', note: 'Great day at therapy.' });
  add({ type: 'behavior', occurredAt: at(2, 17, 30), kind: 'shutdown', note: 'Went quiet after the grocery store.' });
  add({ type: 'behavior', occurredAt: at(0, 10, 0), kind: 'good_day' });

  add({ type: 'note', occurredAt: at(6, 12, 0), note: 'Neurology appointment booked for Oct 3.' });
  add({ type: 'note', occurredAt: at(1, 9, 0), note: 'Post-ictal, slept 2h after. Mom stayed home.' });

  return entries.filter((e) => e.occurredAt <= now).sort((a, b) => b.occurredAt - a.occurredAt);
}

import { startOfDay, toLocalInput } from './format.js';

// Ten days of realistic entries. Designed so that:
//  - 3 of 4 seizures follow poor sleep   → poor_sleep callout
//  - 3 of 4 seizures are in the morning  → time_of_day callout
//  - 1 of 4 follows a missed dose        → missed_med stays hidden (borderline)
//  - 3 of 4 have a meltdown or shutdown in the 24h before → behavior_before callout
//    (3 of 4, not 2, so it stays at or above 50% after a seizure is logged live on stage)
// Doses are logged against the demo care plan's 8 AM / 8 PM schedule.
export const DEMO_CARE_PLAN = {
  meds: [{ name: 'Keppra', dose: '500 mg', times: ['08:00', '20:00'] }],
  profile: {
    diagnoses: ['epilepsy', 'autism'],
    diagnosisOther: '',
    communication: 'some_words',
    helps: 'Headphones, dim lights, her weighted blanket',
    avoid: 'Loud places, being touched without warning',
  },
};

// Sample resources with made-up names and 555 numbers; one follow-up is due today.
export function demoResources(now, me) {
  const day = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return toLocalInput(d.getTime()).slice(0, 10);
  };
  const who = me.name || 'Remy';
  const base = {
    phone: '', url: '', email: '', nextStep: '', nextDate: '', note: '',
    createdBy: me.uid, createdByName: who, updatedAt: now, updatedByName: who,
  };
  return [
    {
      ...base, name: 'Medicaid waiver programs', category: 'services', status: 'waitlisted', phone: '555-0142',
      nextStep: 'Call to check our place on the waiting list', nextDate: day(0), note: 'Applied in March. Ask for the support coordinator.',
    },
    {
      ...base, name: 'Friday social club', category: 'community', status: 'using',
      note: 'Meets Fridays 4 to 6 PM at the library. She loves the art table.',
    },
    {
      ...base, name: 'Parent Training and Information Center', category: 'parent', status: 'want',
      url: 'https://www.parentcenterhub.org/find-your-center/', nextStep: 'Ask for help preparing for the IEP meeting', nextDate: day(5),
    },
  ];
}

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
    add({ type: 'med', occurredAt: at(d, 8, 0), medName: 'Keppra', dose: '500 mg', status: 'given', slot: '08:00' });
    if (d === 2) {
      add({ type: 'med', occurredAt: at(2, 20, 0), medName: 'Keppra', dose: '500 mg', status: 'missed', slot: '20:00', note: 'Fell asleep early, dose skipped' });
    } else {
      add({ type: 'med', occurredAt: at(d, 20, 0), medName: 'Keppra', dose: '500 mg', status: 'given', slot: '20:00' });
    }
  }

  add({ type: 'seizure', occurredAt: at(8, 7, 10), durationSec: 102, seizureType: 'tonic-clonic', triggers: ['poor_sleep'], rescueMedGiven: false, clipStatus: 'none', note: 'Woke up very early. Seizure at breakfast table.' });
  add({ type: 'seizure', occurredAt: at(5, 8, 20), durationSec: 45, seizureType: 'focal', triggers: ['poor_sleep', 'overstimulation'], rescueMedGiven: false, clipStatus: 'none', note: 'Staring, lip smacking, then confused for ~10 min.' });
  add({ type: 'seizure', occurredAt: at(3, 19, 40), durationSec: 12, seizureType: 'absence', triggers: [], rescueMedGiven: false, clipStatus: 'none' });
  add({ type: 'seizure', occurredAt: at(1, 6, 50), durationSec: 138, seizureType: 'tonic-clonic', triggers: ['poor_sleep', 'missed_med'], rescueMedGiven: true, clipStatus: 'none', note: 'Over 2 min, gave rescue med.' });
  add({ type: 'med', occurredAt: at(1, 6, 53), medName: 'Diastat', dose: '10 mg', status: 'rescue' });

  add({ type: 'behavior', occurredAt: at(9, 17, 0), kind: 'meltdown', before: ['sensory', 'routine'], helped: ['quiet'], length: '15to30', intensity: 'moderate', note: 'New substitute teacher, noisy classroom.' });
  add({ type: 'behavior', occurredAt: at(7, 16, 0), kind: 'meltdown', before: ['sensory'], helped: ['removed', 'comfort'], length: '5to15', intensity: 'moderate', note: 'Fire drill at school, very loud. Calmed with headphones.' });
  add({ type: 'behavior', occurredAt: at(6, 18, 0), kind: 'meltdown', before: ['tired', 'routine'], helped: ['quiet'], length: '15to30', intensity: 'severe', note: 'Dinner was late and she was exhausted.' });
  add({ type: 'behavior', occurredAt: at(4, 15, 0), kind: 'good_day', note: 'Great day at therapy.' });
  add({ type: 'behavior', occurredAt: at(2, 17, 30), kind: 'shutdown', before: ['sensory', 'tired'], helped: ['space'], length: '15to30', note: 'Went quiet after the grocery store.' });

  add({ type: 'handoff', occurredAt: at(1, 18, 0), createdByName: 'Mom', note: 'Seizure this morning, rescue med given. Tired but OK.' });
  // Demo entries are all saved under the presenter's account, so the current handoff is theirs.
  add({ type: 'handoff', occurredAt: at(0, 7, 0), until: at(0, 15, 0), createdByName: me.name || 'Remy', note: 'Slept OK. I have her until 3.' });
  add({ type: 'behavior', occurredAt: at(0, 10, 0), kind: 'good_day' });

  add({ type: 'note', occurredAt: at(6, 12, 0), note: 'Neurology appointment booked for Oct 3.' });
  add({ type: 'note', occurredAt: at(1, 9, 0), note: 'Post-ictal, slept 2h after. Mom stayed home.' });

  return entries.filter((e) => e.occurredAt <= now).sort((a, b) => b.occurredAt - a.occurredAt);
}

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

// The first things a new circle needs, in order. Each is done when the circle's data says so,
// so a later member sees what's already been set up.
export function gettingStarted(circle, entries) {
  const p = circle.profile || {};
  return [
    {
      id: 'meds', done: !!circle.meds?.length, action: 'carePlan',
      title: 'Add daily medications', text: 'Then everyone can see which doses were given today.',
    },
    {
      id: 'emergency', done: !!(p.contacts?.length && p.rescuePlan), action: 'carePlan',
      title: 'Add emergency contacts and the seizure plan', text: 'They make up the Emergency info a babysitter or paramedic sees first.',
    },
    {
      id: 'invite', done: (circle.memberIds?.length || 0) > 1, action: 'invite',
      title: 'Invite family and caregivers', text: 'Share the code so everyone logs to the same timeline.',
    },
    {
      id: 'log', done: entries.length > 0, action: null,
      title: 'Log something',
      text: 'Your first seizure, dose, night’s sleep or note.',
    },
  ];
}

// "Hide" on the checklist is remembered per circle on this phone.
const hiddenKey = (circleId) => `evie.gettingStarted.hidden.${circleId}`;

export function isGettingStartedHidden(circleId) {
  try {
    return localStorage.getItem(hiddenKey(circleId)) === '1';
  } catch {
    return false;
  }
}

export function hideGettingStarted(circleId) {
  try {
    localStorage.setItem(hiddenKey(circleId), '1');
  } catch {
    /* private mode: it just shows again next time */
  }
}

import { formatSlot, todaysDoses } from '../lib/meds.js';
import { formatTime } from '../lib/format.js';
import { addEntry } from '../data/entries.js';

// Today's scheduled doses. Once someone logs a dose, everyone sees who gave it, which stops
// double doses and "did anyone give it?" between caregivers.
export default function TodayMeds({ circle, me, entries, now = Date.now(), onSetUp }) {
  if (!circle.meds?.length) {
    return (
      <button className="card meds-setup" onClick={onSetUp}>
        <strong>Add the daily medication schedule</strong>
        <span className="muted small">Then everyone can see which doses have been given today.</span>
      </button>
    );
  }

  const rows = todaysDoses(circle.meds, entries, now);

  function log({ med, slot, at }, status) {
    addEntry(circle.id, {
      type: 'med',
      // A missed dose is placed at its scheduled time, so patterns line up with when it was due.
      occurredAt: status === 'missed' ? Math.min(at, Date.now()) : Date.now(),
      medName: med.name,
      dose: med.dose || undefined,
      status,
      slot,
      createdBy: me.uid,
      createdByName: me.name,
    });
  }

  return (
    <section className="card today-meds" aria-labelledby="today-meds-title">
      <h2 id="today-meds-title" className="today-title">Today’s meds</h2>
      {rows.map((row) => {
        const { med, slot, entry, state } = row;
        return (
          <div key={`${med.name}@${slot}`} className={`dose dose-${state}`}>
            <div className="dose-what">
              <span className="dose-time">{formatSlot(slot)}</span>
              <span>{[med.name, med.dose].filter(Boolean).join(' · ')}</span>
            </div>
            {entry ? (
              <span className="dose-status">
                {state === 'given' ? '✓ Given' : 'Missed'} · {entry.createdByName || 'someone'}
                {state === 'given' && ` · ${formatTime(entry.occurredAt)}`}
              </span>
            ) : (
              <div className="dose-actions">
                {state === 'due' && <span className="dose-due">Due</span>}
                <button className="btn small primary" onClick={() => log(row, 'given')}
                  aria-label={`${med.name} ${formatSlot(slot)} given`}>Given</button>
                <button className="btn small ghost" onClick={() => log(row, 'missed')}
                  aria-label={`${med.name} ${formatSlot(slot)} missed`}>Missed</button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

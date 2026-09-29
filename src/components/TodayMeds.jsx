import { useState } from 'react';
import { formatSlot, todaysDoses } from '../lib/meds.js';
import { formatTime } from '../lib/format.js';
import { addEntry } from '../data/entries.js';
import Icon from './Icon.jsx';

// Today's scheduled doses. Once someone logs a dose, everyone sees who gave it, which stops
// double doses and "did anyone give it?" between caregivers. The next dose's buttons stay on
// the card, so logging it is still one tap; the full list is one more tap.
export default function TodayMeds({ circle, me, entries, now = Date.now(), onSetUp }) {
  const [showAll, setShowAll] = useState(false);

  if (!circle.meds?.length) {
    return (
      <button className="summary-card feature compact tint-med" onClick={onSetUp}>
        <span className="card-head">
          <span className="card-label"><Icon name="med" size={18} />Medications</span>
          <Icon name="chevron" size={18} />
        </span>
        <span className="card-value sm">Add the daily medication schedule</span>
        <span className="card-sub">Then everyone can see which doses have been given today.</span>
      </button>
    );
  }

  const rows = todaysDoses(circle.meds, entries, now);
  const given = rows.filter((r) => r.state === 'given').length;
  const next = rows.find((r) => !r.entry);
  const shown = showAll ? rows : next ? [next] : [];

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

  const missed = rows.filter((r) => r.state === 'missed').length;
  const due = next?.state === 'due';
  const headline = !next
    ? `✓ All ${rows.length} doses logged today`
    : due
      ? `${formatSlot(next.slot)} ${next.med.name} is due`
      : `${given} of ${rows.length} given · next ${formatSlot(next.slot)}`;

  // In the medication color. Size follows what needs doing: big with a strong outline while a dose
  // is due, one calm line otherwise.
  return (
    <section className={`summary-card feature tint-med ${due ? 'due' : 'compact'}`} aria-labelledby="today-meds-title">
      <span className="card-head">
        <span className="card-label" id="today-meds-title"><Icon name="med" size={18} />Medications</span>
        <span className="card-time">Today</span>
      </span>
      <span className={due ? 'card-value' : 'card-value sm'}>{headline}</span>
      {missed > 0 && <span className="card-sub">{missed} missed today</span>}
      {shown.map((row) => {
        const { med, slot, entry, state } = row;
        return (
          <div key={`${med.name}@${slot}`} className={`dose dose-${state}`}>
            {/* When only the due dose is shown, the headline already names it. */}
            {(showAll || !due) && (
              <div className="dose-what">
                <span className="dose-time">{formatSlot(slot)}</span>
                <span>{[med.name, med.dose].filter(Boolean).join(' · ')}</span>
              </div>
            )}
            {entry ? (
              <span className="dose-status">
                {state === 'given' ? '✓ Given' : 'Missed'} · {entry.createdByName || 'someone'}
                {state === 'given' && ` · ${formatTime(entry.occurredAt)}`}
              </span>
            ) : (
              <div className="dose-actions">
                {state === 'due' && <span className="due-badge">Due</span>}
                <button className="btn small primary" onClick={() => log(row, 'given')}
                  aria-label={`${med.name} ${formatSlot(slot)} given`}>Given</button>
                <button className="btn small" onClick={() => log(row, 'missed')}
                  aria-label={`${med.name} ${formatSlot(slot)} missed`}>Missed</button>
              </div>
            )}
          </div>
        );
      })}
      {rows.length > 1 && (
        <button className="card-action link-btn" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
          {showAll ? 'Show less' : `All of today’s doses (${rows.length})`}<Icon name="chevron" size={16} />
        </button>
      )}
    </section>
  );
}

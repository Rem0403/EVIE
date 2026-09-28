import { useEffect, useRef, useState } from 'react';
import { currentHandoff, sinceText, untilFromTime } from '../lib/handoff.js';
import { dayLabel, formatTime, startOfDay } from '../lib/format.js';
import { addEntry } from '../data/entries.js';

// "3:00 PM" today, "Yesterday 6:00 PM" otherwise.
const when = (ms, now) => (startOfDay(ms) === startOfDay(now) ? formatTime(ms) : `${dayLabel(ms, now)} ${formatTime(ms)}`);

// "Who's with them now", and a Take over sheet that tells the next person what happened.
export default function Handoff({ circle, me, entries, now = Date.now() }) {
  const [open, setOpen] = useState(false);
  const current = currentHandoff(entries);
  const ended = current?.until && current.until < now;
  const mine = current?.createdBy === me.uid && !ended;

  return (
    <>
      <section className="card handoff" aria-label={`Who is with ${circle.personName}`}>
        <div>
          {current ? (
            <>
              <p>
                <strong>{ended ? 'Was with' : 'With'} {current.createdByName || 'someone'}</strong>
                <span className="muted"> · since {when(current.occurredAt, now)}{current.until ? ` · until ${when(current.until, now)}` : ''}</span>
              </p>
              {current.note && <p className="handoff-note">“{current.note}”</p>}
            </>
          ) : (
            <p className="muted">Taking over? Let everyone know you’re with {circle.personName}.</p>
          )}
        </div>
        <button className="btn small" onClick={() => setOpen(true)}>{mine ? 'Update' : 'Take over'}</button>
      </section>
      {open && <TakeOverSheet circle={circle} me={me} entries={entries} current={current} onClose={() => setOpen(false)} />}
    </>
  );
}

function TakeOverSheet({ circle, me, entries, current, onClose }) {
  const [now] = useState(() => Date.now());
  const [until, setUntil] = useState('');
  const [note, setNote] = useState('');
  const title = useRef(null);
  const since = current ? current.occurredAt : startOfDay(now);
  const from = current && current.createdBy !== me.uid ? current.createdByName || 'someone' : null;

  useEffect(() => {
    title.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function save(e) {
    e.preventDefault();
    addEntry(circle.id, {
      type: 'handoff',
      occurredAt: Date.now(),
      until: untilFromTime(until, Date.now()),
      note: note.trim() || undefined,
      createdBy: me.uid,
      createdByName: me.name,
    });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet panel" role="dialog" aria-modal="true" aria-labelledby="handoff-title"
        onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2 id="handoff-title" ref={title} tabIndex={-1}>
          {from ? `Take over from ${from}` : `You’re with ${circle.personName}`}
        </h2>
        <div className="callout">
          <span className="small muted">{current ? `Since ${when(since, now)}` : 'Today so far'}</span>
          <div>{sinceText(entries, since, now)}</div>
        </div>
        <label>
          Until (optional)
          <input type="time" value={until} onChange={(e) => setUntil(e.target.value)} />
        </label>
        <label>
          Note for everyone (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
            placeholder="e.g. slept badly, gave the 8 AM dose, a bit off today" />
        </label>
        <button className="btn primary big">{from ? 'Take over' : 'Save'}</button>
        <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

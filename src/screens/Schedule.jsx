import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { formatSlot } from '../lib/meds.js';
import { cleanSchedule, EVV_NOTE, WEEKDAYS, weekRows } from '../lib/schedule.js';
import { updateCircle } from '../data/circles.js';

const blankShift = () => ({ name: '', days: [], start: '08:00', end: '15:00', note: '' });
const span = (s) => `${formatSlot(s.start)}–${formatSlot(s.end)}${s.end <= s.start ? ' (next day)' : ''}`;

// Who is scheduled to be with them each week: paid caregivers, family, respite.
export default function Schedule({ circle, onBack }) {
  const schedule = circle.schedule || [];
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const setRow = (i, patch) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function startEditing() {
    setRows(schedule.length ? schedule.map((s) => ({ ...s, days: [...s.days] })) : [blankShift()]);
    setError('');
    setEditing(true);
  }

  function save(e) {
    e.preventDefault();
    const [cleaned, err] = cleanSchedule(rows);
    if (err) {
      setError(err);
      return;
    }
    // ponytail: last save wins; add the care plan's "someone else changed it" check if two people edit schedules at once.
    updateCircle(circle.id, { schedule: cleaned }).catch((err2) => console.error('schedule save failed', err2));
    setEditing(false);
  }

  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <h1>Caregiver schedule</h1>
      <p className="callout small" role="note">{EVV_NOTE}</p>

      {!editing && (
        <>
          {schedule.length === 0 && <p className="muted">No shifts yet. Add who is with {circle.personName} and when.</p>}
          {schedule.length > 0 && (
            <div className="strip">
              {weekRows(schedule).map((row) => (
                <div key={row.day} className="week-row">
                  <strong>{row.label}</strong>
                  <span>
                    {row.shifts.length === 0 && <span className="muted">—</span>}
                    {row.shifts.map((s, i) => (
                      <span key={i} className="week-shift">{s.name} · {span(s)}{s.note ? ` · ${s.note}` : ''}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button className="btn primary" onClick={startEditing}>{schedule.length ? 'Edit schedule' : 'Add shifts'}</button>
        </>
      )}

      {editing && (
        <form className="stack" onSubmit={save}>
          {rows.map((r, i) => (
            <fieldset key={i} className="card med-edit">
              <legend className="sr-only">Shift {i + 1}</legend>
              <label>
                Who
                <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} maxLength={60} placeholder="e.g. Ms. Lee (caregiver)" />
              </label>
              <span className="field-label">Days</span>
              <ChipGroup options={WEEKDAYS} value={r.days} onChange={(days) => setRow(i, { days })} multi />
              <div className="row">
                <label style={{ flex: 1 }}>
                  From
                  <input type="time" value={r.start} onChange={(e) => setRow(i, { start: e.target.value })} />
                </label>
                <label style={{ flex: 1 }}>
                  To
                  <input type="time" value={r.end} onChange={(e) => setRow(i, { end: e.target.value })} />
                </label>
              </div>
              <label>
                Note (optional)
                <input value={r.note} onChange={(e) => setRow(i, { note: e.target.value })} maxLength={140} placeholder="e.g. does school pickup" />
              </label>
              <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }}
                aria-label={`Remove ${r.name || `shift ${i + 1}`}`}
                onClick={() => setRows((all) => all.filter((_, j) => j !== i))}>Remove shift</button>
            </fieldset>
          ))}
          <button type="button" className="btn" onClick={() => setRows((all) => [...all, blankShift()])}>+ Add shift</button>
          {error && <p className="error">{error}</p>}
          <button className="btn primary big">Save</button>
          <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      )}
    </section>
  );
}

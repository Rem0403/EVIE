import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { GOAL_AREAS, GOAL_STATUS, goalProgress, progressText, sortGoals } from '../lib/goals.js';
import { dayLabel, labelOf } from '../lib/format.js';

const TWO_WEEKS = 14 * 24 * 3600 * 1000;
const timesText = (n) => `practiced ${n} ${n === 1 ? 'time' : 'times'}`;
// "today", "yesterday", or "on Mon, Sep 28" (dates keep their capitals).
function whenText(ms, now) {
  const day = dayLabel(ms, now);
  return day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : `on ${day}`;
}

// What they're working on (new words, asking for help, getting dressed), each with its own
// practice log, kept apart from general notes.
export default function Goals({ circle, goals, entries, onBack, onAdd, onEdit, onPractice }) {
  const [now] = useState(() => Date.now());
  const sorted = sortGoals(goals);

  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}><Icon name="back" size={16} />Back</button>
      <div className="spread">
        <h1 className="with-icon type-goal"><Icon name="goal" size={28} />Goals</h1>
        <button className="btn small" onClick={onAdd}><Icon name="plus" size={16} />Add goal</button>
      </div>
      <p className="muted">
        What {circle.personName} is working on, like new words, asking for help or getting dressed. Log each practice
        to see progress over time.
      </p>

      {sorted.length === 0 && (
        <p className="empty">No goals yet. Add one they’re working on at home, in therapy or at school.</p>
      )}

      {sorted.map((g) => {
        const p = goalProgress(entries, g.id, now - TWO_WEEKS);
        const last = goalProgress(entries, g.id).last;
        return (
          <article key={g.id} className={`card goal status-${g.status}`}>
            <div className="spread">
              <strong className="goal-title">{g.title}</strong>
              <button className="btn ghost small" onClick={() => onEdit(g.id)} aria-label={`Edit ${g.title}`}>Edit</button>
            </div>
            <p className="muted small">
              {labelOf(GOAL_STATUS, g.status)} · {labelOf(GOAL_AREAS, g.area)}{g.workingWith ? ` · with ${g.workingWith}` : ''}
            </p>
            {g.details && <p className="small pre">{g.details}</p>}
            <p className="small">
              {p.total ? `Last 2 weeks: ${progressText(p) || timesText(p.total)}` : 'No practice logged in the last 2 weeks.'}
            </p>
            {last && <p className="small muted">Last practiced {whenText(last.occurredAt, now)}</p>}
            {g.status === 'active' && (
              <button className="btn small primary" style={{ alignSelf: 'flex-start' }} onClick={() => onPractice(g.id)}
                aria-label={`Log practice for ${g.title}`}>Log practice</button>
            )}
          </article>
        );
      })}
    </section>
  );
}

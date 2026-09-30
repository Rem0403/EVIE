import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { GOAL_AREAS, GOAL_STATUS, goalProgress, progressText, sortGoals } from '../lib/goals.js';
import { dayLabel, labelOf } from '../lib/format.js';

const TWO_WEEKS = 14 * 24 * 3600 * 1000;

// What they're working on (new words, asking for help, getting dressed), each with its own
// practice log, kept apart from general notes.
export default function Goals({ circle, goals, entries, onBack, onAdd, onEdit, onPractice }) {
  const [now] = useState(() => Date.now());
  const sorted = sortGoals(goals);

  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <div className="spread">
        <h1 className="with-icon type-goal"><Icon name="goal" size={28} />Goals</h1>
        <button className="btn small" onClick={onAdd}>+ Add goal</button>
      </div>
      <p className="muted">
        What {circle.personName} is working on, like new words, asking for help or getting dressed. Log each practice
        to see progress over time. Everyone in the circle can add and update goals.
      </p>

      {sorted.length === 0 && (
        <div className="empty">
          No goals yet. Add one they’re working on at home, in therapy or at school.
          <button className="btn primary" onClick={onAdd} style={{ marginTop: 12 }}>Add a goal</button>
        </div>
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
              {p.total ? `Last 2 weeks: ${progressText(p)}` : 'No practice logged in the last 2 weeks.'}
              {last && <span className="muted"> · last {dayLabel(last.occurredAt, now).toLowerCase()}</span>}
            </p>
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

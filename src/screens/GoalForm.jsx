import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { cleanGoal, EMPTY_GOAL, GOAL_AREAS, GOAL_STATUS } from '../lib/goals.js';
import { addGoal, deleteGoal, updateGoal } from '../data/goals.js';

// Add or edit one goal. Practice already logged stays on the timeline if the goal is removed.
export default function GoalForm({ circle, me, goal, onDone }) {
  const [f, setF] = useState(() => ({ ...EMPTY_GOAL, ...(goal || {}) }));
  const [error, setError] = useState('');
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  function save(e) {
    e.preventDefault();
    const [clean, err] = cleanGoal(f);
    if (err) {
      setError(err);
      return;
    }
    const stamp = { updatedAt: Date.now(), updatedByName: me.name };
    if (goal) updateGoal(circle.id, goal.id, { ...clean, ...stamp });
    else addGoal(circle.id, { ...clean, ...stamp, createdAt: Date.now(), createdBy: me.uid, createdByName: me.name });
    onDone();
  }

  function remove() {
    if (!window.confirm(`Remove “${goal.title}” for everyone? Practice already logged stays on the timeline.`)) return;
    deleteGoal(circle.id, goal.id);
    onDone();
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>{goal ? 'Edit goal' : 'Add a goal'}</h1>
      <label>
        Goal
        <input value={f.title} onChange={set('title')} maxLength={120} placeholder="e.g. Ask for “more” with a word or sign" />
      </label>
      <span className="field-label">Area</span>
      <ChipGroup options={GOAL_AREAS} value={f.area} onChange={(area) => setF({ ...f, area })} />
      <label>
        Working on it with (optional)
        <input value={f.workingWith} onChange={set('workingWith')} maxLength={80} placeholder="e.g. speech therapist, school" />
      </label>
      <label>
        Details (optional)
        <textarea value={f.details} onChange={set('details')} maxLength={1000}
          placeholder="What counts as doing it, how you practice, what helps" />
      </label>
      {goal && (
        <>
          <span className="field-label">Status</span>
          <ChipGroup options={GOAL_STATUS} value={f.status} onChange={(status) => setF({ ...f, status })} />
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn primary big">Save</button>
      {goal && <button type="button" className="btn danger" onClick={remove}>Remove goal</button>}
      <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
    </form>
  );
}

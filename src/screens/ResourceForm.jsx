import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { cleanResource, EMPTY_RESOURCE, RESOURCE_CATEGORIES, RESOURCE_STATUS } from '../lib/resources.js';
import { formatTime, dayLabel } from '../lib/format.js';
import { addResource, deleteResource, updateResource } from '../data/resources.js';

// Add or edit one of the family's resources. `resource` is an existing one; `prefill` starts a new one.
export default function ResourceForm({ circle, me, resource, prefill, onDone }) {
  const [f, setF] = useState(() => ({ ...EMPTY_RESOURCE, ...(resource || prefill || {}) }));
  const [error, setError] = useState('');
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  function save(e) {
    e.preventDefault();
    const [clean, err] = cleanResource(f);
    if (err) {
      setError(err);
      return;
    }
    const stamp = { updatedAt: Date.now(), updatedByName: me.name };
    if (resource) updateResource(circle.id, resource.id, { ...clean, ...stamp });
    else addResource(circle.id, { ...clean, ...stamp, createdBy: me.uid, createdByName: me.name });
    onDone();
  }

  function remove() {
    if (!window.confirm(`Remove ${resource.name} for everyone?`)) return;
    deleteResource(circle.id, resource.id);
    onDone();
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>{resource ? 'Edit resource' : 'Add a resource'}</h1>
      {resource?.updatedAt && (
        <p className="muted small">Last updated by {resource.updatedByName || 'someone'}, {dayLabel(resource.updatedAt)} {formatTime(resource.updatedAt)}</p>
      )}
      <label>
        Name
        <input value={f.name} onChange={set('name')} maxLength={100} placeholder="e.g. Friday social club" />
      </label>
      <span className="field-label">Type</span>
      <ChipGroup options={RESOURCE_CATEGORIES} value={f.category} onChange={(category) => setF({ ...f, category })} />
      <span className="field-label">Where are we with it?</span>
      <ChipGroup options={RESOURCE_STATUS} value={f.status} onChange={(status) => setF({ ...f, status })} />
      <label>
        Next step (optional)
        <input value={f.nextStep} onChange={set('nextStep')} maxLength={140} placeholder="e.g. Call to check our place on the waiting list" />
      </label>
      <label>
        By (optional)
        <input type="date" value={f.nextDate} onChange={set('nextDate')} />
      </label>
      <label>
        Phone (optional)
        <input type="tel" value={f.phone} onChange={set('phone')} maxLength={40} />
      </label>
      <label>
        Website (optional)
        <input inputMode="url" value={f.url} onChange={set('url')} maxLength={300} placeholder="example.org" />
      </label>
      <label>
        Email (optional)
        <input type="email" value={f.email} onChange={set('email')} maxLength={120} />
      </label>
      <label>
        Notes (optional)
        <textarea value={f.note} onChange={set('note')} maxLength={1000} placeholder="Who you spoke to, what they said, what to bring…" />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary big">Save</button>
      {resource && <button type="button" className="btn danger" onClick={remove}>Remove</button>}
      <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
    </form>
  );
}

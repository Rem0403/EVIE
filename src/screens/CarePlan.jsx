import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { COMMUNICATION, DIAGNOSES } from '../lib/format.js';
import { cleanMeds } from '../lib/meds.js';
import { updateCircle } from '../data/circles.js';

const blankMed = () => ({ name: '', dose: '', times: ['08:00'] });
// Firestore may hand back keys in a different order than they were saved, so compare with sorted keys.
const planKey = (c) => JSON.stringify([c.profile || null, c.meds || null], (_, v) =>
  (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));

// "About {name}": diagnoses, how they communicate, what helps, and the daily medication schedule.
export default function CarePlan({ circle, onDone }) {
  const profile = circle.profile || {};
  const [diagnoses, setDiagnoses] = useState(profile.diagnoses || []);
  const [diagnosisOther, setDiagnosisOther] = useState(profile.diagnosisOther || '');
  const [communication, setCommunication] = useState(profile.communication || null);
  const [helps, setHelps] = useState(profile.helps || '');
  const [avoid, setAvoid] = useState(profile.avoid || '');
  const [meds, setMeds] = useState(() => (circle.meds || []).map((m) => ({ ...m, times: [...m.times] })));
  const [error, setError] = useState('');
  // The plan as it was when this form opened, to notice someone else saving in the meantime.
  const [openedWith] = useState(() => planKey(circle));
  const [conflict, setConflict] = useState(false);

  const setMed = (i, patch) => setMeds((all) => all.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  function save(e) {
    e.preventDefault();
    const [cleaned, err] = cleanMeds(meds);
    if (err) {
      setError(err);
      return;
    }
    // circle stays live while the form is open; a change means another caregiver saved.
    if (!conflict && planKey(circle) !== openedWith) {
      setConflict(true);
      return;
    }
    const next = {
      diagnoses,
      diagnosisOther: diagnosisOther.trim(),
      communication,
      helps: helps.trim(),
      avoid: avoid.trim(),
    };
    updateCircle(circle.id, { profile: next, meds: cleaned }).catch((err2) => console.error('care plan save failed', err2));
    onDone();
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>About {circle.personName}</h1>
      <p className="muted">Everyone in the circle sees this. It also goes on the doctor summary.</p>

      <h2>Diagnoses</h2>
      <ChipGroup options={DIAGNOSES} value={diagnoses} onChange={setDiagnoses} multi />
      <label>
        Other diagnoses (optional)
        <input value={diagnosisOther} onChange={(e) => setDiagnosisOther(e.target.value)} maxLength={200} />
      </label>

      <h2>Communication</h2>
      <ChipGroup options={COMMUNICATION} value={communication} onChange={setCommunication} />

      <label>
        What helps them
        <textarea value={helps} onChange={(e) => setHelps(e.target.value)} maxLength={1000} placeholder="e.g. headphones, a quiet room, their blue blanket" />
      </label>
      <label>
        What to avoid
        <textarea value={avoid} onChange={(e) => setAvoid(e.target.value)} maxLength={1000} placeholder="e.g. loud places, being touched without warning" />
      </label>

      <h2>Daily medications</h2>
      <p className="muted small">Doses show on the timeline each day, so everyone can see what has been given.</p>
      {meds.map((m, i) => (
        <fieldset key={i} className="card med-edit">
          <legend className="sr-only">Medication {i + 1}</legend>
          <label>
            Medication
            <input value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} placeholder="e.g. Keppra" maxLength={60} />
          </label>
          <label>
            Dose
            <input value={m.dose} onChange={(e) => setMed(i, { dose: e.target.value })} placeholder="e.g. 250 mg" maxLength={40} />
          </label>
          <span className="field-label">Times</span>
          {m.times.map((t, k) => (
            <div key={k} className="row">
              <input
                type="time" value={t} aria-label={`${m.name || `Medication ${i + 1}`} time ${k + 1}`} style={{ flex: 1 }}
                onChange={(e) => setMed(i, { times: m.times.map((x, j) => (j === k ? e.target.value : x)) })}
              />
              {m.times.length > 1 && (
                <button type="button" className="btn ghost small" aria-label={`Remove ${m.name || `medication ${i + 1}`} time ${k + 1}`}
                  onClick={() => setMed(i, { times: m.times.filter((_, j) => j !== k) })}>Remove</button>
              )}
            </div>
          ))}
          <div className="spread">
            <button type="button" className="btn small" aria-label={`Add a time for ${m.name || `medication ${i + 1}`}`}
              onClick={() => setMed(i, { times: [...m.times, ''] })}>+ Time</button>
            <button type="button" className="btn ghost small" aria-label={`Remove ${m.name || `medication ${i + 1}`}`}
              onClick={() => setMeds((all) => all.filter((_, j) => j !== i))}>
              Remove medication
            </button>
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn" onClick={() => setMeds((all) => [...all, blankMed()])}>+ Add medication</button>

      {error && <p className="error">{error}</p>}
      {conflict && (
        <p className="error" role="alert">
          Someone else changed the care plan while you were editing. Saving now replaces their changes.
          Cancel and reopen it to see them, or tap Save again to keep yours.
        </p>
      )}
      <button className="btn primary big">{conflict ? 'Save mine anyway' : 'Save'}</button>
      <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
    </form>
  );
}

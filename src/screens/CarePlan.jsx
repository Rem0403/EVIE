import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { COMMUNICATION, DIAGNOSES } from '../lib/format.js';
import { cleanMeds } from '../lib/meds.js';
import { cleanContacts, planIdError } from '../lib/careplan.js';
import { updateCircle } from '../data/circles.js';
import AttachmentUpload from '../components/AttachmentUpload.jsx';
import AttachmentList from '../components/AttachmentList.jsx';
import { removeAttachment, saveAttachments } from '../lib/attachments.js';
import ContactsEditor from '../components/ContactsEditor.jsx';
import MedsEditor from '../components/MedsEditor.jsx';

// Firestore may hand back keys in a different order than they were saved, so compare with sorted keys.
const planKey = (c) => JSON.stringify([c.profile || null, c.meds || null], (_, v) =>
  (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));

// "About {name}": emergency details, diagnoses, how they communicate, what helps, and the daily medication schedule.
export default function CarePlan({ circle, me, onDone }) {
  const profile = circle.profile || {};
  const [diagnoses, setDiagnoses] = useState(profile.diagnoses || []);
  const [diagnosisOther, setDiagnosisOther] = useState(profile.diagnosisOther || '');
  const [communication, setCommunication] = useState(profile.communication || null);
  const [helps, setHelps] = useState(profile.helps || '');
  const [avoid, setAvoid] = useState(profile.avoid || '');
  const [allergies, setAllergies] = useState(profile.allergies || '');
  const [rescuePlan, setRescuePlan] = useState(profile.rescuePlan || '');
  const [routine, setRoutine] = useState(profile.routine || '');
  const [contacts, setContacts] = useState(() => (profile.contacts || []).map((c) => ({ ...c })));
  const [meds, setMeds] = useState(() => (circle.meds || []).map((m) => ({ ...m, times: [...m.times] })));
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState(() => circle.documents || []);
  const [newFiles, setNewFiles] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);
  // The plan as it was when this form opened, to notice someone else saving in the meantime.
  const [openedWith] = useState(() => planKey(circle));
  const [conflict, setConflict] = useState(false);

  async function save(e) {
    e.preventDefault();
    const [cleaned, err] = cleanMeds(meds);
    const [cleanedContacts, contactErr] = cleanContacts(contacts);
    const next = {
      diagnoses,
      diagnosisOther: diagnosisOther.trim(),
      communication,
      helps: helps.trim(),
      avoid: avoid.trim(),
      allergies: allergies.trim(),
      rescuePlan: rescuePlan.trim(),
      routine: routine.trim(),
      contacts: cleanedContacts || [],
    };
    const problem = err || contactErr || planIdError(next, cleaned, cleanedContacts);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    // circle stays live while the form is open; a change means another caregiver saved.
    if (!conflict && planKey(circle) !== openedWith) {
      setConflict(true);
      return;
    }
    let added = [];
    try {
      added = await saveAttachments(newFiles);
    } catch (storeErr) {
      console.error(storeErr);
      setError('Couldn\u2019t save the new documents on this phone (it may be out of space). Nothing was saved; try again.');
      return;
    }
    removedDocs.forEach((d) => removeAttachment(d.id));
    const docs = [...documents, ...added.map((d) => ({ ...d, on: me?.name || 'someone' }))];
    updateCircle(circle.id, { profile: next, meds: cleaned, documents: docs }).catch((err2) => console.error('care plan save failed', err2));
    onDone();
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>About {circle.personName}</h1>
      <p className="muted">
        Everyone in the circle sees this, and it makes up the emergency info. Please don’t add ID numbers like
        Social Security or Medicaid numbers.
      </p>

      <h2>In an emergency</h2>
      <label>
        Their seizure plan (optional)
        <textarea value={rescuePlan} onChange={(e) => setRescuePlan(e.target.value)} maxLength={1000}
          placeholder="Copy it from the plan their doctor gave you, e.g. which rescue medication, how much, and when to give it" />
      </label>
      <label>
        Allergies (optional)
        <input value={allergies} onChange={(e) => setAllergies(e.target.value)} maxLength={300} placeholder="e.g. penicillin, latex, none known" />
      </label>
      <span className="field-label">Contacts</span>
      <ContactsEditor contacts={contacts} onChange={setContacts} />

      <h2>Documents</h2>
      <p className="muted small">The doctor’s seizure plan, letters, the IEP, test results. Everyone sees the list; each file stays on the phone that added it and can be shared from there.</p>
      <AttachmentList
        items={documents}
        label="Care plan documents"
        onRemove={(d) => { setDocuments(documents.filter((x) => x.id !== d.id)); setRemovedDocs([...removedDocs, d]); }}
      />
      <AttachmentUpload files={newFiles} onChange={setNewFiles} existingCount={documents.length} label="New documents" />

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
      <label>
        Daily routine (optional)
        <textarea value={routine} onChange={(e) => setRoutine(e.target.value)} maxLength={1000}
          placeholder="e.g. school 8 to 3, snack at 3:30, bath before bed, asleep by 8:30" />
      </label>

      <h2>Daily medications</h2>
      <p className="muted small">Doses show on the timeline each day, so everyone can see what has been given.</p>
      <MedsEditor meds={meds} onChange={setMeds} />

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

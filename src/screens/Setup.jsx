import { useEffect, useRef, useState } from 'react';
import { createCircle } from '../data/circles.js';
import { cleanContacts, planIdError } from '../lib/careplan.js';
import { cleanMeds } from '../lib/meds.js';
import { withTimeout } from '../lib/timeout.js';
import ContactsEditor, { blankContact } from '../components/ContactsEditor.jsx';
import MedsEditor, { blankMed } from '../components/MedsEditor.jsx';

const NETWORK_TIMEOUT_MS = 15000;
const STEPS = ['names', 'team', 'meds'];
const OFFLINE = "You're offline. Connect to the internet and try again.";

// A medication row counts once something is typed in it (every new row starts with an 8 AM time).
const isFilled = (m) => [m.name, m.dose, m.purpose, m.notes].some((v) => v?.trim());

// Starting a circle, one short step at a time: names, who helps care, daily medications.
// Nothing is saved until the last step, so leaving halfway doesn't leave an empty circle behind.
// Everything after the names can be skipped and added later in the care plan.
export default function Setup({ uid, onCreated, onCancel }) {
  const [step, setStep] = useState('names');
  const [name, setName] = useState('');
  const [personName, setPersonName] = useState('');
  const [contacts, setContacts] = useState(() => [blankContact()]);
  const [meds, setMeds] = useState(() => [blankMed()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = useRef(null);
  const person = personName.trim();

  // Each step starts at the top, with its heading announced to screen readers.
  useEffect(() => {
    window.scrollTo?.(0, 0);
    title.current?.focus();
  }, [step]);

  function go(next) {
    setError('');
    setStep(next);
  }

  function checkTeam(list) {
    const [cleaned, err] = cleanContacts(list);
    return err ? [null, err] : [cleaned, planIdError({}, [], cleaned)];
  }

  function nextFromTeam(e) {
    e.preventDefault();
    const [, err] = checkTeam(contacts);
    if (err) setError(err);
    else go('meds');
  }

  async function create(medRows) {
    const [cleanedContacts, contactErr] = checkTeam(contacts);
    const [cleanedMeds, medErr] = cleanMeds(medRows.filter(isFilled));
    const problem = contactErr || medErr || planIdError({}, cleanedMeds, []);
    if (problem) {
      setError(problem);
      return;
    }
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const circle = await withTimeout(createCircle({
        uid,
        displayName: name.trim(),
        personName: person,
        profile: cleanedContacts.length ? { contacts: cleanedContacts } : undefined,
        meds: cleanedMeds.length ? cleanedMeds : undefined,
      }), NETWORK_TIMEOUT_MS);
      onCreated(circle, name.trim());
    } catch (err) {
      console.error(err);
      setError("Couldn't create the circle. Check your connection and try again.");
      setBusy(false);
    }
  }

  const progress = (
    <p className="muted small setup-step" aria-live="polite">Step {STEPS.indexOf(step) + 1} of {STEPS.length}</p>
  );

  if (step === 'names') {
    return (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); go('team'); }}>
        {progress}
        <h1 ref={title} tabIndex={-1}>Start a care circle</h1>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remy" required maxLength={30} />
        </label>
        <label>
          Who is this circle for?
          <input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Their first name" required maxLength={30} />
        </label>
        <button className="btn primary big">Next</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Back</button>
      </form>
    );
  }

  if (step === 'team') {
    return (
      <form className="stack" onSubmit={nextFromTeam}>
        {progress}
        <h1 ref={title} tabIndex={-1}>Who helps care for {person}?</h1>
        <p className="muted">
          Family, paid caregivers, their doctor. Each person shows on {person}’s emergency info with a button to call them.
          This doesn’t invite them; you’ll get a code to share at the end.
        </p>
        <ContactsEditor contacts={contacts} onChange={setContacts} addLabel="+ Add someone" />
        {error && <p className="error">{error}</p>}
        <button className="btn primary big">Next</button>
        <button type="button" className="btn ghost" onClick={() => { setContacts([]); go('meds'); }}>Skip for now</button>
        <button type="button" className="btn ghost" onClick={() => go('names')}>Back</button>
      </form>
    );
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); create(meds); }}>
      {progress}
      <h1 ref={title} tabIndex={-1}>{person}’s daily medications</h1>
      <p className="muted">
        Each day everyone sees which doses were given and by whom, so nobody doubles up or misses one.
        You can change these any time in the care plan.
      </p>
      <MedsEditor meds={meds} onChange={setMeds} />
      {error && <p className="error">{error}</p>}
      <button className="btn primary big" disabled={busy}>{busy ? 'Creating…' : 'Create circle'}</button>
      <button type="button" className="btn ghost" disabled={busy} onClick={() => create([])}>Skip and create circle</button>
      <button type="button" className="btn ghost" disabled={busy} onClick={() => go('team')}>Back</button>
    </form>
  );
}

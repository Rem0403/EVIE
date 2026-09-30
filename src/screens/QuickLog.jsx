import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import {
  BEHAVIOR_BEFORE, BEHAVIOR_HELPED, BEHAVIOR_KINDS, BEHAVIOR_LENGTH, defaultSleepTimes, fromLocalInput, INTENSITY,
  MED_STATUS, SLEEP_QUALITY, toLocalInput, TYPE_META,
} from '../lib/format.js';
import { addEntry } from '../data/entries.js';
import Icon from '../components/Icon.jsx';
import AttachmentUpload from '../components/AttachmentUpload.jsx';
import { saveAttachments } from '../lib/attachments.js';
import { findIdNumber, ID_NUMBER_MESSAGE } from '../lib/privacy.js';
import { GOAL_RESULTS, sortGoals } from '../lib/goals.js';

// goals and goalId are for type 'goal': the goals to choose from, and the one to start on.
export default function QuickLog({ circle, me, type, entries, goals = [], goalId, onDone }) {
  const [now] = useState(() => Date.now());
  const lastMed = entries.find((e) => e.type === 'med' && e.status !== 'rescue');
  const sleepDefaults = defaultSleepTimes(now);

  const [when, setWhen] = useState(toLocalInput(now));
  const [medName, setMedName] = useState(lastMed?.medName || '');
  const [dose, setDose] = useState(lastMed?.dose || '');
  const [status, setStatus] = useState('given');
  const [bed, setBed] = useState(toLocalInput(sleepDefaults.bedtime));
  const [wake, setWake] = useState(toLocalInput(sleepDefaults.wakeTime));
  const [quality, setQuality] = useState(2);
  const [kind, setKind] = useState('meltdown');
  const [before, setBefore] = useState([]);
  const [helped, setHelped] = useState([]);
  const [length, setLength] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const activeGoals = sortGoals(goals).filter((g) => g.status === 'active');
  const [goal, setGoal] = useState(() => goalId || (activeGoals.length === 1 ? activeGoals[0].id : null));
  const [result, setResult] = useState(null);
  // A good day has no before / what helped; the details are only for when they were struggling.
  const details = kind !== 'good_day';
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [savedWithError, setSavedWithError] = useState('');

  function build() {
    if (findIdNumber(note)) return [null, ID_NUMBER_MESSAGE];
    const base = { type, createdBy: me.uid, createdByName: me.name, note: note.trim() || undefined };
    if (type === 'sleep') {
      const bedtime = fromLocalInput(bed);
      const wakeTime = fromLocalInput(wake);
      if (!bedtime || !wakeTime) return [null, 'Enter both times.'];
      if (wakeTime <= bedtime) return [null, 'Wake time must be after bedtime.'];
      if (wakeTime > Date.now()) return [null, "Wake time can't be in the future."];
      return [{ ...base, occurredAt: wakeTime, bedtime, wakeTime, quality }];
    }
    const occurredAt = fromLocalInput(when);
    if (!occurredAt) return [null, 'Enter a valid time.'];
    if (type === 'med') {
      if (!medName.trim()) return [null, 'Enter the medication name.'];
      return [{ ...base, occurredAt, medName: medName.trim(), dose: dose.trim() || undefined, status }];
    }
    if (type === 'behavior') {
      if (!details) return [{ ...base, occurredAt, kind }];
      return [{
        ...base,
        occurredAt,
        kind,
        before: before.length ? before : undefined,
        helped: helped.length ? helped : undefined,
        length: length || undefined,
        intensity: intensity || undefined,
      }];
    }
    if (type === 'goal') {
      const chosen = goals.find((g) => g.id === goal);
      if (!chosen) return [null, 'Choose which goal.'];
      if (!result) return [null, 'Choose how it went.'];
      return [{ ...base, occurredAt, goalId: chosen.id, goalTitle: chosen.title, result }];
    }
    if (!note.trim() && !files.length) return [null, 'Write a note or attach a file.'];
    return [{ ...base, occurredAt }];
  }

  async function save(e) {
    e.preventDefault();
    const [entry, err] = build();
    if (err) {
      setError(err);
      return;
    }
    if (!files.length) {
      addEntry(circle.id, entry);
      onDone();
      return;
    }
    setProgress(0);
    let attachments = [];
    let failed = false;
    try {
      attachments = await saveAttachments(files);
    } catch (storeErr) {
      console.error(storeErr);
      failed = true;
    }
    addEntry(circle.id, attachments.length ? { ...entry, attachments, attachmentsOn: me.name } : entry);
    if (failed) setSavedWithError("Couldn't save the files on this phone (it may be out of space). The note is saved without them.");
    else onDone();
  }

  const meta = TYPE_META[type];

  if (savedWithError) {
    return (
      <section className="stack">
        <h1>Saved</h1>
        <p className="error">{savedWithError}</p>
        <button className="btn primary" onClick={onDone}>Back to timeline</button>
      </section>
    );
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1 className={`with-icon type-${type}`}>
        <Icon name={type} size={28} />Log {type === 'goal' ? 'goal practice' : meta.label.toLowerCase()}
      </h1>

      {type === 'goal' && (
        <>
          <span className="field-label">Which goal?</span>
          <ChipGroup options={activeGoals.map((g) => [g.id, g.title])} value={goal} onChange={setGoal} />
          <span className="field-label">How did it go?</span>
          <ChipGroup options={GOAL_RESULTS} value={result} onChange={setResult} />
        </>
      )}

      {type === 'med' && (
        <>
          <label>
            Medication
            <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="e.g. Keppra" />
          </label>
          <label>
            Dose
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500 mg" />
          </label>
          <ChipGroup options={MED_STATUS} value={status} onChange={setStatus} />
        </>
      )}

      {type === 'sleep' && (
        <>
          <label>
            Bedtime
            <input type="datetime-local" value={bed} onChange={(e) => setBed(e.target.value)} />
          </label>
          <label>
            Woke up
            <input type="datetime-local" value={wake} onChange={(e) => setWake(e.target.value)} />
          </label>
          <label>Quality</label>
          <ChipGroup options={SLEEP_QUALITY} value={quality} onChange={setQuality} />
        </>
      )}

      {type === 'behavior' && (
        <>
          <span className="field-label">What happened?</span>
          <ChipGroup options={BEHAVIOR_KINDS} value={kind} onChange={setKind} />
          {details && (
            <>
              <span className="field-label">What happened before? (optional)</span>
              <ChipGroup options={BEHAVIOR_BEFORE} value={before} onChange={setBefore} multi />
              <span className="field-label">What helped? (optional)</span>
              <ChipGroup options={BEHAVIOR_HELPED} value={helped} onChange={setHelped} multi />
              <span className="field-label">How long? (optional)</span>
              <ChipGroup options={BEHAVIOR_LENGTH} value={length} onChange={(v) => setLength(v === length ? null : v)} />
              <span className="field-label">How intense? (optional)</span>
              <ChipGroup options={INTENSITY} value={intensity} onChange={(v) => setIntensity(v === intensity ? null : v)} />
            </>
          )}
        </>
      )}

      {type !== 'sleep' && (
        <label>
          When
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
      )}

      <label>
        {type === 'note' ? 'Note' : 'Note (optional)'}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {type === 'note' && <AttachmentUpload files={files} onChange={setFiles} />}

      {error && <p className="error">{error}</p>}
      {progress !== null && <progress value={progress} max={1} />}

      <button className="btn primary big" disabled={progress !== null}>Save</button>
      <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
    </form>
  );
}

import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import {
  BEHAVIOR_KINDS, defaultSleepTimes, fromLocalInput, MED_STATUS, SLEEP_QUALITY, toLocalInput, TYPE_META,
} from '../lib/format.js';
import { validatePhoto } from '../lib/validate.js';
import { addEntry } from '../data/entries.js';
import { attachMedia } from '../data/clips.js';
import Icon from '../components/Icon.jsx';

export default function QuickLog({ circle, me, type, entries, onDone }) {
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
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [savedWithError, setSavedWithError] = useState('');

  function build() {
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
    if (type === 'behavior') return [{ ...base, occurredAt, kind }];
    if (!note.trim() && !photo) return [null, 'Write a note or add a photo.'];
    return [{ ...base, occurredAt, photoStatus: photo ? 'uploading' : undefined }];
  }

  function pickPhoto(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const err = validatePhoto(f);
    setError(err || '');
    setPhoto(err ? null : f);
  }

  async function save(e) {
    e.preventDefault();
    const [entry, err] = build();
    if (err) {
      setError(err);
      return;
    }
    const id = addEntry(circle.id, entry);
    if (!photo) {
      onDone();
      return;
    }
    setProgress(0);
    try {
      await attachMedia(circle.id, id, photo, 'photo', setProgress);
      onDone();
    } catch (uploadErr) {
      console.error(uploadErr);
      setSavedWithError("Couldn't save the photo on this phone. The note is saved without it.");
    }
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
      <h1 className={`with-icon type-${type}`}><Icon name={type} size={28} />Log {meta.label.toLowerCase()}</h1>

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

      {type === 'behavior' && <ChipGroup options={BEHAVIOR_KINDS} value={kind} onChange={setKind} />}

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

      {type === 'note' && (
        <label className="btn" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
          <Icon name="photo" /> {photo ? `Photo: ${photo.name}` : 'Add photo'}
          <input type="file" accept="image/*" onChange={pickPhoto} hidden />
        </label>
      )}

      {error && <p className="error">{error}</p>}
      {progress !== null && <progress value={progress} max={1} />}

      <button className="btn primary big" disabled={progress !== null}>Save</button>
      <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
    </form>
  );
}

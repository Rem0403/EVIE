import { useEffect, useRef, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { elapsedSec, formatClock, formatDuration, SEIZURE_TYPES, TRIGGERS } from '../lib/format.js';
import { validateClip } from '../lib/validate.js';
import { clearSeizureDraft, loadSeizureDraft, saveSeizureDraft } from '../lib/seizureDraft.js';
import { addEntry } from '../data/entries.js';
import { attachMedia } from '../data/clips.js';
import Icon from '../components/Icon.jsx';

export default function LogSeizure({ circle, me, onDone }) {
  const [draft] = useState(loadSeizureDraft);
  const [startMs, setStartMs] = useState(() => draft?.startMs ?? Date.now());
  const [stopMs, setStopMs] = useState(draft?.stopMs ?? null);
  const [now, setNow] = useState(() => Date.now());
  const saving = useRef(false);

  const [seizureType, setSeizureType] = useState('unknown');
  const [rescue, setRescue] = useState(false);
  const [triggers, setTriggers] = useState([]);
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (stopMs) return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [stopMs]);

  useEffect(() => {
    if (!saving.current) saveSeizureDraft({ startMs, stopMs });
  }, [startMs, stopMs]);

  const elapsed = elapsedSec(startMs, stopMs ?? now);

  function adjust(sec) {
    setStartMs((s) => s - sec * 1000);
  }

  function cancel() {
    if (!window.confirm('Discard this seizure?')) return;
    clearSeizureDraft();
    onDone();
  }

  function pickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const err = validateClip(f);
    setFileError(err || '');
    setFile(err ? null : f);
  }

  async function save() {
    if (saving.current) return;
    saving.current = true;
    clearSeizureDraft();
    const id = addEntry(circle.id, {
      type: 'seizure',
      occurredAt: startMs,
      durationSec: elapsed,
      seizureType,
      triggers,
      rescueMedGiven: rescue,
      note: note.trim() || undefined,
      clipStatus: file ? 'uploading' : 'none',
      createdBy: me.uid,
      createdByName: me.name,
    });
    if (!file) {
      onDone();
      return;
    }
    setProgress(0);
    try {
      await attachMedia(circle.id, id, file, 'clip', setProgress);
      onDone();
    } catch (err) {
      console.error(err);
      setProgress(null);
      setUploadError("Couldn't save the clip on this phone. The seizure is saved. You can retry the clip from its entry.");
    }
  }

  if (!stopMs) {
    return (
      <section className="stack">
        <p className="hint">Seizure in progress. Stay with them, and note what you see.</p>
        <div className="timer" aria-live="off">{formatClock(elapsed)}</div>
        <button className="btn stop-btn" onClick={() => setStopMs(Date.now())}>Stop</button>
        <p className="hint small">Started earlier?</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn small" onClick={() => adjust(15)}>+15s</button>
          <button className="btn small" onClick={() => adjust(30)}>+30s</button>
          <button className="btn small" onClick={() => adjust(60)}>+1m</button>
        </div>
        <button className="btn ghost" onClick={cancel}>Cancel</button>
      </section>
    );
  }

  if (uploadError) {
    return (
      <section className="stack">
        <h1>Saved</h1>
        <p className="error">{uploadError}</p>
        <button className="btn primary" onClick={onDone}>Back to timeline</button>
      </section>
    );
  }

  if (progress !== null) {
    return (
      <section className="stack">
        <h1>Saving clip…</h1>
        <progress value={progress} max={1} />
        <p className="muted">The seizure is already saved. You can keep using the app while the clip saves.</p>
        <button className="btn" onClick={onDone}>Continue in background</button>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="spread">
        <h1>Seizure · {formatDuration(elapsed)}</h1>
        <button className="btn small" onClick={() => setStopMs(null)}>Resume</button>
      </div>

      <label>Type</label>
      <ChipGroup options={SEIZURE_TYPES} value={seizureType} onChange={setSeizureType} />

      <label className="toggle">
        <input type="checkbox" checked={rescue} onChange={(e) => setRescue(e.target.checked)} />
        Rescue medication given
      </label>

      <label>Possible triggers</label>
      <ChipGroup options={TRIGGERS} value={triggers} onChange={setTriggers} multi />

      <label>
        Notes
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you see? How are they now?" />
      </label>

      <label className="btn" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
        <Icon name="clip" /> {file ? `Clip: ${file.name}` : 'Attach clip'}
        <input type="file" accept="video/*" onChange={pickFile} hidden />
      </label>
      {fileError && <p className="error">{fileError}</p>}

      <button className="btn primary big" onClick={save}>Save seizure</button>
      <button className="btn ghost" onClick={cancel}>Discard</button>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { elapsedSec, formatClock, formatDuration, SEIZURE_TYPES, TRIGGERS } from '../lib/format.js';
import { validateClip } from '../lib/validate.js';
import { clearSeizureDraft, loadSeizureDraft, saveSeizureDraft } from '../lib/seizureDraft.js';
import { addEntry } from '../data/entries.js';
import { attachMedia } from '../data/clips.js';
import { LONG_SEIZURE_SEC } from '../lib/summary.js';
import Icon from '../components/Icon.jsx';
import SeizureInfo from '../components/SeizureInfo.jsx';
import EmergencyInfo from '../components/EmergencyInfo.jsx';
import { SEIZURE_INFO } from '../lib/seizureInfo.js';

const STEPS = 4;

export default function LogSeizure({ circle, me, onDone }) {
  const [draft] = useState(loadSeizureDraft);
  const [startMs, setStartMs] = useState(() => draft?.startMs ?? Date.now());
  const [stopMs, setStopMs] = useState(draft?.stopMs ?? null);
  const [now, setNow] = useState(() => Date.now());
  const saving = useRef(false);

  // Details after Stop are asked one step at a time; null means not answered yet.
  const [step, setStep] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const stepHeading = useRef(null);
  const [seizureType, setSeizureType] = useState(null);
  const [rescue, setRescue] = useState(null);
  const [triggers, setTriggers] = useState([]);
  const [duringSleep, setDuringSleep] = useState(false);
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

  // Move focus to each step's question so screen readers announce it.
  useEffect(() => {
    stepHeading.current?.focus();
  }, [step, stopMs]);

  const elapsed = elapsedSec(startMs, stopMs ?? now);
  const overLimit = elapsed >= LONG_SEIZURE_SEC;

  // Vibrate once, as the limit is crossed (not again after Stop or Resume).
  useEffect(() => {
    if (overLimit && !stopMs) navigator.vibrate?.([400, 200, 400]);
  }, [overLimit]);

  // Keep the screen on while timing; the browser drops the lock when the app is hidden, so take it again on return.
  useEffect(() => {
    if (stopMs || !navigator.wakeLock) return undefined;
    let lock = null;
    let live = true;
    const acquire = () => navigator.wakeLock.request('screen').then((l) => {
      if (live) lock = l;
      else l.release();
    }).catch(() => {});
    const onVisible = () => document.visibilityState === 'visible' && acquire();
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [stopMs]);

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
      seizureType: seizureType || 'unknown',
      triggers,
      rescueMedGiven: rescue === true,
      duringSleep: duringSleep || undefined,
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
        <div className={`timer${overLimit ? ' over' : ''}`} aria-live="off">{formatClock(elapsed)}</div>
        {overLimit && (
          <p className="alert-msg" role="alert">
            5 minutes. Follow their seizure plan. If you don’t have one, call emergency services now.
          </p>
        )}
        <button className="btn stop-btn" onClick={() => setStopMs(Date.now())}>Stop</button>
        <p className="hint small">Started earlier?</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn small" onClick={() => adjust(15)}>+15s</button>
          <button className="btn small" onClick={() => adjust(30)}>+30s</button>
          <button className="btn small" onClick={() => adjust(60)}>+1m</button>
        </div>
        <button className="btn" onClick={() => setShowEmergency(true)}>Emergency info</button>
        <button className="btn ghost" onClick={cancel}>Cancel</button>
        {showEmergency && (
          <div className="sheet-backdrop" onClick={() => setShowEmergency(false)}>
            <div className="sheet panel" role="dialog" aria-modal="true" aria-label="Emergency info" onClick={(e) => e.stopPropagation()}>
              <div className="spread">
                <h2>Emergency info</h2>
                <button className="btn small" onClick={() => setShowEmergency(false)}>Close</button>
              </div>
              <p className="muted small">The timer keeps running.</p>
              <EmergencyInfo circle={circle} />
            </div>
          </div>
        )}
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

  const next = () => setStep((n) => Math.min(n + 1, STEPS));
  const choose = (set, value) => {
    set(value);
    next();
  };
  const heading = (text) => <h1 ref={stepHeading} tabIndex={-1}>{text}</h1>;

  return (
    <section className="stack">
      <div className="spread">
        {step > 1
          ? <button className="btn ghost small" onClick={() => setStep(step - 1)}>← Back</button>
          : <button className="btn small" onClick={() => setStopMs(null)}>Resume</button>}
        <span className="muted">Seizure · {formatDuration(elapsed)}</span>
      </div>
      <div className="step-progress">
        <span className="step-dots" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => <span key={i} className={i < step ? 'on' : ''} />)}
        </span>
        <span className="muted small">Step {step} of {STEPS}</span>
      </div>

      <div key={step} className="step stack">
        {step === 1 && (
          <>
            <div className="spread">
              {heading('What did it look like?')}
              <button className="info-btn" aria-label="About seizure types" onClick={() => setShowInfo(true)}>i</button>
            </div>
            <div className="choices">
              {SEIZURE_TYPES.map(([key, label]) => (
                <button
                  key={key} className={`choice${seizureType === key ? ' on' : ''}`} aria-pressed={seizureType === key}
                  onClick={() => choose(setSeizureType, key)}
                >
                  <strong>{label}</strong>
                  <span>{SEIZURE_INFO[key].short}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {heading('Was rescue medication given?')}
            <div className="choices two">
              {[[true, 'Yes'], [false, 'No']].map(([value, label]) => (
                <button
                  key={label} className={`choice${rescue === value ? ' on' : ''}`} aria-pressed={rescue === value}
                  onClick={() => choose(setRescue, value)}
                >
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {heading('Anything that might have set it off?')}
            <p className="muted">Pick any that apply, or none.</p>
            <ChipGroup options={TRIGGERS} value={triggers} onChange={setTriggers} multi />
            <button className="btn" onClick={next}>Next</button>
          </>
        )}

        {step === 4 && (
          <>
            {heading('How are they now?')}
            <button type="button" className={`choice${duringSleep ? ' on' : ''}`} aria-pressed={duringSleep}
              onClick={() => setDuringSleep(!duringSleep)}>
              <strong>It happened while they were asleep</strong>
              <span>Tap if it started during sleep</span>
            </button>
            <label>
              Notes (optional)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sleepy, confused, hurt? Anything else you saw?" />
            </label>
            <label className="btn" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
              <Icon name="clip" /> {file ? `Clip: ${file.name}` : 'Add a video clip (optional)'}
              <input type="file" accept="video/*" onChange={pickFile} hidden />
            </label>
            {fileError && <p className="error">{fileError}</p>}
          </>
        )}
      </div>

      {step < 3 && <button className="btn ghost small skip" onClick={next}>Skip →</button>}
      <button className="btn primary big" onClick={save}>Save seizure</button>
      <button className="btn ghost small" onClick={cancel}>Discard this seizure</button>

      {showInfo && <SeizureInfo onClose={() => setShowInfo(false)} />}
    </section>
  );
}

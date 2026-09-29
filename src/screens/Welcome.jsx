import { useState } from 'react';
import { createCircle, joinCircleByCode } from '../data/circles.js';
import { normalizeJoinCode } from '../lib/codes.js';
import { shareJoinCode, shareMessage } from '../lib/share.js';
import { withTimeout } from '../lib/timeout.js';
import { useFlash } from '../lib/useFlash.js';
import Icon from '../components/Icon.jsx';

const NETWORK_TIMEOUT_MS = 15000;
// Each letter and its word share an entry-type color. No purple: that's only ever the seizure color.
const NAME = [
  ['E', 'Event', 'med'],
  ['V', 'Video', 'sleep'],
  ['I', 'Information', 'behavior'],
  ['E', 'Exchange', 'handoff'],
];
const POINTS = [
  ['seizure', 'Seizures', 'Time them, add a video, spot patterns'],
  ['med', 'Medications', 'Today’s doses, given or missed'],
  ['behavior', 'Everyone in the loop', 'Behavior, handoffs, the care plan and support'],
];
const OFFLINE = "You're offline. Connect to the internet and try again.";

export default function Welcome({ uid, onJoined }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join' | 'created'
  const [name, setName] = useState('');
  const [personName, setPersonName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [shareMsg, setShareMsg] = useFlash();

  async function handleCreate(e) {
    e.preventDefault();
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const circle = await withTimeout(
        createCircle({ uid, displayName: name.trim(), personName: personName.trim() }),
        NETWORK_TIMEOUT_MS,
      );
      setCreated(circle);
      setMode('created');
    } catch (err) {
      console.error(err);
      setError("Couldn't create the circle. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!normalizeJoinCode(code)) {
      setError('Codes look like EVIE-7KQ4-M2XP.');
      return;
    }
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const circle = await withTimeout(joinCircleByCode({ uid, displayName: name.trim(), code }), NETWORK_TIMEOUT_MS);
      if (circle) onJoined(circle, name.trim());
      else setError('No circle found with that code.');
    } catch (err) {
      console.error(err);
      setError("Couldn't join. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const result = await shareJoinCode(created);
    setShareMsg(shareMessage(result, created));
  }

  if (mode === 'created') {
    return (
      <section className="stack">
        <h1>Circle created</h1>
        <p className="muted">Share this code with family and caregivers so they can join {created.personName}'s timeline.</p>
        <div className="join-code" aria-label="Join code">{created.joinCode}</div>
        <button className="btn" onClick={share}>Share invite</button>
        {shareMsg && <p className="muted">{shareMsg}</p>}
        <button className="btn primary" onClick={() => onJoined(created, name.trim())}>Go to timeline</button>
      </section>
    );
  }

  if (mode === 'create') {
    return (
      <form className="stack" onSubmit={handleCreate}>
        <h1>Start a care circle</h1>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remy" required maxLength={30} />
        </label>
        <label>
          Who is this circle for?
          <input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Their first name" required maxLength={30} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create circle'}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode(null); setError(''); }}>Back</button>
      </form>
    );
  }

  if (mode === 'join') {
    return (
      <form className="stack" onSubmit={handleJoin}>
        <h1>Join a care circle</h1>
        <label>
          Join code
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EVIE-7KQ4-M2XP" autoCapitalize="characters" required />
        </label>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom" required maxLength={30} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Joining…' : 'Join circle'}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode(null); setError(''); }}>Back</button>
      </form>
    );
  }

  return (
    <section className="stack welcome">
      <header className="welcome-hero">
        <span className="welcome-mark" aria-hidden="true"><Icon name="seizure" size={38} /></span>
        <h1 className="welcome-title">
          {NAME.map(([letter, , color]) => <span key={color} className={`c-${color}`}>{letter}.</span>)}
        </h1>
        <p className="welcome-sub">
          {NAME.map(([, word, color], i) => (
            <span key={color}>{i === 2 && '& '}<span className={`c-${color}`}>{word}</span>{i < 3 && ' '}</span>
          ))}
        </p>
      </header>
      <p className="lead">One shared record for everyone who cares for them.</p>
      <ul className="welcome-points" aria-label="What EVIE keeps">
        {POINTS.map(([type, title, text]) => (
          <li key={type} className={`type-${type}`}>
            <span className="welcome-icon" aria-hidden="true"><Icon name={type} size={22} /></span>
            <span><strong>{title}</strong><span className="muted small">{text}</span></span>
          </li>
        ))}
      </ul>
      <button className="btn primary big" onClick={() => setMode('create')}>Start a care circle</button>
      <button className="btn big" onClick={() => setMode('join')}>Join with a code</button>
    </section>
  );
}

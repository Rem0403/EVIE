import { useState } from 'react';
import { createCircle, joinCircleByCode } from '../data/circles.js';
import { normalizeJoinCode } from '../lib/codes.js';
import { shareJoinCode, shareMessage } from '../lib/share.js';
import { withTimeout } from '../lib/timeout.js';
import { useFlash } from '../lib/useFlash.js';

const NETWORK_TIMEOUT_MS = 15000;
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
      setError('Codes look like EVIE-1234.');
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
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EVIE-1234" autoCapitalize="characters" required />
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
      <div className="brand">EVIE</div>
      <p className="lead">One shared care timeline for the whole family. Seizures, meds, sleep and moments, all in one place.</p>
      <button className="btn primary big" onClick={() => setMode('create')}>Start a care circle</button>
      <button className="btn big" onClick={() => setMode('join')}>Join with a code</button>
    </section>
  );
}

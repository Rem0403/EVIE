import { useState } from 'react';
import { createCircle, joinCircleByCode } from '../data/circles.js';
import Setup from './Setup.jsx';
import { normalizeJoinCode } from '../lib/codes.js';
import { seedDemo } from '../data/demo.js';
import { withTimeout } from '../lib/timeout.js';
import Icon from '../components/Icon.jsx';
import { InviteCode } from '../components/InviteCode.jsx';

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
  ['behavior', 'Everyone in the loop', 'Behavior, goals, handoffs and the care plan'],
];
const OFFLINE = "You're offline. Connect to the internet and try again.";

// inviteCode: from an invite link, opens the join form with it filled in.
// onGoogle: signs in with Google and resolves to an error message, or '' when done.
// notice: a message from before, like having been removed from a circle.
export default function Welcome({
  uid, onJoined, inviteCode = '', email = '', onGoogle, notice = '', onPrivacy, onClearPhone,
}) {
  const [mode, setMode] = useState(inviteCode ? 'join' : null); // null | 'create' | 'join' | 'created'
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!normalizeJoinCode(code)) {
      setError('Codes look like MAYA-7KQ4-M2XP: a name, then 8 letters and numbers.');
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

  // A throwaway circle filled with a sample week, so the app can be tried without typing anything.
  async function handleDemo() {
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const me = { uid, name: 'You' };
      const circle = await withTimeout(createCircle({ uid, displayName: me.name, personName: 'Maya' }), NETWORK_TIMEOUT_MS);
      await withTimeout(seedDemo(circle, me), NETWORK_TIMEOUT_MS);
      onJoined(circle, me.name, true);
    } catch (err) {
      console.error(err);
      setError("Couldn't start the demo. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError('');
    const message = await onGoogle();
    setError(message);
    setBusy(false);
  }

  if (mode === 'create') {
    return (
      <Setup
        uid={uid}
        onCancel={() => { setMode(null); setError(''); }}
        onCreated={(circle, yourName) => { setCreated(circle); setName(yourName); setMode('created'); }}
      />
    );
  }

  if (mode === 'created') {
    return (
      <section className="stack">
        <h1>Circle created</h1>
        <p className="muted">
          Share this code with family and caregivers so they can join {created.personName}'s timeline.
          You can find it again any time with the Invite button on the home screen.
        </p>
        <InviteCode circle={created} />
        <button className="btn" onClick={() => onJoined(created, name.trim())}>Go to timeline</button>
      </section>
    );
  }

  if (mode === 'join') {
    return (
      <form className="stack" onSubmit={handleJoin}>
        <h1>Join a care circle</h1>
        <label>
          Join code
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAYA-7KQ4-M2XP" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} required />
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
      {notice && <p className="notice" role="status">{notice}</p>}
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
      {error && <p className="error">{error}</p>}
      <div className="welcome-more">
        {email
          ? <p className="muted small">Signed in with Google as {email}</p>
          : <button className="btn" onClick={handleGoogle} disabled={busy}>Continue with Google</button>}
        <button className="btn ghost" onClick={handleDemo} disabled={busy}>{busy ? 'Please wait…' : 'Try a demo with sample data'}</button>
      </div>
      <div className="welcome-footer">
        {onPrivacy && <button className="link-btn" onClick={onPrivacy}>Privacy</button>}
        {onClearPhone && <button className="link-btn" onClick={onClearPhone}>Clear EVIE data from this phone</button>}
      </div>
    </section>
  );
}

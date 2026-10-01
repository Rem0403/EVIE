import { useState } from 'react';
import { createCircle, joinCircleByCode } from '../data/circles.js';
import Setup, { photoToSave } from './Setup.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { CircleIcon } from '../components/CircleIconPicker.jsx';
import { circleIconOf } from '../lib/circleIcon.js';
import { normalizeJoinCode } from '../lib/codes.js';
import { seedDemo } from '../data/demo.js';
import { withTimeout } from '../lib/timeout.js';
import { InviteCode } from '../components/InviteCode.jsx';

const NETWORK_TIMEOUT_MS = 15000;
const OFFLINE = "You're offline. Connect to the internet and try again.";

// inviteCode: from an invite link, opens the join form with it filled in.
// onGoogle: signs in with Google and resolves to an error message, or '' when done.
// notice: a message from before, like having been removed from a circle.
// googlePhoto: the Google account picture, once signed in with Google; offered as your photo.
// onSignOut: signs out of Google on this phone (App asks first, then clears the phone).
export default function Welcome({
  uid, onJoined, inviteCode = '', email = '', googlePhoto = '', onGoogle, onSignOut, notice = '', onPrivacy, onClearPhone,
}) {
  const [mode, setMode] = useState(inviteCode ? 'join' : null); // null | 'create' | 'join' | 'created'
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode);
  const [photo, setPhoto] = useState(googlePhoto);
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
      const circle = await withTimeout(joinCircleByCode({ uid, displayName: name.trim(), code, photo: photoToSave(photo, googlePhoto) }), NETWORK_TIMEOUT_MS);
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
        googlePhoto={googlePhoto}
        onCancel={() => { setMode(null); setError(''); }}
        onCreated={(circle, yourName) => { setCreated(circle); setName(yourName); setMode('created'); }}
      />
    );
  }

  if (mode === 'created') {
    return (
      <section className="stack">
        <CircleIcon icon={circleIconOf(created)} size={72} />
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
        <fieldset className="photo-field">
          <legend>Your photo <span className="muted">(optional)</span></legend>
          <PhotoPicker name={name} photo={photo} googlePhoto={googlePhoto} onChange={setPhoto} size={80} />
        </fieldset>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Joining…' : 'Join circle'}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode(null); setError(''); }}>Back</button>
      </form>
    );
  }

  return (
    <section className="stack welcome">
      <header className="welcome-hero">
        <h1 className="welcome-title">EVIE</h1>
        <p className="welcome-sub">Event Video & Information Exchange</p>
      </header>
      <p className="lead">Seizures, medications and daily care, in one record for everyone who looks after them.</p>
      {notice && <p className="notice" role="status">{notice}</p>}
      <button className="btn primary big" onClick={() => setMode('create')}>Start a care circle</button>
      <button className="btn big" onClick={() => setMode('join')}>Join with a code</button>
      {error && <p className="error">{error}</p>}
      <div className="welcome-more">
        {email
          ? (
            <div className="signed-in">
              <p className="muted small">Signed in with Google as {email}</p>
              {onSignOut && <button className="link-btn" onClick={onSignOut}>Sign out</button>}
            </div>
          )
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

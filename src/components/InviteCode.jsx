import { useState } from 'react';
import { newJoinCode } from '../data/circles.js';
import { shareJoinCode, shareMessage } from '../lib/share.js';
import { withTimeout } from '../lib/timeout.js';
import { useFlash } from '../lib/useFlash.js';

// The join code, big, with Share (a link that fills the code in) and Copy.
export function InviteCode({ circle }) {
  const [msg, setMsg] = useFlash();

  async function share() {
    setMsg(shareMessage(await shareJoinCode(circle), circle));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(circle.joinCode);
      setMsg('Code copied.');
    } catch {
      setMsg(`Couldn't copy. The code is ${circle.joinCode}.`);
    }
  }

  return (
    <>
      <div className="join-code" aria-label="Join code">{circle.joinCode}</div>
      <div className="invite-actions">
        <button type="button" className="btn primary" onClick={share}>Share invite link</button>
        <button type="button" className="btn" onClick={copy}>Copy code</button>
      </div>
      <p className="muted small" role="status">{msg || 'The link opens EVIE with the code already filled in.'}</p>
    </>
  );
}

export default function InviteSheet({ circle, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // For a code that reached the wrong person: the old one stops working for anyone not yet in.
  async function renew() {
    setError('');
    if (!navigator.onLine) {
      setError("You're offline. Connect to the internet and try again.");
      return;
    }
    if (!window.confirm('Make a new code? The current one stops working for anyone who hasn’t joined yet. People already in the circle stay.')) return;
    setBusy(true);
    try {
      await withTimeout(newJoinCode(circle), 15000); // the live circle then shows the new code
    } catch (err) {
      console.error('new code', err);
      setError("Couldn't make a new code. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet panel" role="dialog" aria-modal="true" aria-label="Invite family" onClick={(e) => e.stopPropagation()}>
        <h2>Invite family</h2>
        <p className="muted">
          Anyone with this code can join {circle.personName}’s circle and see everything in it. Share it only with people who care for them.
        </p>
        <InviteCode circle={circle} />
        {error && <p className="error">{error}</p>}
        <button className="card-action link-btn" onClick={renew} disabled={busy}>
          {busy ? 'Making a new code…' : 'Code went to the wrong person? Get a new code'}
        </button>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

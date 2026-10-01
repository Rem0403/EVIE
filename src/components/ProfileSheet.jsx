import { useEffect, useRef, useState } from 'react';
import PhotoPicker from './PhotoPicker.jsx';
import { useSwipeDismiss } from '../lib/useSwipeDismiss.js';

// Your picture in this circle, which everyone in it sees, and your Google account. Photo changes
// save straight away (offline they're queued and sync later), so there's no separate Save button.
// onGoogle resolves to an error message, or '' when done; onSignOut asks first, then clears the phone.
export default function ProfileSheet({ circle, me, photo, googlePhoto, email = '', onChangePhoto, onGoogle, onSignOut, onClose }) {
  const sheet = useSwipeDismiss(onClose);
  const title = useRef(null);
  const [googleError, setGoogleError] = useState('');

  async function google() {
    setGoogleError(await onGoogle());
  }

  useEffect(() => title.current?.focus(), []); // once, when it opens, so live updates don't move focus
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={sheet.dismiss}>
      <div ref={sheet.ref} {...sheet.handlers} className="sheet panel profile-sheet" role="dialog" aria-modal="true"
        aria-labelledby="profile-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="profile-title" ref={title} tabIndex={-1}>{me.name}</h2>
        <PhotoPicker name={me.name} photo={photo} googlePhoto={googlePhoto} onChange={onChangePhoto} />
        <p className="muted small">Everyone in {circle.personName}’s circle sees your photo next to your name.</p>
        <div className="group profile-google">
          {email ? (
            <>
              <span>Signed in with Google<span className="list-sub">{email}</span></span>
              <button className="btn" onClick={onSignOut}>Sign out of Google</button>
            </>
          ) : (
            <>
              <span>Not signed in<span className="list-sub">Save with Google to get back to this circle on a new phone.</span></span>
              <button className="btn" onClick={google}>Save with Google</button>
            </>
          )}
          {googleError && <p className="error" role="alert">{googleError}</p>}
        </div>
        <button className="btn" onClick={sheet.dismiss}>Done</button>
      </div>
    </div>
  );
}

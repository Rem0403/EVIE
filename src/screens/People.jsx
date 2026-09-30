import { useEffect, useState } from 'react';
import { listMembers, ownerOf, removeMember } from '../data/circles.js';
import { withTimeout } from '../lib/timeout.js';
import Loader from '../components/Loader.jsx';

const NETWORK_TIMEOUT_MS = 15000;
const OFFLINE = "You're offline. Connect to the internet and try again.";

// Who is in the circle. Whoever started it can remove someone, which also changes the join code.
// onDeleteCircle: deletes the whole circle (App does it, then clears this phone).
export default function People({ circle, me, onBack, onInvite, onDeleteCircle }) {
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(null);
  const owner = ownerOf(circle);
  const isOwner = owner === me.uid;
  const memberKey = (circle.memberIds || []).join(',');

  useEffect(() => {
    let live = true;
    listMembers(circle)
      .then((list) => live && setMembers(list))
      .catch((err) => {
        console.error('members', err);
        if (live) setError("Couldn't load who's in the circle. Check your connection.");
      });
    return () => { live = false; };
  }, [circle.id, memberKey]);

  async function remove(m) {
    setDone('');
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    if (!window.confirm(
      `Remove ${m.name} from ${circle.personName}’s circle? They lose access right away, though anything already `
      + 'saved on their phone stays there. The join code changes too, so share the new one with anyone still waiting to join.',
    )) return;
    setBusy(m.uid);
    setError('');
    try {
      const code = await withTimeout(removeMember(circle, m.uid), NETWORK_TIMEOUT_MS);
      setDone(`${m.name} was removed. The new join code is ${code}.`);
    } catch (err) {
      console.error('remove member', err);
      setError(`Couldn't remove ${m.name}. Check your connection and try again.`);
    } finally {
      setBusy(null);
    }
  }

  // Can't be undone, so the person's name has to be typed, not just tapped through.
  function confirmDelete() {
    setError('');
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    const typed = window.prompt(
      `This deletes ${circle.personName}’s circle and everything in it, for everyone, and can’t be undone. `
      + 'This phone is cleared too, including videos and files kept only here; ones kept on other people’s phones stay there. '
      + `To confirm, type ${circle.personName}:`,
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== circle.personName.trim().toLowerCase()) {
      setError(`That didn’t match “${circle.personName}”, so nothing was deleted.`);
      return;
    }
    onDeleteCircle();
  }

  const ownerName = members?.find((m) => m.uid === owner)?.name || 'whoever started the circle';
  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <div className="spread">
        <h1>People</h1>
        <button className="btn small" onClick={onInvite}>Invite</button>
      </div>
      <p className="muted">Everyone here can see and add to everything in {circle.personName}’s circle.</p>

      {!members && !error && <div className="loader-row" aria-busy="true"><Loader label="Loading who's in the circle…" /></div>}
      {members && (
        <ul className="people-list">
          {members.map((m) => (
            <li key={m.uid} className="person">
              <span>
                <strong>{m.name}</strong>{m.uid === me.uid && ' (you)'}
                {m.uid === owner && <span className="list-sub">Started the circle</span>}
              </span>
              {isOwner && m.uid !== me.uid && (
                <button className="btn small danger" disabled={busy !== null} onClick={() => remove(m)}
                  aria-label={`Remove ${m.name}`}>{busy === m.uid ? 'Removing…' : 'Remove'}</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {done && <p className="notice" role="status">{done}</p>}
      {error && <p className="error">{error}</p>}
      <p className="muted small">
        {isOwner
          ? 'You started this circle, so you can remove people. If you leave, the next person on the list can.'
          : `Only ${ownerName}, who started the circle, can remove people. You can leave from More.`}
      </p>
      {isOwner && onDeleteCircle && (
        <button className="btn danger" onClick={confirmDelete}>Delete this circle for everyone</button>
      )}
    </section>
  );
}

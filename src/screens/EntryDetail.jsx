import { useState } from 'react';
import { detailRows, TYPE_META } from '../lib/format.js';
import { validateClip } from '../lib/validate.js';
import { deleteEntry } from '../data/entries.js';
import { attachMedia } from '../data/clips.js';
import Media from '../components/Media.jsx';
import Icon from '../components/Icon.jsx';

export default function EntryDetail({ circle, entry, me, onBack }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const meta = TYPE_META[entry.type] || TYPE_META.note;
  const canAttachClip = entry.type === 'seizure' && entry.clipStatus !== 'done' && progress === null;
  // "uploading" with no save running here means a save was cut off (or another phone is mid-save).
  const clipPending = entry.clipStatus === 'uploading' && progress === null;

  async function attach(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const err = validateClip(f);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setProgress(0);
    try {
      await attachMedia(circle.id, entry.id, f, 'clip', setProgress);
    } catch (uploadErr) {
      console.error(uploadErr);
      setError("Couldn't save the clip on this phone. It may be out of space.");
    } finally {
      setProgress(null);
    }
  }

  function remove() {
    if (!window.confirm('Delete this entry for everyone?')) return;
    deleteEntry(circle.id, entry.id).catch((err) => console.error('delete failed', err));
    onBack();
  }

  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <h1 className={`with-icon type-${entry.type}`}><Icon name={entry.type} size={28} />{meta.label}</h1>

      <Media entry={entry} kind="clip" preload="metadata" shareable />
      <Media entry={entry} kind="photo" />

      <dl className="detail-rows card">
        {detailRows(entry).map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {clipPending && (
        <p className="muted small">A clip save started but didn't finish. You can attach it again below.</p>
      )}
      {canAttachClip && (
        <label className="btn" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
          <Icon name="clip" /> {entry.clipStatus === 'failed' || clipPending ? 'Retry clip' : 'Attach clip'}
          <input type="file" accept="video/*" onChange={attach} hidden />
        </label>
      )}
      {progress !== null && <progress value={progress} max={1} />}
      {error && <p className="error">{error}</p>}

      {entry.createdBy === me.uid && <button className="btn danger" onClick={remove}>Delete entry</button>}
    </section>
  );
}

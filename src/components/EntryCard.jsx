import Media from './Media.jsx';
import Icon from './Icon.jsx';
import { entryTitle, formatTime, TYPE_META } from '../lib/format.js';

// One timeline entry in the summary-card pattern: type icon and label, time, then the entry itself.
export default function EntryCard({ entry, onClick }) {
  const meta = TYPE_META[entry.type] || TYPE_META.note;
  const uploading = entry.clipStatus === 'uploading' || entry.photoStatus === 'uploading';
  const failed = entry.clipStatus === 'failed' || entry.photoStatus === 'failed';
  return (
    <div className="entry-group">
      <button className={`summary-card entry entry-${entry.type}`} onClick={onClick}>
        <span className="card-head">
          <span className={`card-label tc-${entry.type}`}><Icon name={entry.type} size={18} />{meta.label}</span>
          <span className="card-time">{formatTime(entry.occurredAt)}<Icon name="chevron" size={14} /></span>
        </span>
        <span className="card-value sm">{entryTitle(entry)}</span>
        <span className="entry-meta">Logged by {entry.createdByName || 'someone'}</span>
        {uploading && <span className="entry-meta">Saving…</span>}
        {failed && <span className="entry-warn">Clip or photo not saved. Tap to retry.</span>}
      </button>
      <Media entry={entry} kind="clip" className="entry-clip" />
    </div>
  );
}

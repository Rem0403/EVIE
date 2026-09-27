import Media from './Media.jsx';
import Icon from './Icon.jsx';
import { entryTitle, formatTime } from '../lib/format.js';

export default function EntryCard({ entry, onClick }) {
  const uploading = entry.clipStatus === 'uploading' || entry.photoStatus === 'uploading';
  const failed = entry.clipStatus === 'failed' || entry.photoStatus === 'failed';
  return (
    <div className="entry-group">
      <button className={`card entry entry-${entry.type}`} onClick={onClick}>
        <span className="entry-icon"><Icon name={entry.type} /></span>
        <span className="entry-body">
          <span className="entry-title">{entryTitle(entry)}</span>
          <span className="entry-meta">
            {formatTime(entry.occurredAt)} · logged by {entry.createdByName || 'someone'}
          </span>
          {uploading && <span className="entry-meta">Saving…</span>}
          {failed && <span className="entry-warn">Clip or photo not saved — tap to retry</span>}
        </span>
      </button>
      <Media entry={entry} kind="clip" className="entry-clip" />
    </div>
  );
}

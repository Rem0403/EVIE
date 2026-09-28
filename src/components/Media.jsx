import { useEffect, useState } from 'react';
import { getMedia } from '../lib/mediaStore.js';
import { shareOrDownload } from '../lib/export.js';
import { toLocalInput } from '../lib/format.js';
import Icon from './Icon.jsx';

const LABELS = { clip: 'Clip', photo: 'Photo' };
const EXT = { 'video/quicktime': 'mov', 'video/webm': 'webm' };
const clipName = (entry, blob) =>
  `EVIE-seizure-${toLocalInput(entry.occurredAt).replace('T', '-').replace(':', '')}.${EXT[blob.type] || 'mp4'}`;

// Shows an entry's clip or photo if this phone has it, otherwise says whose phone does.
// `shareable` adds a Share clip button (share sheet, or download where sharing files isn't supported).
export default function Media({ entry, kind, className, preload = 'none', shareable = false }) {
  const saved = entry[`${kind}Status`] === 'done';
  const [blob, setBlob] = useState(null);
  const [src, setSrc] = useState(null);
  const [missing, setMissing] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (!saved) return undefined;
    let url;
    let live = true;
    getMedia(`${kind}:${entry.id}`)
      .then((found) => {
        if (!live) return;
        if (!found) return setMissing(true);
        url = URL.createObjectURL(found);
        setBlob(found);
        setSrc(url);
      })
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [saved, kind, entry.id]);

  if (missing) {
    const on = entry[`${kind}On`];
    return <p className="entry-meta with-icon"><Icon name={kind} size={16} />{`${LABELS[kind]} saved on ${on ? `${on}'s` : 'another'} phone`}</p>;
  }
  if (!src) return null;
  if (kind === 'photo') return <img data-testid="media-photo" className={className || 'photo'} src={src} loading="lazy" decoding="async" alt="Attached to this note" />;
  const video = <video data-testid="media-clip" className={className} src={src} controls playsInline preload={preload} />;
  if (!shareable) return video;

  function share() {
    setShareError('');
    shareOrDownload(blob, clipName(entry, blob)).catch((err) => {
      console.error(err);
      setShareError("Couldn't share the clip. Try again, or save it from the video player.");
    });
  }
  return (
    <>
      {video}
      <button className="btn" onClick={share}><Icon name="clip" /> Share clip</button>
      {shareError && <p className="error">{shareError}</p>}
    </>
  );
}

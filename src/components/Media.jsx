import { useEffect, useState } from 'react';
import { getMedia } from '../lib/mediaStore.js';
import Icon from './Icon.jsx';

const LABELS = { clip: 'Clip', photo: 'Photo' };

// Shows an entry's clip or photo if this phone has it, otherwise says whose phone does.
export default function Media({ entry, kind, className, preload = 'none' }) {
  const saved = entry[`${kind}Status`] === 'done';
  const [src, setSrc] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    let url;
    let live = true;
    getMedia(`${kind}:${entry.id}`)
      .then((blob) => {
        if (!live) return;
        if (!blob) return setMissing(true);
        url = URL.createObjectURL(blob);
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
  return <video data-testid="media-clip" className={className} src={src} controls playsInline preload={preload} />;
}

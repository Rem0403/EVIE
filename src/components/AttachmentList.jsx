import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import ImagePreview from './ImagePreview.jsx';
import { formatBytes, kindOf, loadAttachment } from '../lib/attachments.js';
import { shareOrDownload } from '../lib/export.js';

const ICON = { image: 'photo', pdf: 'doc', file: 'doc' };

// Saved attachments. Files live on the phone that added them; other phones see whose phone has them.
export default function AttachmentList({ items = [], on, onRemove, label = 'Attachments' }) {
  const [blobs, setBlobs] = useState(new Map());
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let live = true;
    const urls = [];
    Promise.all(items.map((it) => loadAttachment(it.id).then((b) => [it.id, b]).catch(() => [it.id, null])))
      .then((pairs) => {
        if (!live) return;
        setBlobs(new Map(pairs.map(([id, b]) => {
          if (!b) return [id, null];
          const url = URL.createObjectURL(b);
          urls.push(url);
          return [id, { blob: b, url }];
        })));
      });
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [items]);

  if (!items.length) return null;

  return (
    <>
      <ul className="attach-list" aria-label={label}>
        {items.map((it) => {
          const kind = kindOf(it.type, it.name);
          const here = blobs.get(it.id);
          return (
            <li key={it.id} className="attach-row">
              {kind === 'image' && here ? (
                <button type="button" className="attach-thumb" aria-label={`Preview ${it.name}`} onClick={() => setPreview({ src: here.url, name: it.name })}>
                  <img src={here.url} alt="" />
                </button>
              ) : (
                <span className="attach-icon" aria-hidden="true"><Icon name={ICON[kind]} size={18} /></span>
              )}
              <span className="attach-name">
                {it.name}
                {!here && blobs.size > 0 && <span className="list-sub">Saved on {(it.on || on) ? `${it.on || on}’s` : 'another'} phone</span>}
              </span>
              <span className="attach-size">{formatBytes(it.size)}</span>
              {here && kind !== 'image' && (
                <a className="attach-action" href={here.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${it.name}`}>Open</a>
              )}
              {here && (
                <button type="button" className="attach-action" aria-label={`Share ${it.name}`}
                  onClick={() => shareOrDownload(here.blob, it.name).catch((e) => console.error(e))}>Share</button>
              )}
              {onRemove && (
                <button type="button" className="attach-remove" aria-label={`Remove ${it.name}`} onClick={() => onRemove(it)}>
                  <Icon name="x" size={18} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {preview && <ImagePreview src={preview.src} name={preview.name} onClose={() => setPreview(null)} />}
    </>
  );
}

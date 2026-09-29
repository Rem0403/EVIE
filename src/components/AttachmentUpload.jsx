import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import ImagePreview from './ImagePreview.jsx';
import { ATTACHMENT_ACCEPT, checkFiles, formatBytes, kindOf, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS } from '../lib/attachments.js';

const ICON = { image: 'photo', pdf: 'doc', file: 'doc' };

// Pick files to attach, before saving (adapted from beui.dev's file upload, in plain CSS).
// `files` are the picked File objects; they are saved to this phone when the form is saved.
// No fake upload progress: nothing is uploaded, the files stay on this phone.
export default function AttachmentUpload({ files, onChange, existingCount = 0, label = 'Attachments' }) {
  const inputId = useId();
  const input = useRef(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [urls, setUrls] = useState(new Map());
  const total = existingCount + files.length;
  const full = total >= MAX_ATTACHMENTS;

  // Thumbnails for picked photos; object URLs are released when files go away.
  useEffect(() => {
    const next = new Map(files.filter((f) => kindOf(f.type, f.name) === 'image').map((f) => [f, URL.createObjectURL(f)]));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function add(list) {
    const { accepted, rejected } = checkFiles(total, Array.from(list));
    setErrors(rejected.map((r) => r.reason));
    if (accepted.length) onChange([...files, ...accepted]);
  }

  const drag = {
    onDragEnter: (e) => { e.preventDefault(); depth.current += 1; setDragging(true); },
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
    onDragLeave: (e) => { e.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); },
    onDrop: (e) => { e.preventDefault(); depth.current = 0; setDragging(false); add(e.dataTransfer.files); },
  };

  return (
    <div className="attach">
      <input ref={input} id={inputId} type="file" multiple accept={ATTACHMENT_ACCEPT} hidden
        onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
      <button type="button" className={`dropzone${dragging ? ' dragging' : ''}`} disabled={full}
        onClick={() => input.current?.click()} {...(full ? {} : drag)}>
        <span className="dropzone-icon" aria-hidden="true"><Icon name="upload" size={20} /></span>
        <span className="dropzone-title">{full ? 'Attachment limit reached' : 'Add photos or documents'}</span>
        <span className="dropzone-sub">
          {full ? `${total} of ${MAX_ATTACHMENTS} files` : `Tap to choose, or drop files here. Up to ${formatBytes(MAX_ATTACHMENT_BYTES)} each.`}
        </span>
      </button>
      <p className="small muted">Files stay on this phone. Don’t attach insurance or Medicaid cards, or anything with ID numbers.</p>
      {errors.length > 0 && <ul className="error attach-errors" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

      {files.length > 0 && (
        <ul className="attach-list" aria-label={label}>
          {files.map((f, i) => {
            const kind = kindOf(f.type, f.name);
            return (
              <li key={`${f.name}-${i}`} className="attach-row">
                {kind === 'image' && urls.get(f) ? (
                  <button type="button" className="attach-thumb" aria-label={`Preview ${f.name}`} onClick={() => setPreview({ src: urls.get(f), name: f.name })}>
                    <img src={urls.get(f)} alt="" />
                  </button>
                ) : (
                  <span className="attach-icon" aria-hidden="true"><Icon name={ICON[kind]} size={18} /></span>
                )}
                <span className="attach-name">{f.name}</span>
                <span className="attach-size">{formatBytes(f.size)}</span>
                <button type="button" className="attach-remove" aria-label={`Remove ${f.name}`}
                  onClick={() => onChange(files.filter((_, j) => j !== i))}><Icon name="x" size={18} /></button>
              </li>
            );
          })}
        </ul>
      )}
      {preview && <ImagePreview src={preview.src} name={preview.name} onClose={() => setPreview(null)} />}
    </div>
  );
}

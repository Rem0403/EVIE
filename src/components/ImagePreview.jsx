import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// Full-size photo viewer: Escape or the button closes it, focus stays on Close while open,
// the page behind doesn't scroll, and focus returns to where it was.
export default function ImagePreview({ src, name, onClose }) {
  const close = useRef(null);

  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div className="preview" role="dialog" aria-modal="true" aria-label={`Preview of ${name}`} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={name} />
        <button ref={close} className="preview-close" aria-label="Close preview" onClick={onClose}><Icon name="x" size={20} /></button>
      </div>
    </div>
  );
}

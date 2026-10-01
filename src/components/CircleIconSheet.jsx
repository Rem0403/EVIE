import { useEffect, useRef, useState } from 'react';
import CircleIconPicker from './CircleIconPicker.jsx';
import { updateCircle } from '../data/circles.js';
import { DEFAULT_ICON } from '../lib/circleIcon.js';
import { showToast } from '../lib/toast.js';
import { useSwipeDismiss } from '../lib/useSwipeDismiss.js';

// Changing the circle's icon from the home screen. Anyone in the circle can; everyone sees it.
// Saved on Done (offline it's queued and syncs later); Cancel, swiping down or Escape keep the old one.
export default function CircleIconSheet({ circle, onClose }) {
  const [value, setValue] = useState(() => ({
    icon: circle.icon || DEFAULT_ICON.icon,
    iconColor: circle.iconColor || DEFAULT_ICON.iconColor,
    iconPhoto: circle.iconPhoto || '',
  }));
  const sheet = useSwipeDismiss(onClose);
  const title = useRef(null);

  useEffect(() => title.current?.focus(), []); // once, when it opens
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function save() {
    if (value.icon !== circle.icon || value.iconColor !== circle.iconColor || value.iconPhoto !== (circle.iconPhoto || '')) {
      updateCircle(circle.id, value).catch((err) => {
        console.error('circle icon', err);
        showToast("Couldn't save the circle icon. Try again.");
      });
    }
    sheet.dismiss();
  }

  return (
    <div className="sheet-backdrop" onClick={sheet.dismiss}>
      <div ref={sheet.ref} {...sheet.handlers} className="sheet panel circle-icon-sheet" role="dialog" aria-modal="true"
        aria-labelledby="circle-icon-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="circle-icon-title" ref={title} tabIndex={-1}>{circle.personName}’s circle icon</h2>
        <CircleIconPicker value={value} onChange={setValue} />
        <button className="btn primary" onClick={save}>Done</button>
        <button className="btn ghost" onClick={sheet.dismiss}>Cancel</button>
      </div>
    </div>
  );
}

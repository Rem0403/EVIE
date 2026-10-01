import { useEffect, useState } from 'react';
import { useSwipeDismiss } from '../lib/useSwipeDismiss.js';

// One toast at a time, above the nav. It slides up, and slides away on its own, when swiped
// down, or when Undo is tapped. Undo toasts stay longer so there's time to reach the button.
export default function Toast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const show = (e) => setToast({ ...e.detail, id: Date.now() });
    window.addEventListener('evie-toast', show);
    return () => window.removeEventListener('evie-toast', show);
  }, []);
  if (!toast) return null;
  // Keyed, so a newer toast gets its own timer and an older one closing can't take it down.
  return <ToastItem key={toast.id} toast={toast} onClose={() => setToast((t) => (t === toast ? null : t))} />;
}

function ToastItem({ toast, onClose }) {
  const sheet = useSwipeDismiss(onClose);
  useEffect(() => {
    const timer = setTimeout(sheet.dismiss, toast.undo ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, []);

  function undo() {
    toast.undo();
    sheet.dismiss();
  }

  return (
    <div className="toast-wrap no-print">
      <div ref={sheet.ref} {...sheet.handlers} className="toast" role="status">
        <span>{toast.text}</span>
        {toast.undo && <button className="toast-undo" onClick={undo}>Undo</button>}
      </div>
    </div>
  );
}

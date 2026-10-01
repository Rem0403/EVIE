import { useRef } from 'react';

const SLIDE_MS = 400; // --dur-slide

const reducedMotion = () => !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Bottom sheets: drag the sheet down to close it, and it slides away (instead of vanishing)
// when closed from the backdrop. Put `ref` and `handlers` on the sheet, `dismiss` on the backdrop.
export function useSwipeDismiss(onClose) {
  const ref = useRef(null);
  const drag = useRef(null);

  function move(y, ms) {
    const el = ref.current;
    el.style.animation = 'none'; // the sheet-up animation would otherwise override the inline transform
    el.style.transition = ms ? `transform ${ms}ms var(--ease-slide)` : 'none';
    el.style.transform = y ? `translateY(${y})` : '';
  }

  function dismiss() {
    const el = ref.current;
    if (!el || reducedMotion()) return onClose();
    move('100%', SLIDE_MS);
    el.parentElement.style.transition = `opacity ${SLIDE_MS}ms`;
    el.parentElement.style.opacity = '0';
    setTimeout(onClose, SLIDE_MS);
  }

  const handlers = {
    onTouchStart(e) {
      // Only from the top of a scrolled sheet, so dragging down still scrolls a long one back up.
      drag.current = ref.current.scrollTop > 0 ? null : { y: e.touches[0].clientY, dy: 0, t: Date.now() };
    },
    onTouchMove(e) {
      const d = drag.current;
      if (!d) return;
      d.dy = Math.max(0, e.touches[0].clientY - d.y);
      move(`${d.dy}px`, 0);
    },
    onTouchEnd() {
      const d = drag.current;
      drag.current = null;
      if (!d?.dy) return;
      const flick = d.dy / (Date.now() - d.t) > 0.5; // px per ms
      if (flick || d.dy > ref.current.offsetHeight / 4) dismiss();
      else move('', 200);
    },
  };
  handlers.onTouchCancel = handlers.onTouchEnd;

  return { ref, handlers, dismiss };
}

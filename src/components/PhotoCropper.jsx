import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { squareToDataUrl } from '../lib/avatar.js';
import { clamp, cropSquare, fitted, MAX_ZOOM, minScale, zoomAt } from '../lib/crop.js';

const STEP_PX = 12; // arrow keys move this far
const KEY_ZOOM = 1.15; // + and - zoom this much

// Move and scale, like choosing a contact photo on iPhone: the photo behind a round cut-out,
// dragged with one finger (or the mouse), pinched or scrolled to zoom. The zoom slider and the
// arrow, + and - keys do the same without gestures. onChoose gets the finished photo.
// shape: 'circle' (a profile picture) or 'rounded' (the rounded square of a circle icon).
export default function PhotoCropper({ img, onChoose, onCancel, shape = 'circle' }) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const stage = useRef(null);
  const pointers = useRef(new Map()); // pointerId -> { x, y }, for drag and pinch
  const boxRef = useRef(0);
  const [box, setBox] = useState(0);
  const [view, setView] = useState(null);
  const [error, setError] = useState('');

  // The circle is as big as the space allows (up to 400px). If the screen changes size, the
  // photo keeps the same framing, just scaled to the new circle.
  useLayoutEffect(() => {
    function measure() {
      const r = stage.current.getBoundingClientRect();
      const next = Math.max(120, Math.floor(Math.min(r.width - 32, r.height - 32, 400)));
      const k = boxRef.current ? next / boxRef.current : 1;
      boxRef.current = next;
      setBox(next);
      setView((v) => (v ? clamp({ scale: v.scale * k, x: v.x * k, y: v.y * k }, w, h, next) : fitted(w, h, next)));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [w, h]);

  useEffect(() => stage.current.focus(), []);

  // Scroll-wheel zoom (a mouse or trackpad). Added directly so it can stop the page behind from
  // scrolling too, which React's wheel listener can't.
  useEffect(() => {
    const el = stage.current;
    function onWheel(e) {
      e.preventDefault();
      const [px, py] = fromCenter({ x: e.clientX, y: e.clientY });
      setView((v) => v && zoomAt(v, Math.exp(-e.deltaY * 0.002), px, py, w, h, boxRef.current));
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [w, h]);

  // Where a pointer is, relative to the circle's center.
  function fromCenter(p) {
    const r = stage.current.getBoundingClientRect();
    return [p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2)];
  }

  function onPointerDown(e) {
    stage.current.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e) {
    const ps = pointers.current;
    if (!ps.has(e.pointerId)) return;
    const [a0, b0] = [...ps.values()];
    ps.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a1, b1] = [...ps.values()];
    if (!b1) {
      setView((v) => clamp({ ...v, x: v.x + a1.x - a0.x, y: v.y + a1.y - a0.y }, w, h, boxRef.current));
      return;
    }
    // Two fingers: follow their midpoint, and zoom by how much they spread, around the midpoint.
    const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
    const mid1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
    const factor = Math.hypot(a1.x - b1.x, a1.y - b1.y) / (Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1);
    const [px, py] = fromCenter(mid1);
    setView((v) => {
      const moved = { ...v, x: v.x + mid1.x - mid0.x, y: v.y + mid1.y - mid0.y };
      return zoomAt(moved, factor, px, py, w, h, boxRef.current);
    });
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
  }

  function zoomBy(factor) {
    setView((v) => zoomAt(v, factor, 0, 0, w, h, boxRef.current));
  }

  function choose() {
    try {
      onChoose(squareToDataUrl(img, cropSquare(view, w, h, box)));
    } catch (err) {
      console.error('crop', err);
      setError(err.message || "Couldn't use that photo. Try a different one.");
    }
  }

  function onKeyDown(e) {
    e.stopPropagation(); // Escape here closes only this, not the sheet underneath
    const move = { ArrowLeft: [-STEP_PX, 0], ArrowRight: [STEP_PX, 0], ArrowUp: [0, -STEP_PX], ArrowDown: [0, STEP_PX] }[e.key];
    if (e.key === 'Escape') onCancel();
    else if (e.key === '+' || e.key === '=') zoomBy(KEY_ZOOM);
    else if (e.key === '-' || e.key === '_') zoomBy(1 / KEY_ZOOM);
    else if (move && e.target === stage.current) {
      setView((v) => clamp({ ...v, x: v.x + move[0], y: v.y + move[1] }, w, h, boxRef.current));
    } else return;
    e.preventDefault();
  }

  // Drags and taps here mustn't reach what's underneath: a sheet that closes when dragged down,
  // or the swipe between Home and the Care summary.
  const stop = (e) => e.stopPropagation();
  const min = box ? minScale(w, h, box) : 1;

  return createPortal(
    <div className="cropper" role="dialog" aria-modal="true" aria-labelledby="cropper-title" onKeyDown={onKeyDown}
      onClick={stop} onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop} onPointerDown={stop}>
      <h2 id="cropper-title" className="cropper-title">Move and scale</h2>
      <div
        ref={stage}
        className="cropper-stage"
        tabIndex={0}
        aria-label="Photo. Drag or use the arrow keys to move it; pinch, scroll or use plus and minus to zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {view && (
          <img className="cropper-img" src={img.src} alt="" draggable={false}
            style={{ width: w, height: h, transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
        )}
        {box > 0 && <div className={`cropper-hole${shape === 'rounded' ? ' rounded' : ''}`} style={{ width: box, height: box }} aria-hidden="true" />}
      </div>
      <label className="cropper-zoom">
        <span className="sr-only">Zoom</span>
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={view ? view.scale / min : 1}
          onChange={(e) => view && zoomBy((Number(e.target.value) * min) / view.scale)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="cropper-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn primary" onClick={choose} disabled={!view}>Choose</button>
      </div>
    </div>,
    document.body,
  );
}

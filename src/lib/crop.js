// Move-and-scale maths for the photo cropper. The photo is shown at `scale` screen pixels per
// photo pixel, with its center moved (x, y) screen pixels from the center of the circle, whose
// bounding square is `box` pixels wide. w and h are the photo's own size in pixels.

export const MAX_ZOOM = 4; // times the smallest scale that fills the circle

// The smallest scale at which the photo still fills the circle's square.
export const minScale = (w, h, box) => box / Math.min(w, h);

export const fitted = (w, h, box) => ({ scale: minScale(w, h, box), x: 0, y: 0 });

// Keeps the photo covering the whole circle: zoomed in at least enough to fill it, at most
// MAX_ZOOM times that, and never dragged so far that an edge shows inside it.
export function clamp({ scale, x, y }, w, h, box) {
  const min = minScale(w, h, box);
  const s = Math.min(Math.max(scale, min), min * MAX_ZOOM);
  const maxX = Math.max(0, (w * s - box) / 2);
  const maxY = Math.max(0, (h * s - box) / 2);
  return { scale: s, x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
}

// Zooms by `factor`, keeping the part of the photo under (px, py) where it is on screen, so a
// pinch zooms around the fingers. (px, py) is relative to the circle's center.
export function zoomAt(view, factor, px, py, w, h, box) {
  const scale = clamp({ ...view, scale: view.scale * factor }, w, h, box).scale;
  const k = scale / view.scale;
  return clamp({ scale, x: px - (px - view.x) * k, y: py - (py - view.y) * k }, w, h, box);
}

// The square of the photo, in photo pixels, that shows inside the circle.
export function cropSquare({ scale, x, y }, w, h, box) {
  const size = Math.min(box / scale, w, h);
  const sx = w / 2 - (box / 2 + x) / scale;
  const sy = h / 2 - (box / 2 + y) / scale;
  // Rounding can leave a hair outside the photo; keep it inside.
  return { sx: Math.min(Math.max(sx, 0), w - size), sy: Math.min(Math.max(sy, 0), h - size), size };
}

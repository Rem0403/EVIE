// Smooth in-app jumps (a stat tile down to the timeline, Home back to the top) using the browser's own
// smooth scrolling: no library, and ordinary scrolling is never taken over. People who turn on
// "reduce motion" get an instant jump. The glide is browser-controlled (roughly 300-500ms) and only
// follows a tap the person made.
function prefersReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

export function scrollToTop() {
  window.scrollTo?.({ top: 0, behavior: behavior() });
}

export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: behavior(), block: 'start' });
}

// Keeps `el` where it is on screen for `ms` while content above it grows or shrinks, like when
// opening one accordion section closes a long one above it. Chrome does this by itself (scroll
// anchoring); Safari doesn't, so without it the tapped header would shoot off the top.
export function holdInPlace(el, ms) {
  const top = el.getBoundingClientRect().top;
  const end = performance.now() + ms;
  (function step() {
    window.scrollBy?.(0, el.getBoundingClientRect().top - top);
    if (performance.now() < end) requestAnimationFrame(step);
  })();
}

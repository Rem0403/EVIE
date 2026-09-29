// Smooth in-app jumps (a stat tile down to the timeline, Home back to the top) using the browser's own
// smooth scrolling: no library, and ordinary scrolling is never taken over. People who turn on
// "reduce motion" get an instant jump. The glide is browser-controlled (roughly 300-500ms), a documented
// exception to the 200ms animation rule because it only follows a tap the person made.
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

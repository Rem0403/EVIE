// A finished touch that's clearly sideways: 'left' or 'right', else null. Needs 60px of travel and
// twice as much sideways as up-down, so scrolling the page never counts as a swipe.
export function swipeDirection(dx, dy) {
  if (Math.abs(dx) < 60 || Math.abs(dx) < 2 * Math.abs(dy)) return null;
  return dx < 0 ? 'left' : 'right';
}

// True when a touch starts on something that scrolls or slides sideways itself (tab rows,
// inputs), which should keep the swipe rather than change screens.
export function ownsSideways(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.matches('input, textarea, select, video')) return true;
    if (n.scrollWidth > n.clientWidth && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
  }
  return false;
}

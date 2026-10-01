// Shows a message in the <Toast /> at the bottom of the app. Pass `undo` to add an Undo button.
export function showToast(text, undo) {
  window.dispatchEvent(new CustomEvent('evie-toast', { detail: { text, undo } }));
}

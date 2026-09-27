export function generateJoinCode(rand = Math.random) {
  const n = Math.floor(rand() * 10000);
  return `EVIE-${String(n).padStart(4, '0')}`;
}

// Accepts "EVIE-4821", "evie 4821", "4821", "48 21"... returns "EVIE-4821" or null.
export function normalizeJoinCode(input) {
  if (typeof input !== 'string') return null;
  const digits = input.toUpperCase().replace(/^\s*EVIE/, '').replace(/[\s-]/g, '');
  return /^\d{4}$/.test(digits) ? `EVIE-${digits}` : null;
}

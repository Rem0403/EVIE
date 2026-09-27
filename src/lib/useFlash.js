import { useEffect, useState } from 'react';

// A message that clears itself after `ms`.
export function useFlash(ms = 3000) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), ms);
    return () => clearTimeout(timer);
  }, [message, ms]);
  return [message, setMessage];
}

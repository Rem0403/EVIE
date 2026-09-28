import { useEffect, useRef } from 'react';
import { SEIZURE_TYPES } from '../lib/format.js';
import { AFTER_SEIZURE, EMERGENCY, FIRST_AID, SEIZURE_INFO, SOURCE_URL } from '../lib/seizureInfo.js';

// Bottom sheet explaining each seizure type, opened from the ⓘ on the type step.
export default function SeizureInfo({ onClose }) {
  const title = useRef(null);

  useEffect(() => {
    title.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet info" role="dialog" aria-modal="true" aria-labelledby="seizure-info-title" onClick={(e) => e.stopPropagation()}>
        <div className="spread">
          <h2 id="seizure-info-title" ref={title} tabIndex={-1}>About seizure types</h2>
          <button className="btn small" onClick={onClose}>Close</button>
        </div>

        {SEIZURE_TYPES.map(([key, label]) => (
          <section key={key}>
            <h3>{label}</h3>
            {SEIZURE_INFO[key].full.map((text) => <p key={text}>{text}</p>)}
          </section>
        ))}

        <h3>After a seizure</h3>
        <p>{AFTER_SEIZURE}</p>
        <div className="callout">{EMERGENCY}</div>

        <h3>First aid</h3>
        <ul>{FIRST_AID.map((text) => <li key={text}>{text}</li>)}</ul>

        <p className="muted small">
          General information adapted from Wikipedia’s{' '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Epilepsy</a> article. It isn’t medical
          advice. Follow your care team’s seizure plan.
        </p>
      </div>
    </div>
  );
}

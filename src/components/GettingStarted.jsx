import Icon from './Icon.jsx';

// A short checklist on a new circle's home, in place of a tutorial: each step says what it's
// for and opens the place to do it. It goes away once everything is done, or with Hide.
export default function GettingStarted({ steps, onCarePlan, onInvite, onHide }) {
  const done = steps.filter((s) => s.done).length;
  const actions = { carePlan: onCarePlan, invite: onInvite };
  return (
    <section className="summary-card feature getting-started" aria-labelledby="getting-started-title">
      <span className="card-head">
        <span className="card-label" id="getting-started-title">Getting started</span>
        <span className="card-time">{done} of {steps.length} done</span>
      </span>
      <ol className="setup-list">
        {steps.map((s, i) => {
          const body = (
            <>
              <span className={`setup-mark${s.done ? ' done' : ''}`} aria-hidden="true">{s.done ? '✓' : i + 1}</span>
              <span className="setup-text">
                <strong>{s.title}</strong>
                {!s.done && <span className="card-sub">{s.text}</span>}
              </span>
            </>
          );
          const action = !s.done && actions[s.action];
          return (
            <li key={s.id} className={s.done ? 'is-done' : undefined}>
              {action
                ? <button className="setup-row" onClick={action}>{body}<Icon name="chevron" size={18} /></button>
                : <div className="setup-row">{body}</div>}
              {s.done && <span className="sr-only">Done</span>}
            </li>
          );
        })}
      </ol>
      <button className="card-action link-btn" onClick={onHide}>Hide this list</button>
    </section>
  );
}

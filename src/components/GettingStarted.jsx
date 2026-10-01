import Icon from './Icon.jsx';

// A short list on a new circle's home, in place of a tutorial: what's still left to set up, each
// opening the place to do it. Done steps drop off; the list goes once all are done, or with Hide.
export default function GettingStarted({ steps, onCarePlan, onInvite, onHide }) {
  const actions = { carePlan: onCarePlan, invite: onInvite };
  return (
    <section className="summary-card feature getting-started" aria-labelledby="getting-started-title">
      <span className="card-label" id="getting-started-title">Getting started</span>
      <ul className="setup-list">
        {steps.filter((s) => !s.done).map((s) => {
          const body = (
            <span className="setup-text">
              <strong>{s.title}</strong>
              <span className="card-sub">{s.text}</span>
            </span>
          );
          const action = actions[s.action];
          return (
            <li key={s.id}>
              {action
                ? <button className="setup-row" onClick={action}>{body}<Icon name="chevron" size={18} /></button>
                : <div className="setup-row">{body}</div>}
            </li>
          );
        })}
      </ul>
      <button className="card-action link-btn" onClick={onHide}>Hide this list</button>
    </section>
  );
}

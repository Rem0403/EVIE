import { dueFollowUps } from '../lib/resources.js';
import Icon from './Icon.jsx';

// Resource next steps due today or overdue, so waitlist calls and applications don't slip.
export default function FollowUps({ resources, now = Date.now(), onOpen }) {
  const due = dueFollowUps(resources, now);
  if (!due.length) return null;
  return (
    <section className="summary-card block-gold feature" aria-labelledby="follow-ups-title">
      <span className="card-head">
        <span className="card-label" id="follow-ups-title"><Icon name="flag" size={18} />Follow up</span>
        <span className="card-time">Due</span>
      </span>
      {due.map((r) => (
        <button key={r.id} className="list-row follow-up" onClick={() => onOpen(r.id)}>
          <span>{r.nextStep}<span className="list-sub">{r.name}</span></span>
          <Icon name="chevron" size={18} />
        </button>
      ))}
    </section>
  );
}

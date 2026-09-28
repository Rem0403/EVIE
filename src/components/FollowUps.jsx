import { dueFollowUps } from '../lib/resources.js';

// Resource next steps due today or overdue, so waitlist calls and applications don't slip.
export default function FollowUps({ resources, now = Date.now(), onOpen }) {
  const due = dueFollowUps(resources, now);
  if (!due.length) return null;
  return (
    <section className="card follow-ups" aria-labelledby="follow-ups-title">
      <h2 id="follow-ups-title" className="today-title">Follow up</h2>
      {due.map((r) => (
        <button key={r.id} className="follow-up" onClick={() => onOpen(r.id)}>
          <span>{r.nextStep}</span>
          <span className="muted small">{r.name}</span>
        </button>
      ))}
    </section>
  );
}

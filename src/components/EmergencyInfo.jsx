import { COMMUNICATION, diagnosisText, labelOf } from '../lib/format.js';
import { CONTACT_ROLES } from '../lib/careplan.js';
import { formatSlot } from '../lib/meds.js';
import { telHref } from '../lib/resources.js';
import AttachmentList from './AttachmentList.jsx';

// What a caregiver, babysitter or paramedic needs first. Built from the care plan, and readable
// offline because the circle is in Firestore's local cache.
export default function EmergencyInfo({ circle, onEditPlan }) {
  const p = circle.profile || {};
  const meds = circle.meds || [];
  const contacts = p.contacts || [];
  const empty = !p.rescuePlan && !p.allergies && !contacts.length && !meds.length && !diagnosisText(p);

  return (
    <div className="stack emergency">
      <a className="btn danger big" href="tel:911">Call 911</a>

      {empty && (
        <div className="card">
          <p>Nothing here yet. Add their seizure plan, allergies and emergency contacts in the care plan.</p>
          {onEditPlan && <button className="btn small" onClick={onEditPlan}>Open care plan</button>}
        </div>
      )}

      {p.rescuePlan && (
        <section className="callout">
          <h3>Their seizure plan</h3>
          <p className="pre">{p.rescuePlan}</p>
        </section>
      )}

      {contacts.length > 0 && (
        <section>
          <h3>Contacts</h3>
          {contacts.map((c, i) => {
            const tel = telHref(c.phone);
            return (
              <div key={i} className="contact">
                <span><strong>{c.name}</strong> <span className="muted small">{labelOf(CONTACT_ROLES, c.role)}</span></span>
                {tel && <a className="btn small" href={tel} aria-label={`Call ${c.name}`}>Call {c.phone}</a>}
              </div>
            );
          })}
        </section>
      )}

      {!empty && (
        <dl className="detail-rows card">
          <dt>Allergies</dt>
          <dd>{p.allergies || 'None recorded'}</dd>
          {diagnosisText(p) && (<><dt>Diagnoses</dt><dd>{diagnosisText(p)}</dd></>)}
          {p.communication && (<><dt>Communication</dt><dd>{labelOf(COMMUNICATION, p.communication)}</dd></>)}
          {p.helps && (<><dt>What helps</dt><dd className="pre">{p.helps}</dd></>)}
          {p.avoid && (<><dt>Avoid</dt><dd className="pre">{p.avoid}</dd></>)}
        </dl>
      )}

      {meds.length > 0 && (
        <section>
          <h3>Daily medications</h3>
          {meds.map((m) => (
            <p key={m.name} className="med-line">
              <strong>{[m.name, m.dose].filter(Boolean).join(' · ')}</strong>
              <span className="muted small"> {m.times.map(formatSlot).join(', ')}</span>
              {m.purpose && <span className="small"> · for {m.purpose}</span>}
              {m.notes && <span className="small"> · {m.notes}</span>}
            </p>
          ))}
        </section>
      )}

      {circle.documents?.length > 0 && (
        <section>
          <h3>Documents</h3>
          <AttachmentList items={circle.documents} label="Care plan documents" />
        </section>
      )}

      {p.routine && (
        <section>
          <h3>Daily routine</h3>
          <p className="pre">{p.routine}</p>
        </section>
      )}
    </div>
  );
}

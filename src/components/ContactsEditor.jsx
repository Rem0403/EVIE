import ChipGroup from './ChipGroup.jsx';
import { CONTACT_ROLES } from '../lib/careplan.js';

export const blankContact = () => ({ name: '', role: 'family', phone: '' });

// Rows of name, role and phone. Used by the care plan and by setup; cleanContacts() checks them.
export default function ContactsEditor({ contacts, onChange, addLabel = '+ Add contact' }) {
  const setContact = (i, patch) => onChange(contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <>
      {contacts.map((c, i) => (
        <fieldset key={i} className="card med-edit">
          <legend className="sr-only">Contact {i + 1}</legend>
          <label>
            Name
            <input value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} maxLength={80} placeholder="e.g. Dr. Patel" />
          </label>
          <ChipGroup options={CONTACT_ROLES} value={c.role} onChange={(role) => setContact(i, { role })} />
          <label>
            Phone
            <input type="tel" value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} maxLength={40} />
          </label>
          <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }}
            aria-label={`Remove ${c.name || `contact ${i + 1}`}`}
            onClick={() => onChange(contacts.filter((_, j) => j !== i))}>Remove contact</button>
        </fieldset>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...contacts, blankContact()])}>{addLabel}</button>
    </>
  );
}

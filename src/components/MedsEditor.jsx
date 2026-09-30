export const blankMed = () => ({ name: '', dose: '', times: ['08:00'], purpose: '', notes: '' });

// Rows of medication, dose, purpose, notes and times. Used by the care plan and by setup;
// cleanMeds() checks them.
export default function MedsEditor({ meds, onChange }) {
  const setMed = (i, patch) => onChange(meds.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <>
      {meds.map((m, i) => (
        <fieldset key={i} className="card med-edit">
          <legend className="sr-only">Medication {i + 1}</legend>
          <label>
            Medication
            <input value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} placeholder="e.g. Keppra" maxLength={60} />
          </label>
          <label>
            Dose
            <input value={m.dose} onChange={(e) => setMed(i, { dose: e.target.value })} placeholder="e.g. 250 mg" maxLength={40} />
          </label>
          <label>
            What it’s for (optional)
            <input value={m.purpose || ''} onChange={(e) => setMed(i, { purpose: e.target.value })} placeholder="e.g. seizures" maxLength={80} />
          </label>
          <label>
            Notes (optional)
            <input value={m.notes || ''} onChange={(e) => setMed(i, { notes: e.target.value })} placeholder="e.g. give with food" maxLength={200} />
          </label>
          <span className="field-label">Times</span>
          {m.times.map((t, k) => (
            <div key={k} className="row">
              <input
                type="time" value={t} aria-label={`${m.name || `Medication ${i + 1}`} time ${k + 1}`} style={{ flex: 1 }}
                onChange={(e) => setMed(i, { times: m.times.map((x, j) => (j === k ? e.target.value : x)) })}
              />
              {m.times.length > 1 && (
                <button type="button" className="btn ghost small" aria-label={`Remove ${m.name || `medication ${i + 1}`} time ${k + 1}`}
                  onClick={() => setMed(i, { times: m.times.filter((_, j) => j !== k) })}>Remove</button>
              )}
            </div>
          ))}
          <div className="spread">
            <button type="button" className="btn small" aria-label={`Add a time for ${m.name || `medication ${i + 1}`}`}
              onClick={() => setMed(i, { times: [...m.times, ''] })}>+ Time</button>
            <button type="button" className="btn ghost small" aria-label={`Remove ${m.name || `medication ${i + 1}`}`}
              onClick={() => onChange(meds.filter((_, j) => j !== i))}>
              Remove medication
            </button>
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...meds, blankMed()])}>+ Add medication</button>
    </>
  );
}

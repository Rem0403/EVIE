// What EVIE keeps, where, who sees it, and how to remove it. Every statement here describes the
// code as it is (see docs/DECISIONS.md); change this page in the same change as the behavior.
export default function Privacy({ onBack }) {
  return (
    <section className="stack privacy">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <h1>Privacy</h1>
      <p className="muted">EVIE holds health information about someone who may not be able to speak for themselves. This is how it’s handled.</p>

      <h2>What EVIE keeps</h2>
      <ul>
        <li>The names you type: yours, and the first name of the person the circle is for.</li>
        <li>The care plan: seizure plan, allergies, diagnoses, medications, contacts, routines and documents’ names.</li>
        <li>Logs: seizures, medications, sleep, behavior, goals, notes and handoffs, with who logged them and when.</li>
        <li>The caregiver schedule and the family’s list of support programs.</li>
        <li>If you choose Continue with Google, your Google email address, to recognise you on another phone.</li>
      </ul>

      <h2>Where it’s kept</h2>
      <ul>
        <li>Circle information is stored in Google Firebase, sent over encrypted connections, and encrypted by Google where it’s stored.</li>
        <li><strong>Videos, photos and files never leave the phone that added them</strong>, unless you share them yourself. Others see only that they exist and whose phone has them.</li>
        <li>Each phone keeps a copy of the circle so EVIE works without a signal.</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>Everyone in the circle can see everything in it. Anyone with the join code can join, so share it only with people who care for them.</li>
        <li>There are no passwords: anyone holding an unlocked phone that’s in the circle can see it. Keep your phone locked.</li>
        <li>EVIE has no ads, no tracking or analytics, and doesn’t sell or share information with anyone.</li>
        <li>To block automated abuse, EVIE may use Google reCAPTCHA, which Google provides under its own privacy policy.</li>
      </ul>

      <h2>Removing information</h2>
      <ul>
        <li>You can delete any entry you logged.</li>
        <li><strong>Leave this circle</strong> (in More) takes you out and clears this phone’s copy, including the videos, photos and files kept only here.</li>
        <li>Whoever started the circle can remove people, and can <strong>delete the circle for everyone</strong> (in People). That removes all its information from EVIE’s database straight away. A copy already on someone’s phone stays there until they tap <strong>Clear EVIE data from this phone</strong> on the welcome screen.</li>
      </ul>

      <h2>Please don’t add</h2>
      <p>Social Security, Medicaid, Medicare or insurance numbers. EVIE refuses text that looks like one, because everyone in the circle can read it.</p>

      <p className="muted small">
        EVIE is not an emergency service and doesn’t give medical advice. Questions: open an issue at{' '}
        <a href="https://github.com/Rem0403/EVIE/issues" target="_blank" rel="noopener noreferrer">github.com/Rem0403/EVIE</a>.
      </p>
    </section>
  );
}

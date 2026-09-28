# EVIE decision log

Settled choices and why. Reopen one only with new evidence, and record the change here.
**Final** = don't revisit without a strong reason. **Revisitable** = expected to change when the stated trigger happens.

## Platform

**Firebase (anonymous Auth + Cloud Firestore) as the backend.** Final. 2026-09-26.
- **Why:** It's free on the Spark plan, has an offline cache and real-time sync built in, and needs no server of our own.
- **Alternatives:** Supabase, or a custom API.
- **Tradeoffs:** Authorization lives in `firestore.rules`, so every rules change needs emulator tests.

**Firebase Hosting for deployment. Docker (nginx) kept for local use and as a demo backup.** Revisitable if EVIE ever needs its own backend server. 2026-09-28.
- **Why:** EVIE is a static app. Hosting is free on Spark, gives HTTPS (needed for installing to the home screen) and a CDN, and deploys with the same tool as the rules.
- **Alternatives:** Railway (no permanent free plan, and built for servers EVIE doesn't have).
- **Tradeoffs:** None significant at this size.

**No push notifications for now.** Revisitable when a paid plan is acceptable. 2026-09-26.
- **Why:** Push needs Cloud Functions, which require the paid Blaze plan.
- **Tradeoffs:** Live updates only reach phones that have the app open.

## Identity and security

**No accounts: anonymous sign-in plus a shared join code.** Revisitable: add optional account linking (Google or email) so a new phone doesn't lose its identity. 2026-09-26.
- **Why:** A grandparent or respite worker can join in 30 seconds.
- **Alternatives:** Email or Google accounts for everyone.
- **Tradeoffs:** Clearing the browser or changing phones gives a new identity. That person loses delete rights on their old entries, and the clips stored on the old phone.

**Join codes are 8 random characters (`EVIE-XXXX-XXXX`), each stored in `joinCodes/{code}`.** Final. 2026-09-28.
- **Why:** The old 4-digit codes, and circles readable by anyone, let a stranger list every circle.
- **How it works:** A code can be fetched by its exact value but never listed. Joining must prove the circle's current code in the same batch. Old circles upgrade automatically.
- **Tradeoffs:** Longer codes to type.

**Firestore rules are the authorization boundary.** Final. 2026-09-28.
- **Rules:** `createdBy` must equal the signed-in user and can't change later. Members can't remove each other. Every rules change adds emulator tests in `test/firestore.rules.test.js`.

**No ID numbers in EVIE.** Final. 2026-09-28.
- **Why:** There are no passwords, so anyone in the circle, or holding one of its phones, can read everything.
- **How it works:** `src/lib/privacy.js` refuses text that looks like a Social Security, Medicaid, Medicare or insurance number in the care plan, schedule, resources and quick-log notes. It skips seizure notes so saving a seizure is never blocked.
- **Tradeoffs:** Pattern matching can't catch every format, and a phone number written without dashes next to "Medicaid" is refused, with a message saying to add dashes.

**Video and photos stay on the phone that recorded them (IndexedDB).** Revisitable: optional shared storage if families ask for it. 2026-09-26.
- **Why:** Privacy, and Cloud Storage needs the Blaze plan.
- **Tradeoffs:** Only that phone can play the clip. **Share clip** sends it to a doctor.

## Data

**Entries load as a 200-day window, not the newest 500.** Revisitable: add "load older" paging if families need more history or read quotas get tight. 2026-09-28.
- **Why:** The 500 cap could silently undercount a 90-day summary. 200 days covers 90 days plus the previous 90 used for comparison.
- **Tradeoffs:** About 1,000 reads each time a busy family opens the app, and the timeline stops at 200 days.

**The care plan (`profile`) and schedule (`meds`) live on the circle doc, and any member can edit them.** Revisitable if roles become necessary. 2026-09-28.
- **Tradeoffs:** Two people editing at once. The form warns before replacing a plan someone else saved.

**A scheduled dose is a med entry with `slot: 'HH:MM'`.** Final. 2026-09-28.
- **How it works:** A dose counts for a slot if it's the exact slot, or the same medication within 3 hours of it. This stops a quick-logged dose from being offered again.
- **Tradeoffs:** A dose given after midnight counts toward the next day.

**The caregiver schedule is the family's own plan, not a timesheet.** Final. 2026-09-28.
- **Why:** Medicaid personal care services must be recorded in the state's electronic visit verification (EVV) system (42 U.S.C. § 1396b(l)), so EVIE must never look like a record of hours or pay.
- **How it works:** A weekly schedule is stored on the circle (`schedule`), and the Schedule screen says this at the top. There's no clock-in, clock-out or hours total.

**Emergency info is built from the care plan and shown three ways:** as a screen, printed, and as a sheet over the seizure timer. Final. 2026-09-28.

**Handoff is an entry type (`handoff`). The newest one says who is with the person now.** Final. 2026-09-28.

**Resources are a subcollection, `circles/{id}/resources`. Any member can edit, and only http or https links are stored.** Final. 2026-09-28.

## App structure

**Plain React state, with screen switching in `App.jsx`. No router or state library.** Revisitable when screens need deep links or grow much larger. 2026-09-26.
- **Why:** The app is small, and this keeps it simple.
- **Tradeoffs:** No URL for each screen.

**Pure logic lives in `src/lib`, Firestore access in `src/data`, and UI in `screens/` and `components/`.** Final.

**jsPDF for the PDF, loaded only when someone taps Download PDF. The CSV is built by hand.** Final. 2026-09-27.

**A hand-written service worker, with no PWA plugin.** Revisitable if offline caching needs to go further. 2026-09-27.
- **Tradeoffs:** Offline works from the second launch, not the first.

## Product and content

**EVIE is built for caregivers, not the patient.** Final. 2026-09-28.
- **Why:** This is the difference from Epsy: shared doses, handoffs, autism behavior logs.

**Extend EVIE rather than pivot, after a parent interview (the Support layer).** Revisitable after 5–10 more interviews. 2026-09-28.

**Medical and program content only states what its cited sources say.** Final. 2026-09-28.
- **Rules:**
  - Seizure information comes from Wikipedia's Epilepsy article.
  - Conditions come from Wikipedia's Epilepsy and Autism articles and its list of neurological conditions.
  - Support programs come from official sources.
  - Disclaimers are shown with the content.
- **Deliberate omissions:**
  - SUDEP isn't shown in the interface.
  - No new seizure types without a clinician's review.

**UI follows Yoo et al. 2020 (usability study of an epilepsy app).** Final. 2026-09-27.
- **Rules:** Main tasks are one tap from home. Detailed seizure entry is guided, one question at a time. Visuals stay calm.

## Process

**Testing: Vitest and Testing Library for units and components, the emulator for rules, and GitHub Actions running both on every push.** Final. 2026-09-28.

**No deploy, push or merge without explicit approval. Rules and app deploy together.** Final. 2026-09-28.

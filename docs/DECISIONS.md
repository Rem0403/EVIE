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
- **Caching (2026-09-29):** `firebase.json` sends `no-cache` for pages and `sw.js`, and a one-year immutable cache for hashed `/assets/`. Firebase's default one-hour cache kept phones on an old version after a deploy.

**Sliding tabs (`components/Tabs.jsx`), adapted from beui.dev's tabs in plain CSS, with no motion, lucide or Tailwind.** Final. 2026-09-29.
- **Why:** The Care summary's date range and Support's two sections are views of one screen, so they should read as tabs rather than filters. The component follows the ARIA tabs pattern: arrow keys, Home and End, and each tab linked to its panel.
- **Tradeoffs:** The highlight slides in 200ms with an even ease-in-out (the app's shared ease made it look like a jump), with no spring and no overflow arrows, and it's off under reduce motion. The bottom nav's highlight circle uses the same slide between Home and Care summary, and fades out on other screens. Appearance mode (System / Light / Dark) uses the same control with `radio`, so screen readers hear a choice rather than tabs. Form choices and the timeline filters stay as chips, because they can pick several or filter a list.

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

**Palette: epilepsy purple + autism gold.** Final. 2026-09-28.
- **Why:** Purple is the epilepsy awareness color (Purple Day). Gold ("Au") is the autism color many autistic advocates prefer.
- **Alternatives:** The red/yellow/blue/green "autism color palette". It matches the 1999 puzzle-piece awareness ribbon, which Wikipedia notes "is controversial among autism advocates and rejected by many".
- **Tradeoffs:** Gold is less widely recognized by the general public than the puzzle ribbon.

**Seizure drafts are kept in localStorage, with a 12-hour expiry.** Final. 2026-09-28.
- **Why:** sessionStorage is lost when a phone closes the app, which often happens while the camera is open to film a seizure.
- **What's kept:** the timer and every answer given after Stop.

**The bottom nav is on every screen except the seizure timer. The theme can be System, Light or Dark.** Final. 2026-09-28.
- **How it works:** the theme choice is stored per phone and applied before the first paint.

**Soothing color palettes as a per-phone setting.** Final. 2026-09-28.
- **Options:** Lavender (the default), Soft blue, Sage, Soft pink and Earth, each in light and dark.
- **What changes:** only neutral surfaces, links, the hero card and the nav.
- **What never changes:** meaning colors, meaning seizure purple, emergency red, gold, and the entry types.
- **How it's built:** the palette CSS is generated from the contrast-checked values.

**Smooth scrolling for in-app jumps only, using the browser's own smooth scroll.** Final. 2026-09-28.
- **Where it applies:** a stat tile down to the timeline, and Home back to the top. Off under reduce motion.
- **Why not Lenis:** it takes over wheel scrolling (about 1.2s), does nothing on phones, needs two packages, and can trigger motion sickness.
- **Tradeoffs:** the glide takes roughly 300–500ms, a documented exception to the 200ms animation rule, allowed because it only follows the person's own tap.

**Attachments stay on the phone that added them, like clips.** Final. 2026-09-29.
- **How it works:** notes hold several files, and the care plan has a Documents list. Firestore stores only the name, type, size and whose phone has each file.
- **What was left out:** the reference component's simulated upload progress (nothing is uploaded), its audio and link attachments, and its spinner and spring animations.
- **Tradeoffs:** other caregivers see the list and ask the owner to share the file.

**Lexend is the only UI font, bundled with the app.** Final. 2026-09-29.
- **Why:** Guidance for autism, dyslexia and photosensitive epilepsy favors clean sans-serifs with consistent strokes and no crowding. Lexend was designed for that.
- **How it's bundled:** served by EVIE itself under the SIL Open Font License (`src/assets/fonts/Lexend-OFL.txt`), falling back to Verdana, then Arial.
- **Also changed:**
  - No serifs, italics or negative tracking.
  - Line height 1.5.
  - No small all-caps.
  - The timer uses fixed-width Verdana/Arial digits.
- **Alternatives:** Verdana/Arial only (no download, but Android has neither and falls back to Roboto), and the old system fonts plus serif titles.

## Process

**Testing: Vitest and Testing Library for units and components, the emulator for rules, and GitHub Actions running both on every push.** Final. 2026-09-28.

**No deploy, push or merge without explicit approval. Rules and app deploy together.** Final. 2026-09-28.

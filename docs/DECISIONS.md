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

**No accounts required: anonymous sign-in plus a shared join code, with optional Google sign-in.** 2026-09-26, Google added 2026-09-30.
- **Why:** A grandparent or respite worker can join in 30 seconds. Reviewer feedback and the new-phone problem made Google worth adding, but only as an option.
- **How Google works:** it is *linked* to the phone's anonymous account (`linkWithPopup`), so the uid doesn't change and the rules, `createdBy` and memberships all stay the same. On another phone, signing in with the same Google account switches to that identity (after a warning if this phone is in a circle) and opens the newest circle it belongs to. That lookup is a `memberIds array-contains uid` query, which the existing read rule allows only for your own uid (emulator test added). No rules change.
- **Alternatives:** Email or Google accounts for everyone; email-link sign-in (more setup, more steps for the person).
- **Tradeoffs:** Without Google, clearing the browser or changing phones still gives a new identity. Clips stay on the phone that recorded them either way. Popup sign-in needs pop-ups allowed.

**"Try a demo" makes a real, throwaway circle.** Revisitable if demo circles pile up. 2026-09-30.
- **Why:** Reuses the real app and the existing demo week, so what people try is exactly what they'd use. A fake offline mode would need a second data layer.
- **Tradeoffs:** Each demo leaves a small circle (about 40 entries) in Firestore after **End demo**. Members can't delete circles under the rules; add a cleanup if storage ever matters.

**Goals are their own collection (`circles/{id}/goals`), practice is a `goal` entry.** 2026-09-30.
- **Why:** Tester feedback: families working on speech and other skills need goals apart from general notes, often several at once. One doc per goal (like Support resources) means two caregivers editing different goals can't overwrite each other, which an array on the circle would allow. Practice as an entry puts it on the shared timeline, in handoffs, the CSV and the summary with no new sync code.
- **How it works:** Any member can add, edit or remove a goal; `createdBy` is set once, like resources (rules + emulator tests). Each entry stores `goalTitle` as well as `goalId`, so practice still reads correctly after a goal is renamed or removed. Results are *on their own*, *with help* or *not yet*.
- **Tradeoffs:** Goals load with the circle (no paging); fine for the handful a family works on.

**A Getting started checklist instead of a tutorial.** Revisitable if testers still find home confusing. 2026-09-30.
- **Why:** Tester feedback said home was cluttered for a first-time user. A tour of coach marks breaks whenever the layout changes and is usually skipped. The checklist replaces the empty cards on a new circle (the medication prompt, and the handoff card until there's something to hand off; the Seizures and Sleep tiles always stay, at Remy's request), and each step opens the place to do it. Steps tick off from the circle's own data, so a later member sees what's already done.
- **Tradeoffs:** "Hide" is remembered per phone, not per person.

**Setup asks for the care team and medications, and writes the circle only at the end.** 2026-09-30.
- **Why:** Tester feedback: creating a circle was too bare. The care team becomes the care plan's contacts (they need a phone, since they make up the emergency info), and medications become the daily schedule, using the same editors and validation as the care plan, including the ID-number guard. Writing once at the end means leaving halfway doesn't leave an empty circle.
- **Tradeoffs:** Setup doesn't invite the people it lists; the invite code is shown straight after.

**Security review, 2026-09-30 (Microsoft SDL).** Findings and what was done:
- **Stored XSS through a resource link (high):** React 18 renders `javascript:` links. Fixed in both places: the rules accept only `http(s)` links, and Support rebuilds every link (`safeUrl`, `mailtoHref`, `telHref`) before showing it.
- **Entries can't be rewritten:** after creation, only the clip and photo status fields can change (attaching media, from any member's phone). The author's name must match their member record, except in circles from before member records existed. Every collection has a field allow-list, types and size limits.
- **Leaving and signing out clear the phone:** Firestore's offline copy, the media kept only on this phone and EVIE's saved settings (not appearance), after syncing. It is never done automatically on an error: a misconfigured App Check also returns "permission denied", and wiping then would destroy unsynced logs and phone-only videos. A removed member lands on the welcome screen, which offers **Clear EVIE data from this phone**.
- **Deleting a circle:** whoever started it deletes everything in batches of 400, then the circle last (the rules check membership against it). That person can therefore delete others' entries too; they're the family's data owner.
- **Headers:** enforced now; the CSP is report-only until it's been checked in a phone's browser console with Google sign-in, App Check and sync, then it moves to `Content-Security-Policy`. `Cross-Origin-Opener-Policy` is `same-origin-allow-popups` because `same-origin` breaks Google's sign-in pop-up.
- **CodeQL runs through GitHub's Default setup,** not `.github/workflows/codeql.yml` (removed 2026-09-30): with Default setup on, GitHub rejects results from a workflow file, which failed every run. Default setup is maintained by GitHub and needs no pinned versions; set its query suite to Extended.
- **Tests blank the Firebase config** (`vite.config.js` `test.env`): a test that loaded the real Firebase passed locally, using `.env.local`, and failed in CI.
- **Not done in code (console work):** turning on App Check enforcement, restricting the API key, a usage budget alert, and GitHub secret scanning. An optional app lock (PIN) is a possible later feature.

**Exit syncs, then shows a closing screen.** 2026-09-30.
- **Why:** Browsers only let a page close itself in a few installed-app cases. Firestore already keeps unsynced writes on the phone, so exit only needs to flush them (`waitForPendingWrites`, up to 8 seconds) and say whether they reached the server.

**Join codes are the person's first name plus 8 random characters (`MAYA-XXXX-XXXX`), each stored in `joinCodes/{code}`.** Final. 2026-09-28, name prefix 2026-09-30.
- **Why:** The old 4-digit codes, and circles readable by anyone, let a stranger list every circle.
- **How it works:** A code can be fetched by its exact value but never listed. Joining must prove the circle's current code in the same batch. Old circles upgrade automatically.
- **Name prefix (2026-09-30):** Replaced the fixed `EVIE-` so a code is easy to type and says whose circle it is. The name adds no security (it's guessable), so the random part stays 8 characters. The name is the first word of the person's name in plain capitals (accents dropped, up to 10 letters); `EVIE` if it has no Latin letters. Older `EVIE-` codes still work, and typing just the 8 random characters assumes `EVIE`.
- **Tradeoffs:** Longer codes to type. A code shows the person's first name, which anyone who has the code can already see in the circle.

**Firestore rules are the authorization boundary.** Final. 2026-09-28.
- **Rules:** `createdBy` must equal the signed-in user and can't change later. Only whoever started a circle (the first in `memberIds`) can remove people, one at a time and with a new join code in the same write; anyone can leave. Every rules change adds emulator tests in `test/firestore.rules.test.js`.
- **Changed 2026-09-30 (security review):** members used to be unremovable and "Leave" only forgot the circle on the phone, so access could never be revoked. There are still no admin roles: whoever started the circle is the one person who can remove others, and if they leave, the next member takes over.

**No ID numbers in EVIE.** Final. 2026-09-28.
- **Why:** There are no passwords, so anyone in the circle, or holding one of its phones, can read everything.
- **How it works:** `src/lib/privacy.js` refuses text that looks like a Social Security, Medicaid, Medicare or insurance number in the care plan, schedule, resources and quick-log notes. It skips seizure notes so saving a seizure is never blocked.
- **Tradeoffs:** Pattern matching can't catch every format, and a phone number written without dashes next to "Medicaid" is refused, with a message saying to add dashes.

**Video and photos stay on the phone that recorded them (IndexedDB).** Revisitable: optional shared storage if families ask for it. 2026-09-26.
- **Why:** Privacy, and Cloud Storage needs the Blaze plan.
- **Tradeoffs:** Only that phone can play the clip. **Share clip** sends it to a doctor.

## Data

**Entries load as a time window that starts at 30 days and widens on demand.** 2026-09-28, window changed 2026-09-30.
- **Why:** A count cap (the newest 500) could silently undercount a summary. The fixed 200-day window cost about 1,000 reads per app open, so about 50 opens a day would use up the free plan's 50,000 reads for everyone.
- **How it works:** The timeline opens on 30 days; **Show older entries** steps to 90, 180, 365 and 730. A summary of N days asks for 2N + 30 days, because its comparison with the previous period only counts once there's an entry older than that period. It waits for the server's answer (not the phone's cache, which may only hold the narrower window) before showing numbers or allowing export.
- **Tradeoffs:** A handoff, or a goal's last practice, older than the window doesn't show until older entries are loaded.

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
- **Tradeoffs:** The highlight slides (now 400ms, `--dur-slide`) with an even ease-in-out (the app's shared ease made it look like a jump), with no spring and no overflow arrows, and it's off under reduce motion. The bottom nav's highlight circle uses the same slide between Home and Care summary, and fades out on other screens. Appearance mode (System / Light / Dark) uses the same control with `radio`, so screen readers hear a choice rather than tabs. Form choices and the timeline filters stay as chips, because they can pick several or filter a list.

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
- **Tradeoffs:** the glide takes roughly 300–500ms and only follows the person's own tap.
- **Revisited 2026-09-30:** Remy asked for beui.dev's Lenis scroll component so the timeline's "time sections" feel smooth, and for slower, more noticeable animations. The reasons above still hold (and by default it only smooths mouse wheels, not phones), so instead: timeline days glide in as they scroll into view using CSS scroll-driven animations (`animation-timeline: view()`, no script; browsers without it just show the days), each day's heading stays pinned, and animation times went from 180–200ms to 140ms press / 320ms change / 400ms slide. The 200ms cap is retired; everything stays off under reduce motion.

**Loading animation: beui.dev's "dots", rebuilt in CSS (`components/Loader.jsx`).** 2026-09-30.
- **Why dots:** of its 17 designs, dither, dot-matrix, scramble, the five ASCII frame sets and percent flicker (rapid brightness or glyph changes), which an epilepsy app must never show; metaballs, helix, morph, newton and comet are busy; bars reads as an audio meter; a constant spinner is what motion-sensitive people like least. Dots is calm and instantly read as "working".
- **Changes from the original:** no opacity pulse (movement only), a 1.4s cycle, still dots under reduce motion (the original pulses instead; a looping animation under the global duration override would also jitter), always a visible label, and no Motion library.
- **Where:** the first paint (static markup in `index.html`, so the page is never blank while the app loads), app start, clearing the phone, deleting a circle, exiting, People and the care summary's history. The timeline keeps its skeleton cards, which hold the layout.

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

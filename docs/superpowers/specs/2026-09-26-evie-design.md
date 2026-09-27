# EVIE — Shared Care Timeline: Design Spec

**Date:** 2026-09-26
**Event:** Nexus Technology Cup (college track) — due in a few days
**Author:** Remy Jacob

## 1. Purpose

Families caring for someone with complex conditions (inspired by a sister with autism + epilepsy) scatter critical information across group texts, paper notes, and camera rolls. EVIE gives the whole care circle **one shared, real-time timeline**, with fast seizure logging (timer + video clip) and a **doctor-ready summary** that surfaces patterns.

**Success criteria**
- A reliable 3–5 minute live demo on a phone-sized screen.
- Two devices join the same care circle and see each other's entries appear live.
- A seizure can be logged (timed, typed, clip attached) in under 30 seconds.
- The Summary screen shows accurate stats and at least one data-backed pattern callout on the seeded demo data.

**Non-goals (YAGNI):** push notifications, multiple patients per circle, roles/permissions, editing entries (delete + re-log instead), AI summaries (stretch only), native apps, production-grade security.

## 2. Stack

- React + Vite, plain CSS, mobile-first (max content width ~480px)
- Firebase: Anonymous Auth, Firestore (with offline persistence), Storage (video clips), Hosting
  - Note: new projects need the Blaze (pay-as-you-go) plan to enable Cloud Storage. Demo usage stays within the free allowance.
- Vitest for unit tests

## 3. Architecture

```
src/
  firebase.js          init app, anonymous auth, export db + storage
  data/
    circles.js         createCircle, joinCircleByCode, getCircle, code generator
    entries.js         addEntry, deleteEntry, subscribeEntries(circleId, cb)
    clips.js           uploadClip(circleId, entryId, file, onProgress) -> url
    summary.js         PURE functions: stats, dayStrip, patterns (no Firebase)
    seed.js            loadDemoWeek(circleId) — dev/demo only
  screens/
    Welcome.jsx        create or join circle
    Timeline.jsx       home feed
    LogSeizure.jsx     timer -> details form -> save
    QuickLog.jsx       med / sleep / behavior / note sheets
    EntryDetail.jsx    full entry + video player + delete
    Summary.jsx        doctor summary + print
  components/          EntryCard, FilterChips, BottomBar, ErrorBoundary, OfflineBanner
  App.jsx              screen switching via React state (no router)
```

The `circleId` and the user's display name are stored in `localStorage` so the user stays in the circle across refreshes. Wrap every localStorage access in try/catch.

## 4. Data Model (Firestore)

```
circles/{circleId}
  name: string                 e.g. "Evie's Care Circle"
  personName: string           e.g. "Evie"
  joinCode: string             format "EVIE-####"
  memberIds: string[]          uids
  createdAt: timestamp

circles/{circleId}/members/{uid}
  displayName: string
  joinedAt: timestamp

circles/{circleId}/entries/{entryId}
  type: "seizure" | "med" | "sleep" | "behavior" | "note"
  occurredAt: timestamp
  createdBy: uid
  createdByName: string
  note?: string
  photoUrl?: string            (note only)

  // seizure
  durationSec: number
  seizureType: "tonic-clonic" | "focal" | "absence" | "atonic" | "unknown"
  triggers: string[]           subset of "poor_sleep" | "missed_med" | "illness" | "overstimulation" | "other"
  rescueMedGiven: boolean
  clipUrl?: string
  clipStatus?: "none" | "uploading" | "done" | "failed"

  // med
  medName: string
  dose: string
  status: "given" | "missed" | "rescue"

  // sleep  (occurredAt = wakeTime)
  bedtime: timestamp
  wakeTime: timestamp
  quality: 1 | 2 | 3           (poor / ok / good)

  // behavior
  kind: "meltdown" | "shutdown" | "good_day" | "other"
```

**Join codes:** `EVIE-` + 4 random digits. When a circle is created, the app regenerates the code if it collides with an existing one. To join, the app queries `circles where joinCode == code`, adds the uid to `memberIds` with `arrayUnion`, and writes the member doc.

**Storage path:** `clips/{circleId}/{entryId}` (keeps the original file extension). Accepts `video/*`, rejects files over 50MB on the client before upload.

**Security rules (demo-grade):**
- Must be authenticated for everything.
- `circles/{id}`: any authed user may read (needed for join-by-code lookup); create allowed; update allowed only when the change adds the caller's own uid to `memberIds` or the caller is already a member.
- `members` and `entries` subcollections: read/write only if `request.auth.uid in get(circle).memberIds`.
- Storage `clips/{circleId}/**`: read/write for authed users; size < 50MB, contentType `video/.*`.

## 5. Screens & Flows

### Welcome
- Two buttons: **Start a care circle** / **Join with a code**.
- Start: your name + person's name → circle created → big join code shown with copy/share (`navigator.share` when available, clipboard fallback) → Continue to timeline.
- Join: code + your name → timeline. Invalid code: "No circle found with that code." The input keeps its value.

### Timeline (home)
- Header: person's name, tappable circle code (share).
- Filter chips: All · Seizures · Meds · Sleep · Behavior · Notes.
- Entries grouped by day ("Today", "Yesterday", "Tue Sep 22"), newest first, live via `onSnapshot` ordered by `occurredAt desc`.
- Card: colored type icon, time, one-line summary (e.g., "Tonic-clonic · 1m 42s · 🎥"), "logged by Mom". Clip failures show "Clip failed — tap to retry".
- Fixed bottom bar: big red **Seizure** button + **+ Log** (opens a chooser: Med / Sleep / Behavior / Note).
- Tap card → Entry detail.

### Log Seizure (the most polished flow)
1. Tapping **Seizure** starts the timer immediately. Elapsed time = `now - startTs`, so the timer stays accurate if the screen locks.
2. Big **Stop** button. There's also "Started earlier?" to subtract 15s/30s/1m from the start.
3. Details form after stop: seizure type (default "unknown"), rescue med given (toggle), trigger chips, note, **Attach clip** (`<input type="file" accept="video/*" capture="environment">`).
4. **Save** writes the entry right away with `clipStatus: "uploading"` if a clip is attached, then uploads with a progress bar and updates `clipUrl` + `clipStatus`. On failure: `clipStatus: "failed"` with a retry option. The entry is never lost because of a clip.
5. Cancel while timing asks for confirmation ("Discard this seizure?").

### Quick Log sheets
- **Med:** med name (remembers last used), dose, status given/missed/rescue, time defaults to now.
- **Sleep:** bedtime + wake time (defaults: last night 21:00 → today 07:00), quality poor/ok/good.
- **Behavior:** kind chips, optional note.
- **Note:** text + optional photo (Storage `photos/{circleId}/{entryId}`).
- Every sheet: target 2–3 taps to save.

### Entry Detail
- All fields, inline `<video controls>` for clips, "logged by X at time".
- Delete (only shown to the creator), with confirmation.

### Summary (doctor view)
- Range toggle: 7 / 30 / 90 days.
- Stats: seizure count, average + longest duration, rescue-med uses, type breakdown.
- **Day strip:** one row per day with markers for seizures, missed meds, and a sleep quality dot.
- **Pattern callouts** (from `summary.js`, only shown when supported, see §6).
- Recent seizures list with clip links.
- **Print / Save PDF** via `window.print()` and a `@media print` stylesheet (hides nav, black-on-white, fits on one page).

## 6. Summary Logic (`summary.js`, pure & unit-tested)

Input: array of entries + range `[start, end]`. Output: plain objects.

- `seizureStats(entries)` → `{ count, avgDurationSec, maxDurationSec, rescueCount, byType }`
- `dayStrip(entries, start, end)` → `[{ date, seizures, missedMeds, sleepQuality|null }]`
- `patterns(entries, start, end)` → list of `{ id, text, matched, total }`. Only seizures inside the range count, but context entries (sleep, meds) before the range start are still considered. Each pattern appears only if `matched >= 2` **and** `matched / total >= 0.5`:
  - **Poor sleep:** a seizure where the most recent sleep entry whose `wakeTime` falls within the 18h before the seizure has duration < 6h **or** quality 1. Text: "3 of 4 seizures followed a night under 6h sleep or poor sleep."
  - **Missed med:** a seizure with a `med` entry `status: "missed"` within the 24h before it. Text: "2 of 4 seizures came within 24h of a missed dose."
  - **Time of day:** bucket seizures into Night (0–6), Morning (6–12), Afternoon (12–18), Evening (18–24). If the top bucket passes the threshold: "3 of 4 seizures happened in the morning (6 AM–12 PM)."
- No causal language. Callouts describe co-occurrence only ("followed", "came within"). A footer reads: "Patterns are observations from logged data, not medical advice."

## 7. Error Handling

- **Offline:** Firestore persistent cache enabled; `OfflineBanner` shows "Offline — will sync" via `navigator.onLine` events.
- **Clip upload:** see §5; oversize files rejected before upload with a message.
- **Auth failure on load:** full-screen "Can't connect — Retry".
- **Top-level ErrorBoundary:** "Something went wrong — Reload".
- **Bad join code:** inline error, input preserved.

## 8. Testing

- **Vitest unit tests** for `summary.js` (stats, day strip, each pattern incl. below-threshold and empty-data cases) and the join-code generator/validator.
- **Manual demo checklist** (in `DEMO.md`):
  1. Phone A creates circle → Phone B joins with code.
  2. Phone A logs a seizure with the stand-in clip → appears on Phone B live.
  3. Quick-log med / sleep / behavior on Phone B.
  4. Load demo week → open Summary → see pattern callouts → Print.
  5. Repeat on real phone over cellular against the Hosting URL.
- No E2E tests.

## 9. Demo Safety

- `seed.js` "Load demo week" button (visible behind a `?demo=1` URL flag): about 10 days of entries across all types, built so the poor-sleep and morning patterns trigger and the missed-med pattern is borderline.
- A pre-recorded neutral stand-in clip (not a real seizure) for the upload step.
- Deploy to Firebase Hosting (HTTPS needed for camera capture); `npm run dev` as backup.
- Screen recording of the full flow as last-resort fallback.

## 10. Stretch (only if core is done and rehearsed)

- "Explain in plain English" AI narrative over the computed summary (requires Blaze plan + Cloud Function).

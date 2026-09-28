# EVIE: project brief (context for an AI assistant)

Use this as background when helping with EVIE. It describes the project as of **2026-09-28**. The code in the repository is the source of truth. If this brief and the code disagree, trust the code and say so.

## 1. What EVIE is

EVIE is a shared care timeline for families caring for someone with **epilepsy and autism**, often a person who can't report symptoms themselves. Parents, siblings, paid caregivers and relatives join one private "care circle" with a code. Together they log seizures, medications, sleep and behavior, coordinate who is caring and when, and produce a summary a neurologist can read.

- **Author:** Remy Jacob (student). It's built for the **Nexus Technology Cup**, and inspired by caring for their sister.
- **Pitch:** "Epsy helps a person track their epilepsy. EVIE helps a family care for someone who can't track it themselves: from the seizure, to the doctor, to finding support."
- **Differentiator vs. Epsy** (a leading epilepsy app): EVIE is built for *caregivers*. It has shared doses, handoffs between caregivers, autism behavior logs, an emergency card, and a guide to support services.
- **Repo:** https://github.com/Rem0403/EVIE
- **Live site:** https://evie-1011.web.app (Firebase project `evie-1011`). Add `?demo=1` to get a "Load demo week" button.

## 2. Tech stack

| Part | Choice |
|---|---|
| Frontend | React 18 + Vite, plain CSS (tokens in `src/styles.css`, light and dark), mobile-first, max width about 480px |
| Backend | Firebase: anonymous Auth + Cloud Firestore with offline cache. Free Spark plan. No server of its own |
| Media | Clips and photos stored only on the recording phone (IndexedDB) |
| PDF | jsPDF, lazy-loaded when "Download PDF" is tapped |
| Offline / install | Hand-written service worker (`public/sw.js`) + web manifest |
| Tests | Vitest + Testing Library (205 tests); Firestore rules tests on the emulator (23 tests, `npm run test:rules`, needs Java) |
| CI | GitHub Actions (`.github/workflows/ci.yml`): unit tests, build and rules tests on every push |
| Hosting | Firebase Hosting (free). Docker + nginx is kept for local use and as a demo backup |

Commands: `npm run dev`, `npm test`, `npm run test:rules`, `npm run build`, `npx firebase deploy --only firestore:rules,hosting`.

## 3. Features (all built and tested)

**During a seizure**
- One-tap timer that survives a reload, and keeps the screen awake.
- At **5 minutes**: the timer turns red, the phone vibrates, and it says "Follow their seizure plan. If you don't have one, call emergency services now."
- An **Emergency info** sheet opens over the timer without stopping it.
- After Stop, **4 guided steps**: seizure type (large cards with plain-language summaries, plus an **i** guide adapted from Wikipedia's Epilepsy article), rescue medication yes/no, triggers, and "how are they now" (notes, clip, "happened during sleep"). Save is always visible.

**Daily care, shared**
- **Care plan** ("About {name}"): seizure plan, allergies, emergency contacts, diagnoses, communication, what helps and what to avoid, daily routine, and daily medications (dose, times, purpose, notes).
- **Emergency info:** Call 911, seizure plan, contacts with tap-to-call, allergies, diagnoses, meds. Opens from the timeline, is printable, and works offline.
- **Today's meds:** Given/Missed for each scheduled dose, showing who gave it and when. A dose logged any other way within 3 hours also counts, which prevents double doses.
- **Handoff:** a banner showing who is with the person and until when. "Take over" summarizes what happened since the last handoff.
- **Caregiver schedule:** a weekly schedule, including overnight shifts. The banner shows who is scheduled now.
- **Quick logs:** medication, sleep, notes (with a photo), and autism **behavior logs**: meltdown, shutdown, self-injury, anxious, good day, with what happened before, what helped, length and intensity.
- A live, shared timeline showing the last 200 days.

**Doctor summary** (7, 30 or 90 days)
- Stats: count, average and longest seizure, rescue uses, seizures of 5 minutes or more, clusters, during sleep, scheduled doses given.
- Comparison with the previous period, and seizure-free days.
- Triggers, a behavior section, a day-by-day strip and the seizure list.
- **Pattern callouts**: poor sleep, missed dose, time of day, and **meltdown/shutdown/self-injury/anxious in the 24h before or after seizures**. The callouts state what was logged, never causes.
- **Download PDF**, **CSV** and **Print**.

**Support** (from parent interviews)
- A shared list of the family's programs and groups: status, contacts, a dated next step, notes. Follow-ups that are due show on the timeline.
- A **Start here** guide by stage (just diagnosed, school years, turning 18, friends and support). Every claim was checked against official sources (federal law, medicaid.gov, KFF, SSA rules, the Parent Center Hub, 211, and others). Each item can be saved to the family's list.

## 4. Code layout

```
src/App.jsx        sign-in, circle session, live subscriptions, screen switching (no router)
src/screens/       Welcome, Timeline, LogSeizure, QuickLog, EntryDetail, Summary, CarePlan,
                   Emergency, Schedule, Support, ResourceForm
src/components/    EntryCard, BottomBar, ChipGroup, Media, SeizureInfo, EmergencyInfo, TodayMeds,
                   Handoff, FollowUps, Icon, OfflineBanner, ErrorBoundary
src/data/          Firestore access only: circles, entries, resources, clips
src/lib/           pure, tested logic: format (option lists and labels), summary (stats and patterns),
                   meds, careplan, schedule, handoff, resources, supportGuide, seizureInfo, privacy,
                   codes, export (CSV and PDF), demoWeek, validate
firestore.rules    the authorization boundary
test/              rules tests (emulator)
docs/              DECISIONS.md, brand-guidelines.md, specs in docs/superpowers/specs/, this brief
DEMO.md            5-minute stage script, checklist, smoke test
```

## 5. Data model (Firestore)

- `circles/{id}`:
  - `name`, `personName`, `joinCode`, `memberIds[]`, `createdAt`
  - `profile{diagnoses[], diagnosisOther, communication, helps, avoid, allergies, rescuePlan, routine, contacts[{name, role, phone}]}`
  - `meds[{name, dose, times['HH:MM'], purpose, notes}]`
  - `schedule[{name, days[0-6], start, end, note}]`
- `circles/{id}/members/{uid}`: `displayName`, `joinCode` (proves the code when joining).
- `circles/{id}/entries/{id}`:
  - Common fields: `type` (seizure, med, sleep, behavior, note, handoff), `occurredAt`, `createdBy`, `createdByName`, `note`.
  - Plus fields for each type, such as `durationSec`, `seizureType`, `triggers[]`, `rescueMedGiven`, `duringSleep`, `status`, `slot`, `before[]`, `helped[]`, `until`.
- `circles/{id}/resources/{id}`: `name`, `category`, `status`, `phone`, `url`, `email`, `nextStep`, `nextDate` (YYYY-MM-DD), `note`, `createdBy`…
- `joinCodes/{EVIE-XXXX-XXXX}`: `{circleId}`. Can be fetched by exact value but never listed.

## 6. Security model

- Anonymous sign-in, plus an 8-character random join code (about 850 billion possibilities).
- Only members can read a circle. Circles can't be listed.
- Joining must prove the circle's current code. Members can't remove each other.
- `createdBy` must equal the signed-in user and can never change. Only the author can delete an entry.
- Saved links must be http or https.
- **No ID numbers:** `src/lib/privacy.js` refuses text that looks like a Social Security, Medicaid, Medicare or insurance number. There are no passwords, so anyone in the circle can read everything.

## 7. Standing rules for any work on EVIE

1. **Never deploy, push, merge or create branches without Remy's explicit instruction.** Rules and app deploy together.
2. **Verify in the code before claiming something is done.** Run `npm test` and `npm run build`, plus `npm run test:rules` for any rules change. Report failures honestly.
3. **Firestore rules are the security boundary.** Never rely on hiding things in the UI.
4. **Keep docs in sync:** README, DEMO.md, `docs/DECISIONS.md`, and the specs.
5. **Don't store ID numbers** (Social Security, Medicaid). Names and phone numbers of case workers are fine.
6. **The caregiver schedule is not a timesheet.** Medicaid-paid personal care must be recorded in the state's EVV system (42 U.S.C. § 1396b(l)). Never add hours or pay tracking.
7. **Medical and program content must only state what cited sources say.** It carries disclaimers. Patterns describe what was logged, not causes. SUDEP stays out of the UI, and no new seizure types go in without a clinician's review.
8. **UI follows Yoo et al. 2020** (usability study of an epilepsy app): main tasks one tap from home, guided detailed entry, calm visuals. The look is the softened color-block style in `docs/brand-guidelines.md`.
9. **Keep the stack:** plain CSS (no Tailwind or shadcn migration), no router or state library, and no new dependency when a few lines will do.
10. **Settled decisions** are in `docs/DECISIONS.md`: Firebase over Supabase or Railway, anonymous sign-in, media kept on the device, a 200-day loading window, and more. Don't reopen them without new evidence.

## 8. Current status and open items

- **Committed and pushed:** everything up to the Support layer, CI and the decision log (commit `6b27657`).
- **Uncommitted:** emergency card, care plan details, caregiver schedule, the ID-number guard, and Easterseals in the guide. All tests pass. Needs a commit, then a deploy of rules and hosting together, because the schedule needs the new rules.
- **Not done:**
  - ESLint (deferred until after the demo)
  - a UI polish, contrast and dark-mode pass on the newest components
  - a less crowded home screen
  - account linking (so a new phone doesn't lose identity)
  - "load older" paging past 200 days
- **Research to do:** interview 5–10 more families. So far two sources, a parent and Remy's dad, pointed to services, emergency info and scheduling.

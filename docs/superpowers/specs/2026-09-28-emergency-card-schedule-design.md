# EVIE: Emergency card, care plan details and caregiver schedule

**Date:** 2026-09-28
**Author:** Remy Jacob

## Why

Feedback from a family caregiver (the author's dad): *"it could have a calendar for working days and hours, medication information and dosage, emergency phone numbers, or detailed information about the disabled person… Medicaid, Easterseals, SSI disability, and other disability organizations."*

## What was built

- **Care plan details** (`circle.profile`): `allergies`, `rescuePlan` (copied from the family's own seizure plan), `routine`, and `contacts: [{ name, role, phone }]`. Each medication gains `purpose` and `notes`.
- **Emergency card** (`EmergencyInfo`):
  - Contents: Call 911, their seizure plan, contacts with tap-to-call, allergies, diagnoses, communication, what helps and what to avoid, medications, routine.
  - Where it opens: a button at the top of the timeline, a printable screen, and a sheet over the running seizure timer (so the timer keeps going).
  - It works offline from Firestore's cache.
- **Caregiver schedule** (`circle.schedule: [{ name, days, start, end, note }]`):
  - A weekly view and an editor.
  - Overnight shifts are supported.
  - The handoff banner shows "Scheduled: X until 3:00 PM" or "Next today: …".
- **Easterseals** added to the Start here guide.

## Two constraints (both permanent)

1. **No ID numbers.** EVIE has no passwords, so anyone in the circle, or holding one of its phones, can read everything.
   - `src/lib/privacy.js` refuses text that looks like a Social Security, Medicaid, Medicare or insurance number, and explains why.
   - It applies to the care plan, the schedule, resources and quick-log notes.
   - It doesn't apply to seizure notes, so saving a seizure is never blocked.
   - Names and phone numbers of case workers are fine.
   - It works by pattern matching, so it can't catch every format.
2. **The schedule isn't a timesheet.** Medicaid personal care services must be recorded in the state's electronic visit verification system (42 U.S.C. § 1396b(l), checked 2026-09-28). The Schedule screen says so at the top (`EVV_NOTE`).

## Data and security

- Firestore rules let members update `schedule` on the circle (a new emulator test covers it). `profile` and `meds` were already allowed.
- The demo care plan now includes contacts, allergies, a seizure plan, a routine and a two-shift schedule. It uses made-up names and 555 numbers, and passes the same validation as real data.

## Out of scope

- Hours worked, clock-in and clock-out, or anything payroll-like (see constraint 2).
- A conflict warning when two people edit the schedule at the same moment (last save wins; the care plan has one).

# Guided setup, Getting started checklist and goals

2026-09-30. From tester feedback:
1. "The UI looks kinda cluttered to the point where a first user would be confused": sub-menus or a tutorial.
2. "The creation process should be more streamlined … put who's taking care of someone and medicine upon creation."
3. "There should be a goal section … autistic patients work on things like speech … general notes should be separated from goals, since you're working on multiple goals."

## 1. Getting started checklist (instead of a tutorial)
- `GettingStarted` (`src/components/GettingStarted.jsx`) sits at the top of a new circle's home. Steps come from `gettingStarted(circle, entries)` in `src/lib/home.js`:
  1. Add daily medications (done when `circle.meds` has any) → care plan
  2. Add emergency contacts and the seizure plan (contacts **and** `rescuePlan`) → care plan
  3. Invite family and caregivers (more than one member) → invite sheet
  4. Log something (any entry). No button: the text points at the Seizure button and +.
- It disappears when all four are done, or with **Hide this list** (remembered per circle on this phone in localStorage).
- While it shows, home leaves out the cards that would only say "nothing yet": the medication set-up prompt (the checklist covers it) and the handoff card (until there's an entry or a schedule). The Seizures and Sleep tiles always show.
- Not a coach-mark tour: those break when the layout changes and are usually skipped.

## 2. Guided setup
- `Setup` (`src/screens/Setup.jsx`), three steps with "Step N of 3":
  1. Your name, who the circle is for (required).
  2. Who helps care for {name}: `ContactsEditor` rows (name, role, phone). New roles: Caregiver, Therapist. A phone is required, as in the care plan, because they show on the emergency info. The page says this doesn't invite them.
  3. Daily medications: `MedsEditor` rows. The starting row (with its default 8 AM) is ignored unless something is typed.
- Skip on steps 2 and 3; Back keeps what was typed.
- Validation matches the care plan (`cleanContacts`, `cleanMeds`, `planIdError`). The circle is written once, at the end, with `profile.contacts` and `meds` (`createCircle`), then the invite code screen shows.
- `ContactsEditor` and `MedsEditor` were extracted from `CarePlan.jsx`, which now uses them too.

## 3. Goals
- Goals: `circles/{id}/goals/{goalId}` with `title`, `area`, `status` (active, paused, met), `details`, `workingWith`, `createdAt`, `createdBy`, `createdByName`, `updatedAt`, `updatedByName`. Rules: members read, add, edit and delete; `createdBy` must be the author and never changes (same as resources).
- Practice: an entry with `type: 'goal'`, `goalId`, `goalTitle` (so it reads correctly after a rename or removal), `result` (`own`, `help`, `not_yet`) and an optional note.
- Screens: More → **Goals** (`Goals.jsx`): goals being worked on first, each with the last 2 weeks of practice and **Log practice**. `GoalForm.jsx` adds, edits (including status) and removes. Log (+) → **Goal practice** opens the quick log (or the Goals list when there's no goal yet).
- Everywhere entries go: timeline card and a **Goals** filter chip, entry details, handoff summary ("2 goal practices"), CSV, and a **Goals** section in the care summary and PDF (`goalTally`: practice per goal in the range).
- Goals are family-defined. EVIE adds no clinical claims about them.
- Demo: two goals with practice across the demo week.

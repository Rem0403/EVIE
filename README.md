# EVIE: Shared Care Timeline

EVIE is one shared timeline for families caring for someone with epilepsy and autism. Parents, siblings and caregivers log seizures, medications, sleep and behavior from their phones. Everyone sees the same live record, and in two taps it becomes a summary a neurologist can read.

It was built for the Nexus Technology Cup and is inspired by my family's experience caring for my sister.

## The problem

Care information ends up scattered across group texts, paper notes and a camera roll full of seizure videos. When the neurologist asks "how many seizures this month, and what happened before them?", nobody has the whole picture.

## What EVIE does

- **One-tap seizure timer.** Tap the round **Seizure** button in the middle of the bottom bar and the timer starts at once, because in the moment you have one hand free. Afterwards, add the type, the possible triggers, whether rescue medication was given, notes and a video clip. If the page reloads or the phone closes the app mid-seizure (for example while filming), the timer and every answer so far are kept.
- **A 5-minute alert.** At 5 minutes the timer turns red, the phone vibrates and a reminder to follow the seizure plan appears. The screen stays on while the timer runs.
- **Guided seizure details.** After the timer stops, four short steps ask what it looked like, whether rescue medication was given, possible triggers, and how they are now. Every step can be skipped and Save is always on screen. Each seizure type has a one-line description, and an **i** button opens a fuller guide to seizure types, recovery and first aid, adapted from Wikipedia.
- **Quick logs.** Medication (given, missed or rescue), sleep, behavior and notes each take a few taps, with big buttons designed for stressful moments.
- **Care plan.** An "About" page for the person: their seizure plan, allergies, emergency contacts, diagnoses (the conditions most often seen alongside epilepsy and autism are listed first), how they communicate, what helps them, what to avoid, their daily routine, and the daily medications with what each is for. Everyone in the circle sees it, and the diagnoses print on the doctor summary.
- **Attachments and documents.** Notes can hold several photos, PDFs or documents (drag and drop, or tap to choose; up to 10 files, 25 MB each). The care plan has a **Documents** section for the doctor's seizure plan, letters, the IEP and test results, which also appears in Emergency info. Files stay on the phone that added it; others see the list and whose phone has each file, and can ask for it to be shared.
- **Emergency info.** One tap from the timeline, and from the seizure timer without stopping it: Call 911, their seizure plan, contacts with tap-to-call, allergies, diagnoses, how to communicate with them, and their medications. It works offline and can be printed for the fridge.
- **Caregiver schedule.** A weekly schedule of who is with them when (paid caregivers, family, respite), including overnight shifts. The handoff banner shows who is scheduled now. It's the family's own plan, not a timesheet: the app says that Medicaid-paid personal care has to be recorded in the state's electronic visit verification (EVV) system.
- **Today's meds.** Each scheduled dose appears on the timeline with **Given** and **Missed** buttons. Once a dose is logged, everyone sees who gave it and when, so caregivers don't double-dose or both skip it.
- **Handoff.** A banner shows who is with the person now and until when. **Take over** shows what happened since the last handoff (seizures, doses, meltdowns) and lets you leave a note for everyone.
- **Behavior logs built for autism.** Log a meltdown, shutdown, self-injury, anxious time or good day, and optionally what happened before (sensory, change of routine, hunger, tiredness, pain…), what helped, how long it lasted and how intense it was.
- **Support.** A shared list of the family's programs, services and groups: where things stand with each one, contact details, and a dated next step ("Call to check our place on the waiting list"). Follow-ups that are due show on the timeline. A **Start here** guide explains what to ask about at each stage (just diagnosed, school years, turning 18, friends and support), with links to official sources.
- **A shared, live timeline.** Everyone in the family "care circle" sees new entries as they're logged, grouped by day and showing who logged what. It shows the last 200 days.
- **A doctor summary.** Choose the last 7, 30 or 90 days to see:
  - seizure count, average length, longest seizure and rescue medication uses
  - seizures of 5 minutes or longer, and clusters (2 or more within 24 hours)
  - a comparison with the previous period, and the number of seizure-free days
  - how often each trigger was noted, and how many seizures happened during sleep
  - how many scheduled doses were logged as given
  - behavior counts, what most often came before a hard time, and what helped
  - whether meltdowns, shutdowns, self-injury or anxious times often came in the 24 hours before or after seizures
  - a day-by-day strip
  - pattern observations such as "3 of 4 seizures came within 24h of a missed dose"
  - the full seizure list

  It can be downloaded as a PDF or a CSV file, or printed. The patterns describe what was logged; they aren't medical advice.
- **Works offline.** Entries save on the phone and sync when the connection returns.
- **No accounts.** Anonymous sign-in plus a shared join code (for example `EVIE-7KQ4-M2XP`). Nobody has to create a login or remember a password.
- **Private video.** Clips and photos stay on the phone that recorded them, and other family members see "Clip saved on Remy's phone". **Share clip** sends a clip from that phone through its share menu, for example to the neurologist.
- **Installs like an app.** It can be added to the home screen and opens without a signal once it has been used online.
- **One tap to anywhere.** A floating bar on every screen (except the seizure timer) has Home, Care summary, the round Seizure button, Log (+) and More. More holds the care plan, schedule, support, invites and an **Appearance** setting: System, Light or Dark mode, and a choice of soothing color palettes (Lavender, Soft blue, Sage, Soft pink, Earth).
- **Calm, accessible design.** Soft neutral colors, epilepsy-awareness purple, large touch targets and text contrast that meets WCAG AA. Dark mode follows the phone's setting, and animation turns off when the phone's reduced-motion setting is on.

## Tech stack

| Part | Choice |
|---|---|
| Frontend | React 18 and Vite, with plain CSS |
| Backend | Firebase (anonymous Authentication and Cloud Firestore with an offline cache), on the free Spark plan |
| Media | IndexedDB, so clips and photos stay on the device |
| PDF | jsPDF, loaded only when a PDF is downloaded |
| Font | Lexend, bundled with the app (SIL Open Font License, see `src/assets/fonts/Lexend-OFL.txt`) |
| Tests | Vitest and Testing Library (205 tests), plus 23 security-rules tests on the Firestore emulator |
| Deployment | Docker (nginx) or Firebase Hosting |

## Getting started

### 1. Prerequisites
- Node.js 22 (the version the Docker build uses)
- A Firebase project on the free Spark plan. In the Firebase console:
  - **Authentication:** open **Sign-in method** and enable **Anonymous**.
  - **Firestore Database:** create a database in production mode.
  - **Project settings:** under **Your apps**, add a web app and copy its config values.

### 2. Configure
```bash
git clone https://github.com/Rem0403/EVIE.git
cd EVIE
npm install
cp .env.example .env.local   # then fill in the values from your Firebase web app
```

### 3. Deploy the security rules
```bash
npx firebase login
npx firebase use --add        # choose your project
npx firebase deploy --only firestore:rules
```

### 4. Run
```bash
npm run dev
```
Open http://localhost:5173. The terminal also prints a **Network** address you can open on a phone connected to the same network. Your firewall has to allow the port.

To try it with sample data, open `http://localhost:5173/?demo=1`, create a circle and tap **Load demo week**.

## Run with Docker

```bash
docker compose up -d --build    # build and start
docker compose down             # stop
```
The app is then served at http://localhost:8080. Your `.env.local` values are built into the image, so rebuild after changing them or the code.

## Deploy to Firebase Hosting (optional)

```bash
npm run build
npx firebase deploy --only hosting
```
This gives an HTTPS link that works on any phone and network.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server, reachable on your local network |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run test:rules` | Test `firestore.rules` on the Firestore emulator (needs Java). On Windows the emulator can keep running afterwards; if the next run says port 8088 is taken, end that `java` process |

## Project structure

```
src/
  App.jsx          screen routing and the sign-in and circle session
  screens/         Welcome, Timeline, LogSeizure, QuickLog, EntryDetail, Summary, CarePlan, Emergency, Schedule, Support, ResourceForm
  components/      EntryCard, BottomBar, ChipGroup, Media, SeizureInfo, EmergencyInfo, TodayMeds, Handoff, FollowUps, Icon, OfflineBanner, ErrorBoundary
  data/            Firestore access (circles, entries, resources) and on-device media
  lib/             pure logic: formatting, summary and patterns, medication schedule, care plan, caregiver schedule, handoff, ID-number guard, resources and support guide, exports (CSV and PDF), seizure guide, validation, demo data
  styles.css       design tokens (light and dark) and all styles
public/            web app manifest, icon and offline service worker
test/              security-rules tests (run with npm run test:rules)
firestore.rules    security rules: only circle members can read a circle or its entries
DEMO.md            5-minute demo script, pre-stage checklist and smoke test
docs/DECISIONS.md  settled technical and product decisions, and why
docs/brand-guidelines.md  voice, messaging and visual identity
.github/workflows/ unit tests, build and rules tests on every push (GitHub Actions)
```

## Privacy and security

- Only members of a circle can read the circle or its entries. Circles can't be listed or searched (see `firestore.rules`).
- Join codes have 8 random characters (about 850 billion possibilities), so they can't be guessed. A code can only be looked up by its exact value, and joining is refused unless it matches the circle's current code.
- Saved resources are private to the circle, and their links can only be ordinary web addresses.
- EVIE refuses to save text that looks like a Social Security, Medicaid, Medicare or insurance number, because everyone in the circle can read it. Names and phone numbers of case workers are fine.
- Members can edit the care plan and medication schedule, but can't remove other members. Each entry records who logged it, that can't be changed later, and only that person can delete it.
- Circles created before the longer codes get a new code the first time a member opens the app. The old 4-digit code then stops working for new joins.
- Videos and photos never leave the phone they were added on.
- The Firebase web config in `.env.local` is designed to be public; access is controlled by the security rules. For a public deployment, also restrict the API key to your domains in the Google Cloud console.

## Roadmap

- A plain-language monthly summary for the doctor
- Optional shared video storage for families who want it
- Medication reminders

# EVIE brand guidelines

How EVIE looks, sounds and describes itself. The app, the pitch deck, the README and any future site follow this. The tokens themselves live in `src/styles.css`, which is the single source for colors; this guide explains how to use them.

## 1. Who EVIE is for

Families caring for someone with **epilepsy and autism**, often a person who can't describe a seizure or say what's wrong. The users are the caregivers: parents, siblings, grandparents, paid caregivers and respite workers. Many are tired, some are mid-crisis when they open the app, and most were told about a diagnosis and then left to work everything out alone.

## 2. Positioning and messages

**One line:** EVIE helps a family care for someone who can't track their own epilepsy.

**Pitch:** Epsy helps a person track their epilepsy. EVIE helps a family care for someone who can't track it themselves: from the seizure, to the doctor, to finding support.

**Short description (about 25 words):** EVIE is one shared, private record for everyone caring for someone with epilepsy and autism. Log seizures, share doses and handoffs, and bring a clear summary to the doctor.

**Key messages**

| Message | Proof in the app |
|---|---|
| Everyone who cares for them sees the same thing | One care circle, live updates, "who's with them now", who gave each dose |
| It helps in the moment | One-tap seizure timer, 5-minute alert, emergency info over the timer |
| It turns logging into answers | Care summary with patterns, PDF for the neurologist |
| It understands autism, not only epilepsy | Behavior logs with what came before and what helped; behavior-before-seizure pattern |
| It points families to real help | Support list and a Start here guide checked against official sources |
| It's private | No accounts to hack, circles can't be found, video stays on the phone, no ID numbers stored |

**What we never claim:** that EVIE diagnoses, predicts or prevents seizures, that a pattern means a cause, or that it replaces a doctor, a seizure plan or official records (such as EVV timesheets).

## 3. Voice

EVIE sounds like a calm, experienced friend who has done this before.

| Trait | Means | Do | Don't |
|---|---|---|---|
| **Calm** | Steady, even in a crisis | "Stay with them, and note what you see." | "EMERGENCY!!", "Act now!" |
| **Plain** | Short everyday words; one idea per sentence | "Was rescue medication given?" | "Indicate whether pharmacological intervention occurred." |
| **Warm** | Kind, never cutesy | "Taking over? Let everyone know you're with Maya." | "Yay! 🎉 You're a super caregiver!" |
| **Honest** | Says what it knows and what it doesn't | "Patterns are observations from logged data, not medical advice." | "Poor sleep caused 3 seizures." |
| **Respectful** | Person first; neutral about disability | "Non-speaking", "self-injury", "meltdown" | "suffers from", "victim", "normal kids", "handicapped" |

**Tone by moment**

| Moment | Tone | Example |
|---|---|---|
| During a seizure | Few words, direct, steady | "5 minutes. Follow their seizure plan. If you don't have one, call emergency services now." |
| Logging | Friendly, quick, everything optional | "Anything that might have set it off?" |
| Errors | What happened, then what to do; never blame | "Couldn't save the photo on this phone. The note is saved without it." |
| Medical or program facts | Factual, sourced, with a disclaimer | "US programs. Names and rules vary by state…" |
| Empty states | Invite the next step | "Nothing saved yet. Start with the guide below…" |
| Privacy and limits | Clear and direct about why | "Please don't save ID numbers… Everyone in the circle can see them." |

**Writing rules**
- Sentence case for every title, button and label ("Care plan", not "Care Plan").
- Buttons say what happens: "Save seizure", "Take over", "Start seizure".
- No exclamation marks, no emoji in the interface, no ALL CAPS except the join code.
- Address the caregiver as "you" and the person as "they/them" or by name.
- Mark optional fields "(optional)"; never make a stressed person guess.
- Times as "8:00 AM", durations as "1m 20s", dates as "Sep 28".

**Word list**

| Use | Instead of |
|---|---|
| care circle | group, account, team |
| caregiver | user, carer |
| seizure plan | protocol, action plan (unless quoting a doctor) |
| rescue medication | emergency drug |
| medication (label), med (only on tight chips) | drug, pill |
| care summary | report, export, doctor report |
| handoff, take over | shift change, check in |
| support, resources | services directory |
| non-speaking, uses AAC | non-verbal, mute |

## 4. Visual identity

**Style.** Color-block cards with big serif headings, outlined pill chips and one bright call-to-action pill, based on a mental-health app concept on Dribbble (shared by Remy on 2026-09-28). Dark mode follows that reference (near-black page); light mode uses the same blocks on an off-white page. Colors are **softened** about 15–20% from the reference to stay calm for tired caregivers and people sensitive to strong visuals. We copy the pattern only, never the reference's illustrations, mascot or content.

**Color: purple + gold.** Purple is the epilepsy awareness color (Purple Day, March 26), so it marks seizures and the Start seizure button. Gold ("Au") is the autism color that many autistic advocates prefer; EVIE uses it for accents. We deliberately avoid the red/yellow/blue/green puzzle-ribbon colors and any puzzle-piece imagery, which many autistic people reject. All values are tokens in `src/styles.css`. Every text color is at least 4.5:1 (WCAG AA) on what it sits on, in both themes, and text on a color block is always full white or near-black.

| Role | Token | Light / dark | Use |
|---|---|---|---|
| Page, card | `--bg`, `--surface` | soft lavender #ebe5f6, #f8f5fd / #0f0c16, #1d1828 | Layout |
| Text, secondary | `--text`, `--muted` | #15121c, #5a5468 / #f4f2f8, #aaa3bb | All copy |
| Start seizure | `--cta` / `--on-cta` | #7a3fc0 with white | The raised Seizure button, the logo tile |
| Hero block | `--hero` / `--on-hero` | #3b2a6b / #4b3890, white text | Who's with them, only while someone is |
| Type tints | `--seizure-card`, `--sleep-card`, `--med-card` | light tints / deep tints, thin outline in the type color | Seizures, Sleep and Medications cards |
| Gold | `--gold` | #e8c15a, dark text | Follow-ups; active nav item; dark-mode headings |
| Emergency | `--danger-fill` | #b3261e, white text | The Emergency info card, always red |
| Entry types | `--seizure`, `--med`, `--sleep`, `--behavior`, `--note`, `--handoff` | per theme | Icons, labels, chip dots and card tints |

**Soothing palettes.** More → Appearance offers Lavender (default), Soft blue, Sage, Soft pink and Earth, each in light and dark. Blue lowers stress, sage eases sensory fatigue, lilac/pink is warm, earth tones minimize clutter. A palette changes the page, cards, secondary text, links, the hero card and the nav bar only. Seizure purple, the emergency red, gold follow-ups and the entry-type colors never change, so their meaning is the same for everyone in the circle. All 10 combinations were checked at 4.5:1 or better (lowest 4.63:1).

Rules: at most one hero block per screen. The Seizures, Sleep and Medications cards take a light tint of their entry type's color with a thin outline in that color, so each card matches its timeline entries; other cards stay neutral. Color is always paired with an icon or words. Purple is only ever the seizure color.

**Type.** **Lexend** everywhere. It was designed to reduce visual crowding and is favoured in neurodiverse communities. It's bundled with the app (about 40 KB, no Google request, cached for offline use) and falls back to Verdana, then Arial.
- **No serifs, italics, thin weights or decorative fonts.** Weights stay between 400 and 700.
- **No negative letter-spacing.** Body line height is 1.5.
- **No small all-caps.** Labels are in sentence case, at 12px or larger. The only capitals are the EVIE wordmark.
- **The seizure timer uses Verdana/Arial.** Lexend's digits vary in width, so a ticking clock in Lexend jiggles; Verdana's and Arial's are fixed-width.
- **The PDF uses Helvetica.**
- **Sizes:** screen titles 34px bold, section titles 20px bold, card values 28px bold, card labels 15px semibold.

**Layout rules (after a design review, 2026-09-28).** Only one round button on screen: the Seizure button. Whole cards are tappable, with a small chevron. A card's size follows its state: a dose that's due is big and gold; everything logged shrinks to one line; the purple hero appears only while someone is with the person. The emergency card is always red. The timeline is centered, and its filter chips are neutral with a small colored dot (there's no "All" chip; tapping a selected chip clears it). Serif is used only for the screen title.

**Layout.** Home is a bento grid in the style of modern fitness dashboards: a brand row (logo, EVIE wordmark, Schedule button), a big title ("Maya's day"), two square stat tiles with pastel icon circles and big numbers, then wide feature cards that are tappable as a whole, with a small chevron. A floating dark pill nav holds at most five items, with the seizure button as a raised 80px circle in the middle.

**Shape and space.** 18px card radius (24px for bento tiles and feature cards); pills for chips and call-to-action buttons; tabs (switching views on one screen, like the Care summary's 7/30/90 days) are a pill track with a dark highlight that slides to the selected tab, the same sliding track is used for Appearance mode (System / Light / Dark), while chips are for filters and form choices; folder tabs sit on top of block cards; 16px card padding; 12px gaps; touch targets 48px minimum, 64px for Start seizure and emergency.

**Icons.** Font Awesome Free Solid icons (CC BY 4.0), inlined as SVG on a 24px grid and filled in the type color, so every icon has the same weight. The seizure mark (a brain with a lightning bolt) is EVIE's own. Medication is capsules, sleep a moon, behavior a hand holding a heart (not the puzzle piece), goals a bullseye, handoff a handshake. No logos from other apps.

**Motion and safety.** Nothing flashes or pulses; the 5-minute alert is a steady color; no sounds. Motion is slow enough to notice but calm: press feedback 140ms, things changing on screen 320ms, things that slide (sheets, tab and nav highlights) 400ms; all set as `--dur-press`, `--dur` and `--dur-slide` in `styles.css`, and all off under reduced motion. Timeline days glide in as they scroll into view and each day's heading stays pinned, using the browser's scroll-driven animations; in-app jumps (a stat tile down to the timeline, Home back to the top) use the browser's own smooth scroll. EVIE never takes over ordinary scrolling. Loading shows three dots rising and falling in turn (1.4s cycle, movement only, never a brightness change), with a text label; they hold still under reduced motion. Bright colors are fine because they are still, but keep one hero block per screen.

**Logo.** The wordmark is "EVIE" in the app, and "E.V.I.E." on the welcome screen, which spells out the name underneath: Event Video & Information Exchange. Each letter and its word share an entry-type color: E and Event in the medication green, V and Video in the sleep blue, I and Information in the behavior gold, E and Exchange in the handoff color. There's no seizure purple, which keeps purple for seizures only (the mark above is the seizure purple). The lowest contrast is 5.1:1, across all five palettes in light and dark. The welcome screen is a centered version of the home brand row (the brain-and-bolt mark on a purple tile), followed by a card of the three things EVIE keeps, in their type colors. The app icon is a placeholder (white "E" on purple, `public/icon.svg`); a final mark and PNG icons are still to be made.

## 5. Content rules that are part of the brand

- Medical and program facts only say what their cited sources say, with a disclaimer.
- Patterns describe what was logged together, never causes.
- No ID numbers (Social Security, Medicaid) anywhere.
- The caregiver schedule is the family's plan, not a timesheet (EVV).
- Demo data uses made-up names and 555 phone numbers.

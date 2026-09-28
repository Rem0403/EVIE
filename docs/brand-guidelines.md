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

**Color.** All values are tokens in `src/styles.css`. Every text color is at least 4.5:1 (WCAG AA) on what it sits on, in both themes. Text on a color block is always full white or near-black, never dimmed.

| Role | Token | Use |
|---|---|---|
| Page, card, fill, separator | `--bg`, `--surface`, `--fill`, `--separator` | Layout |
| Text, secondary text | `--text`, `--muted` | All copy |
| Hero block (periwinkle) | `--hero` / `--on-hero` | The one main card on a screen (e.g. who's with them) |
| Soft card (lavender in dark, white in light) | `--soft-card` / `--on-soft` | Everyday task cards (medications) |
| Lime and pink blocks | `--lime`, `--pink` / `--on-block` | Folder-tab cards: Follow up (lime), Emergency (pink) |
| Call to action (mint in dark, green in light) | `--cta` / `--on-cta` | Start seizure, and the main "do it" button on a card |
| Section headings | `--heading-accent` | Lime in dark mode, text color in light |
| Entry types | `--seizure`, `--med`, `--sleep`, `--behavior`, `--note`, `--handoff` | Icon, label and filter chip only |
| Danger, due, OK | `--danger`, `--due-*`, `--ok` | Emergency, overdue, done |

Rules: at most one hero block per screen; a type color never fills a whole card; color is always paired with an icon or words; purple stays the seizure color (epilepsy awareness).

**Type.** Display headings in the phone's built-in serif (`ui-serif`, New York on iPhone, Georgia elsewhere; no downloaded fonts). Everything else in the system sans. Screen titles 38px serif; section titles 26px serif; hero values 32px serif; card labels 15px semibold; folder tabs 11px bold uppercase.

**Shape and space.** 18px card radius; pills for chips and call-to-action buttons; folder tabs sit on top of block cards; 16px card padding; 12px gaps; touch targets 48px minimum, 64px for Start seizure and emergency.

**Icons.** Simple line icons on a 24px grid, 1.75px stroke, in the type color. No logos or icons from other apps.

**Motion and safety.** Nothing flashes or pulses; animations 200ms or less and off under reduced motion; the 5-minute alert is a steady color; no sounds. Bright colors are fine because they are still, but keep one hero block per screen.

**Logo.** The wordmark is "EVIE". The app icon is a placeholder (white "E" on purple, `public/icon.svg`); a final mark and PNG icons are still to be made.

## 5. Content rules that are part of the brand

- Medical and program facts only say what their cited sources say, with a disclaimer.
- Patterns describe what was logged together, never causes.
- No ID numbers (Social Security, Medicaid) anywhere.
- The caregiver schedule is the family's plan, not a timesheet (EVV).
- Demo data uses made-up names and 555 phone numbers.

# EVIE: Care plan, shared meds, handoff and autism behavior logs

**Date:** 2026-09-28
**Author:** Remy Jacob

## 1. Purpose

Set EVIE apart from single-patient seizure apps such as Epsy. EVIE is for *several caregivers* looking after someone with epilepsy and autism who often can't report symptoms themselves.

> Epsy helps a person track their epilepsy. EVIE helps a family care for someone who can't track it themselves.

## 2. Research basis

Every claim below was checked against the raw text of three Wikipedia articles (2026-09-28): the [list of neurological conditions](https://en.wikipedia.org/wiki/List_of_neurological_conditions_and_disorders) ("List", names only), [Epilepsy](https://en.wikipedia.org/wiki/Epilepsy) and [Autism](https://en.wikipedia.org/wiki/Autism).

| Priority | Condition | List | Epilepsy article | Autism article | EVIE decision |
|---|---|---|---|---|---|
| 1 | Autism | yes | "Epilepsy is also more common in children with autism spectrum disorder" | Epilepsy in about 10% of autistic people; higher with intellectual disability and in older autistic people | Autism-specific behavior logs (before / what helped) |
| 1 | Sleep problems | specific sleep disorders only | Sleep deprivation is a trigger. SUDEP risk factors include nocturnal generalized tonic-clonic seizures and sleeping alone | About two-thirds of autistic children | "Happened during sleep" on seizures; sleep already logged |
| 1 | Intellectual disability | yes | Only indirectly (severe syndromes, "comorbid developmental disorders" and outcomes) | 30–40% of autistic people | Caregiver observation is the data; care plan records communication |
| 2 | ADHD | yes | 3–5× more often in children with epilepsy | 25–32% of autistic people | ADHD meds fit the med schedule |
| 2 | Anxiety / depression | generalized anxiety disorder only | More common; often under-diagnosed | Anxiety 17–23% | "Anxious / distressed" behavior |
| 2 | Gut problems | no | not mentioned | Common; linked to irritability, distress and sleep problems, especially with limited spoken language | "Pain or unwell" as a before-behavior factor |
| 3 | Tuberous sclerosis, Sturge–Weber | yes | "strongly associated with epilepsy" | not mentioned | Diagnosis options |
| 3 | Dravet, Lennox–Gastaut, West | yes | Developmental and epileptic encephalopathies, drug-resistant | not mentioned | Diagnosis options |
| 3 | Fragile X, Down, Angelman | yes | not mentioned | "may also co-occur with autism" | Diagnosis options |
| 3 | Febrile seizures | yes | Fever is a trigger | not mentioned | Fever trigger |
| 4 | Migraine, narcolepsy | yes | Common mimics of seizures | not mentioned | Keep "Not sure" and video |
| 4 | Rett, Tourette, cerebral palsy | yes | not mentioned | Rett appears only as a differential diagnosis | Diagnosis options, no claims |

Seizure triggers named in the Epilepsy article: sleep deprivation, stress, fever, illness, menstruation, alcohol, certain medications, flashing lights, sudden sounds, cognitive tasks.

Meltdowns and shutdowns, per the Autism article: they come from feeling overwhelmed. Triggers are "sensory or social… unpredictability, unmet basic needs, and emotional situations", and they "may be prevented by eliminating the distressing factors". Self-injury may express needs or distress, or relate to pain.

## 3. Features

**A. Care plan ("About {name}").** Stored on the circle doc under `profile` and `meds`, and editable by any member.
- `profile`: `diagnoses[]`, `diagnosisOther`, `communication` (speaks / some words / non-speaking / AAC or signs), `helps`, `avoid`.
- `meds`: `[{ name, dose, times: ['08:00', ...] }]`.
- Diagnoses print at the top of the PDF.

**B. Today's meds card** on the timeline.
- One row per scheduled dose today, showing Due, Given by X at time, or Missed.
- One tap writes a med entry with `slot: 'HH:MM'`. A dose counts as logged when today has a med entry with the same `medName` and `slot`.
- The summary shows "N of M logged doses given" (logged doses only, because the schedule can change).

**C. Handoff.**
- New entry type `handoff` with `until?` (ms) and `note?`. The latest handoff is who has them now.
- A banner on the timeline, and a Take over sheet showing counts since the previous handoff.

**D. Behavior (autism).**
- Kinds: meltdown, shutdown, self_injury, anxious, good_day, other.
- Optional fields: `before[]`, `helped[]`, `length`, `intensity`.
- Summary: behavior counts; the most common before-factors; the share of seizures with a meltdown, shutdown, self-injury or anxious episode in the 24h before, and in the 24h after (shown under the same 2+ and 50% threshold as the other patterns).

**E. Seizures.**
- New triggers: fever, stress, flashing lights, sudden sounds, period, med change.
- `duringSleep` flag in step 4, and a "During sleep" stat.

## 4. Data and security

- Circle rules: members may update `name`, `personName`, `joinCode`, `meds` and `profile`. Membership rules are unchanged.
- The circle is subscribed live so schedule and profile edits appear at once.
- New fields are optional; old entries still render.

## 5. Out of scope

- Push reminders (needs the Blaze plan).
- Two people marking the same dose offline at the same moment (both are logged and visible).
- New seizure types (spasms, myoclonic) until a clinician reviews them.
- Showing SUDEP in the interface.

## 6. Testing

- Unit tests for dose matching, handoff "since" counts and the behavior patterns.
- Component tests for the meds card, handoff and the behavior form.
- Emulator tests for the circle rules.

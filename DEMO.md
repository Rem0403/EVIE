# EVIE Demo Runbook

**Live URL:** https://<project>.web.app   (demo seeding: add `?demo=1`)
**Backup:** `npm run dev` on laptop → open the "Network" URL on the phone (phones must be able to reach the laptop: same network, firewall open for the port).
**Last resort:** screen recording in `Demo recording.mp4`.

**Pitch in one line:** Epsy helps a person track their epilepsy. EVIE helps a family care for someone who can't track it themselves: from the seizure, to the doctor, to finding support.

## Before going on stage
- [ ] The latest `firestore.rules` and app are deployed together (`npx firebase deploy --only firestore:rules,hosting`).
- [ ] Phone A (presenter) and Phone B (a "family member", named e.g. "Dad") both charged, on cellular (not venue Wi-Fi).
- [ ] Phone A: fresh circle created at `…/?demo=1` with your name, **Load demo week** tapped **once** (it adds a week of entries, the care plan, and three sample resources).
- [ ] Phone A shows the handoff banner ("With <you> · since 7:00 AM · until 3:00 PM"; after 3 PM it reads "Was with"), **Today’s meds**, and a **Follow up** card for the waiver waiting list.
- [ ] Summary at 30 days shows 3 pattern callouts: poor sleep, meltdown/shutdown in the 24h before, and morning.
- [ ] Phone B: joined with the circle code (`EVIE-XXXX-XXXX`); its timeline matches Phone A.
- [ ] Stand-in clip (`demo-clip.mp4`, neutral footage, not a real seizure) saved in each phone's camera roll.
- [ ] Both phones: Do Not Disturb on, brightness up, auto-lock off.

## Script (≈5 min; for 4 min, skip steps 5 and 6)
1. **Problem (30s):** Group texts, paper notes, a camera roll full of seizure videos, and nobody sure whether the 8 PM dose was given. When the neurologist asks "how many this month, and what happened before?", nobody has the whole picture.
2. **Home (30s):** Phone A. One shared timeline for the whole family. The top shows **who is with her now**, **today's meds** with who gave each dose, and a **follow-up** for the waiver waiting list.
3. **Seizure (60s):** Tap **Seizure**. The timer starts instantly, because in the moment you have one hand free. Mention that at 5 minutes it turns red, vibrates and says to follow the seizure plan. Tap **Stop**, then walk through the four short steps:
   - Tap **i** to show the plain-language guide, then pick **Tonic-clonic**.
   - Rescue medication: **No**.
   - Trigger: **Poor sleep**, then **Next**.
   - Attach the clip, then **Save seizure**.

   The clip stays on this phone for privacy; the others see "Clip saved on <you>'s phone".
4. **Handoff (30s):** Hold up Phone B. The seizure is already there. Tap **Take over**. It shows everything since the last handoff ("1 seizure · …"). Add a note, then **Take over**. Phone A's banner now says "With Dad".
5. **Meds (15s):** Phone B: in Today's meds, tap **Given** on a dose. Phone A shows "✓ Given · Dad". No double doses, no guessing.
6. **Autism (20s):** Phone B: **+ Log → Behavior → Meltdown**. Before: **Sensory**, **Tired**. What helped: **Quiet or dim space**. **Save**.
7. **Doctor summary (60s):** Phone A: **Summary → 30 days**. Show the stats, "During sleep" and "Scheduled doses given". Then the key callout: *"3 of 5 seizures had a meltdown, shutdown, self-injury or anxious time logged in the 24h before."* For a child who can't say "I feel a seizure coming", that's the family's early warning. Show the Behavior section ("Often before a hard time: Sensory…"). Explain that every number traces back to a logged entry, and that EVIE shows what happened together, not what caused it. Tap **Download PDF**.
8. **Support (30s):** Tap **Support**. The family's programs and groups live here, with the waiver waiting-list call due today. Open **Start here**. It's written for the parent who was told "your child has a disability" and then given no support: early intervention, waivers, IEP transition plans, turning 18, social groups. Each item links to an official source.
9. **Why (20s):** Built from my family's experience with my sister, and shaped by talking to other families.

## Smoke test after every deploy
- [ ] Create → join on a second device with the code → log a seizure with a clip → the entry appears on the other device with "Clip saved on …'s phone"; the clip plays on the phone that attached it.
- [ ] Quick log each of med / sleep / behavior (with before and what helped) / note.
- [ ] Care plan: add a diagnosis and a medication with two times → both phones show it in Today's meds; **Given** on one phone shows on the other.
- [ ] Take over on the second phone → banner updates on both.
- [ ] Support: save a guide item, add a resource with a next step due today → Follow up card shows on the timeline.
- [ ] Summary 7/30/90 → **Download PDF** and **CSV** open correctly; **Print** preview works.
- [ ] Airplane mode → log an entry → back online → it syncs.
- [ ] Over HTTPS: "Add to Home Screen" works and the app opens from the icon.

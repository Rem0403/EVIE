# EVIE Demo Runbook

**Live URL:** https://<project>.web.app   (demo seeding: add `?demo=1`)
**Backup:** `npm run dev` on laptop → open the "Network" URL on the phone (phones must be able to reach the laptop: same network, firewall open for the port).
**Last resort:** screen recording in `Demo recording.mp4`.

**Pitch in one line:** Epsy helps a person track their epilepsy. EVIE helps a family care for someone who can't track it themselves: from the seizure, to the doctor, to finding support.

## Before going on stage
- [ ] The latest `firestore.rules` and app are deployed together (`npx firebase deploy --only firestore:rules,hosting`).
- [ ] Phone A (presenter) and Phone B (a "family member", named e.g. "Dad") both charged, on cellular (not venue Wi-Fi).
- [ ] Phone A: fresh circle created at `…/?demo=1` with your name, **More → Load demo week** tapped **once** (it adds a week of entries, the care plan, and three sample resources).
- [ ] Phone A shows the handoff banner ("With <you> · since 7:00 AM · until 3:00 PM"; after 3 PM it reads "Was with"), **Today’s meds**, and a **Follow up** card for the waiver waiting list.
- [ ] Care summary at 30 days shows 3 pattern callouts: poor sleep, meltdown/shutdown in the 24h before, and morning.
- [ ] Phone B: joined with the circle code (`<NAME>-XXXX-XXXX`); its timeline matches Phone A.
- [ ] Stand-in clip (`demo-clip.mp4`, neutral footage, not a real seizure) saved in each phone's camera roll.
- [ ] Both phones: Do Not Disturb on, brightness up, auto-lock off.

## Script (≈5 min; for 4 min, skip steps 5 and 6)
1. **Problem (30s):** Group texts, paper notes, a camera roll full of seizure videos, and nobody sure whether the 8 PM dose was given. When the neurologist asks "how many this month, and what happened before?", nobody has the whole picture.
2. **Home (30s):** Phone A. At a glance: **seizures this week** and **last night's sleep**, **today's meds** with who gave each dose, **who is with her now** and who's scheduled, **Emergency info**, and a **follow-up** for the waiver waiting list. Below is one shared timeline for the whole family.
3. **Seizure (60s):** Tap the big round **Seizure** button in the middle of the bottom bar. The timer starts instantly, because in the moment you have one hand free. Mention that at 5 minutes it turns red, vibrates and says to follow the seizure plan. Tap **Stop**, then walk through the four short steps:
   - Before tapping Stop, tap **Emergency info**: a new babysitter sees the seizure plan and who to call, and the timer keeps running. Close it.
   - Tap **i** to show the plain-language guide, then pick **Tonic-clonic**.
   - Rescue medication: **No**.
   - Trigger: **Poor sleep**, then **Next**.
   - Attach the clip, then **Save seizure**.

   The clip stays on this phone for privacy; the others see "Clip saved on <you>'s phone".
4. **Handoff (30s):** Hold up Phone B. The seizure is already there. Tap **Take over**. It shows everything since the last handoff ("1 seizure · …"). Add a note, then **Take over**. Phone A's banner now says "With Dad".
5. **Meds (15s):** Phone B: in Today's meds, tap **Given** on a dose. Phone A shows "✓ Given · Dad". No double doses, no guessing.
6. **Autism (20s):** Phone B: **+** in the bottom bar → **Behavior** → **Meltdown**. Before: **Sensory**, **Tired**. What helped: **Quiet or dim space**. **Save**.
7. **Doctor summary (60s):** Phone A: the **Care summary** button (chart icon) in the bottom bar → **30 days**. Show the stats, "During sleep" and "Scheduled doses given". Then the key callout: *"3 of 5 seizures had a meltdown, shutdown, self-injury or anxious time logged in the 24h before."* For a child who can't say "I feel a seizure coming", that's the family's early warning. Show the Behavior section ("Often before a hard time: Sensory…"). Explain that every number traces back to a logged entry, and that EVIE shows what happened together, not what caused it. Tap **Download PDF**.
8. **Support (30s):** Tap **More → Support and resources**. The family's programs and groups live here, with the waiver waiting-list call due today. Tap the **Start here** tab. It's written for the parent who was told "your child has a disability" and then given no support: early intervention, waivers, IEP transition plans, turning 18, social groups. Each item links to an official source.
9. **Why (20s):** Built from my family's experience with my sister, and shaped by talking to other families.

## Smoke test after every deploy
- [ ] Welcome → **Try a demo with sample data** → home shows Maya's week and the demo banner; **End demo** returns to the welcome screen.
- [ ] Home → **Invite** → **Copy code** copies the code; **Share invite link** → opening the link on another device shows the join form with the code filled in.
- [ ] **Continue with Google** on phone A, then in a second browser **Continue with Google** with the same account → it opens the same circle. **Sign out of Google** (in More, or in your profile) returns to the welcome screen, which shows who's signed in with its own **Sign out**.
- [ ] **More → Exit EVIE** → "All changes saved" online; in airplane mode → "Saved on this phone"; **Open EVIE again** returns to where you were.
- [ ] Start a care circle → step through names, one caregiver with a phone, and one medication → the circle opens with them in the care plan and Today's meds; Getting started no longer lists medications (emergency still shows: it needs the seizure plan too). Skipping every step still creates the circle.
- [ ] New circle home: Seizures and Sleep tiles, then the Getting started list (no empty medication or handoff card); each row opens the right place; **Hide this list** keeps it hidden after a reload.
- [ ] More → Goals → add a goal → **Log practice** → *With help* → the goal shows it under "Last 2 weeks", the timeline shows a Goal entry, the Goals filter chip finds it, and the Care summary lists it under Goals (screen and PDF). Edit → **Met** hides Log practice.
- [ ] More → People: the person who started the circle sees **Remove** next to others; removing someone changes the join code, and their phone shows "You're no longer in …". **Get a new code** in the invite sheet makes the old code fail.
- [ ] Circle icon: **Start a care circle** opens on *Choose an icon for the circle* (step 1 of 4); pick a symbol and color (or **Photo** → **Choose photo** → frame it → **Choose**), finish setup, and the home screen shows it top left. Tap it → change it → **Done**; phone B sees the new icon.
- [ ] Profile pictures: start a circle → **Choose photo** on the first step opens **Move and scale**: drag and pinch to frame your face, then **Choose** shows it in the circle; tap your picture on the home screen → **Remove photo** shows your initials; **Use Google photo** appears once signed in with Google. Phone B sees phone A's picture in More → People.
- [ ] More → **Leave this circle** (online) → the welcome screen says you left, and the phone's copy is cleared.
- [ ] Support: a resource's Website button opens a normal web page.
- [ ] Care summary 90 days: shows "Loading 210 days of history…" briefly, then the comparison with the previous 90 days; Download PDF is off until then.
- [ ] Browser console on the live site: no Content-Security-Policy report-only warnings during sign-in, sync, PDF export and (with App Check on) reCAPTCHA.
- [ ] Create → join on a second device with the code → log a seizure with a clip → the entry appears on the other device with "Clip saved on …'s phone"; the clip plays on the phone that attached it.
- [ ] Quick log each of med / sleep / behavior (with before and what helped) / goal practice / note.
- [ ] Care plan: add a diagnosis and a medication with two times → both phones show it in Today's meds; **Given** on one phone shows on the other.
- [ ] Take over on the second phone → banner updates on both.
- [ ] Emergency info: contacts call, allergies and seizure plan show; it opens over the seizure timer without stopping it; Print works.
- [ ] Schedule: add a shift covering now → the banner shows "Scheduled: … until …"; the EVV notice is at the top.
- [ ] Try saving "Medicaid ID 12345678901" in the care plan → refused with the explanation.
- [ ] Support: save a guide item, add a resource with a next step due today → Follow up card shows on the timeline.
- [ ] The bottom bar shows on every screen except the seizure timer; More → Appearance → Light / Dark switches the mode, and each color palette (Lavender, Soft blue, Sage, Soft pink, Earth) works in both.
- [ ] Attach a photo and a PDF to a note → both show on the entry; in Care plan → Documents, add a PDF → it shows in Emergency info; on the second phone it says "Saved on …'s phone".
- [ ] Care summary 7/30/90 → **Download PDF** and **CSV** open correctly; **Print** preview works.
- [ ] Airplane mode → log an entry → back online → it syncs.
- [ ] Over HTTPS: "Add to Home Screen" works and the app opens from the icon.

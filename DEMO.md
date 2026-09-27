# EVIE Demo Runbook

**Live URL:** https://<project>.web.app   (demo seeding: add `?demo=1`)
**Backup:** `npm run dev` on laptop → open the "Network" URL on the phone (phones must be able to reach the laptop: same network, firewall open for the port).
**Last resort:** screen recording in `Demo recording.mp4`.

## Before going on stage
- [ ] Phone A (presenter) and Phone B (a "family member") both charged, on cellular (not venue Wi-Fi).
- [ ] Phone A: fresh circle created at `…/?demo=1`, **Load demo week** tapped, Summary shows 2 callouts at 30 days.
- [ ] Phone B: joined the circle with the code; timeline matches Phone A.
- [ ] Stand-in clip (`demo-clip.mp4`, neutral footage, not a real seizure) saved in each phone's camera roll.
- [ ] Both phones: Do Not Disturb on, brightness up, auto-lock off.

## Script (≈4 min)
1. **Problem (30s):** Group texts, paper notes, a camera roll full of seizure videos. When the neurologist asks "how many this month, and what happened before?", nobody has the whole picture.
2. **Shared timeline (30s):** Phone A timeline: one log for the whole family, grouped by day, with who logged what.
3. **Seizure log (60s):** Tap **Seizure**. The timer starts instantly, because in the moment you have one hand free. Stop → Tonic-clonic → Poor sleep → attach clip → Save. The clip plays inline on Phone A. It stays on this phone for privacy (the family's phones see "Clip saved on Remy's phone"), so the doctor sees it from Phone A.
4. **Real-time (20s):** Hold up Phone B. The entry is already there.
5. **Quick log (20s):** Phone B: + Log → Med → Missed → Save (2 taps).
6. **Doctor summary (60s):** Summary → 30 days → stats, day strip, "3 of 4 seizures followed poor sleep", "3 of 4 in the morning". Explain that each number traces back to a logged entry, and that EVIE shows what happened together, not what caused it. Print / Save PDF.
7. **Why (20s):** Built from my family's experience with my sister.

## Smoke test after every deploy
- [ ] Create → join on second device → log seizure with clip → entry appears on other device showing "Clip saved on …'s phone"; clip plays on the phone that attached it.
- [ ] Quick log each of med / sleep / behavior / note.
- [ ] Summary 7/30/90 → print preview.
- [ ] Airplane mode → log entry → back online → syncs.

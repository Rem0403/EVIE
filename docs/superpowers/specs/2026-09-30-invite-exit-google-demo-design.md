# Invites, exit, Google sign-in and demo mode

2026-09-30. From reviewer feedback: "make it easier to get the code", "a way to exit the app, so it can update things when you leave", plus Google sign-in and a demo mode.

## Invites
- The home header has an **Invite** button (icon only under 400px wide). More → Invite family opens the same sheet.
- The sheet (`src/components/InviteCode.jsx`) shows the code, **Share invite link** and **Copy code**, and warns that anyone with the code sees everything in the circle. The "Circle created" screen uses the same block.
- The link is `/#join=<code>` (`inviteLink` in `src/lib/share.js`; older `/?join=` links still work via `inviteCodeFrom`). `App` reads it on load and opens Welcome on the join form with the code filled in, then removes it from the address after joining.

## Exit
- More → **Exit EVIE** calls `flushWrites` (`waitForPendingWrites`, 8s timeout, skipped offline), shows "All changes saved" or "Saved on this phone", and tries `window.close()`, which browsers only honor in some installed apps. **Open EVIE again** returns to the same screen; live listeners stay attached.
- This is the place for any future "on exit" work.

## Google sign-in
- `connectGoogle` (`src/firebase.js`) links Google to the current anonymous user with `linkWithPopup`, keeping the uid. No rules change.
- `auth/credential-already-in-use` means the Google account already has an EVIE identity. On a phone that's in a circle, the person confirms first; then `signInWithCredential` switches, and `findMyCircle` opens the newest circle that identity belongs to.
- Signing in on the welcome screen with the *same* uid doesn't reopen a circle the person left on purpose.
- **Sign out of Google** syncs, signs out and starts a new anonymous identity (needs the network).
- Console: enable the Google provider under Authentication → Sign-in method.

## Demo mode
- Welcome → **Try a demo with sample data** creates a circle for "Maya" as "You" and runs `seedDemo` (`src/data/demo.js`, shared with More → Load demo week under `?demo=1`).
- The session stores `demo: true`; home shows "Demo circle with made-up data" with **End demo** (leaves without a prompt).
- Demo circles stay in Firestore after End demo (see DECISIONS.md).

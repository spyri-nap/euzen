# Eúzēn 0.6 — test preparation, 4 November 2026

Version convention preserved: package 0.6.0 and UI 0.6. Exact PWA hash appears under installation help → technical diagnosis. Use the versioned Eúzēn deployment attached to the application commit; do not confuse an old alias service-worker shell with the new version.

## Changes

- Onboarding now describes the actual guest workflow and explicitly directs users to Library → Create exercise.
- Invalid email and invalid/expired code have distinct actionable messages.
- Pending/offline/readonly/auth/error states explain storage boundaries and safe next actions.
- Test package contains a ready English invitation draft, equivalent DE/EN/EL tasks, installation/storage notes and feedback questions. No invitation was sent.

## Verification

Browser at isolated 127.0.0.1:5193: started empty; created QA Kniebeuge and QA Drücken; created QA Erstes Workout; added/reordered exercises so Drücken came first; selected one set with no transition pause; started, paused, resumed and confirmed both work steps. Progress showed one completed session and two work steps. No account or real training data used. Automated suites cover timer modes, data validation, draft persistence, guest/account isolation and sync failures. See ACCEPTANCE-2026-11-04.md for measured responsive dialog and offline/two-build evidence.

## Known limits and decisions

Only fictitious content until legal decisions/review in LEGAL-DECISIONS-2026-11-04.md are resolved. Physical iPhone/Android checks deferred by operator. Interface is DE/EN; guide also EL. Home Screen installation is a PWA, not a native store download. Screen-lock audio/background execution is browser-dependent. Accounts require enabled sync and separate Vercel access. Some composed accessibility/analysis labels retain German fallback (LANGUAGES.md). Earlier reports are historical; this release record and dated acceptance report supersede contradictory older deployment status statements.

## Reproduce and recover

Use Node >=22.12 (verified 22.17.1), npm ci, npm test, npm run check, npm run format:check, npm run build, npm run preview -- --port 5186 --strictPort. Avoid opening multiple writer tabs on the same origin during testing.

Before updates: export JSON backup, finish active sessions, close all old app windows and reopen. Never clear browser storage just to update. To recover a release, create a new branch from the last verified application commit a451605 in a separate checkout and deploy only to the same Eúzēn preview project after checking backup/schema compatibility. Do not use destructive git reset or downgrade stored data automatically. Protected production settings remain unchanged.

## Handoff

Invitation/tasks/feedback: TEST-PACK-0.6.md. Detailed guides: BETA-GUIDE-DE.md, BETA-GUIDE-EN.md, BETA-GUIDE-EL.md. Device steps: DEVICE-TESTS.md and ACCEPTANCE-2026-11-04.md. Confirmed manual retention rule: test data/accounts within 30 days after test end; feedback deleted/anonymized within 90 days of receipt. No automatic deletion is implemented or promised. Provider backup evidence and legal review remain external.

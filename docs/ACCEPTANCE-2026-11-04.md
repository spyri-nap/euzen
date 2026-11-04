# Technical acceptance — 4 November 2026

Scope: Eúzēn closed web test. Physical device testing deferred by operator; legal review is separate.

| Case                                     | Expected                                                            | Observed evidence                                                                                                                  | Result                    |
| ---------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Privacy gate                             | No request before acknowledgement, participation and valid email    | AccountGate.test.tsx: cancel leaves checkbox disabled; acknowledgement enables it; valid input invokes mocked request exactly once | Pass, mock only           |
| Nested dialogs                           | Escape closes only top layer                                        | LegalPages.test.tsx; browser focus returns to Imprint and Settings remains open                                                    | Pass                      |
| German responsive dialogs                | Contained, readable, no horizontal overflow                         | Measured 1440×900, 768×1024, 390×844, 360×800 in IAB using actual innerWidth/innerHeight and dialog DOM geometry                   | Pass after title-wrap fix |
| English responsive dialogs               | Same behavior, translated content                                   | Same four measured sizes; both dialogs inside viewport with scrollWidth <= clientWidth                                             | Pass                      |
| Full legal content                       | Dialog matches document source                                      | German raw HTML source reused; complete English privacy translation; English imprint duplicate German removed                      | Pass                      |
| Empty guest installation and persistence | No seeded workouts, valid stored state survives reload              | storage.test.ts, accountStore.test.ts                                                                                              | Pass automated            |
| Training and planning regression         | Timers, manual counters, sessions, analytics and dates remain valid | domain.test.ts, Editor.test.tsx, workoutDraft.test.ts, guided.test.ts                                                              | Pass automated            |
| Auth/sync isolation                      | No automatic guest merge or cross-account writes                    | auth, sync, cloud, reconcile, useStore, readonly tests                                                                             | Pass automated            |
| Offline browser start                    | App usable with server stopped                                      | IAB origin 127.0.0.1:5192, build 063cdcdda9f3; preview process stopped, reload showed full app; Settings and full privacy opened   | Pass                      |
| Update detection                         | Old window survives, new build waits                                | Browser showed new-version-ready message while diagnostic remained 063cdcdda9f3                                                    | Pass                      |
| Safe activation                          | New build after old client closes                                   | Reopened same origin diagnostic 9655c8b38e8b                                                                                       | Pass                      |
| Partial install and old lazy files       | Failed new cache removed, old version preserved                     | pwa.test.ts and pwaUpdate.test.ts                                                                                                  | Pass automated            |
| TypeScript/build/format                  | No errors                                                           | 113 tests / 22 files; tsc via production build; PWA build; prettier; diff check                                                    | Pass                      |
| Physical Safari/PWA and Android          | Real device evidence                                                | Operator explicitly selected device test later                                                                                     | Deferred by operator      |

## Findings fixed

- Long German modal heading caused horizontal overflow at 360/390px and automatic sideways scrolling when focusing Close. Added min-width:0, wrapping and fixed-size close action. Repeated all 16 language/size/dialog measurements successfully.
- Missing Privacy/Imprint dictionary entries left German buttons in English UI. Added translations.
- English imprint repeated German content; duplicate is now hidden, with date preserved in English.
- Added explicit favicon to remove a harmless favicon.ico 404 seen in Arc console.

## Earlier blank view

Arc renders an empty surface while its DevTools DOM contains the mounted app. Device-mode Offline simulation was enabled; disabling it and reloading cleared console errors but did not restore rendering. Thus offline simulation alone is not proven as the cause. Independent IAB rendering works. No React exception was observed; only favicon 404 before correction. Original Vercel blank state remains non-reproduced, not declared causally fixed.

## Evidence boundaries

Responsive results are browser emulation, not physical devices. Core feature regression is automated rather than a claim that every workflow was manually repeated. Browser network-offline was simulated by stopping the local origin server, not by disabling the operating system network. Two-build lifecycle additionally tested with an isolated worker harness. No real OTP messages, user data deletions or invitations were performed.

## Physical checklist for later

Final application commit: a451605. Preview: https://euzen-3unuetgyc-nap-studios.vercel.app. Final PWA build: 9655c8b38e8b. Deployment dpl_2XdyWewiYSXtxmh2PsTutm5zdyVe is READY and its startup was visually confirmed in authenticated Arc. Local port 5186 serves matching final asset references. The branch alias showed an old 0.5 worker in Arc; use the versioned URL for a clean test or close all alias clients to allow safe activation. No storage deletion is needed.

Update observation: old diagnostic 063cdcdda9f3 remained active with a new-version-ready message; after closing and reopening the client the diagnostic changed to 9655c8b38e8b. Mobile dialog and online startup screenshots were captured in the work session but not exported as standalone files. Arc automation could not complete online modal interaction (accessibility click had no effect; coordinate fallback returned noWindowsAvailable). Equivalent dialogs passed local browser verification. This is not a claim of complete manual online acceptance.

Verdict: suitable for controlled web usability testing with fictitious content on the verified version. Physical testing is explicitly deferred by the operator. Legal decisions/review described in the actual legal document remain outside this technical verdict.

Use final preview on iPhone Safari and installed Home Screen app: open each legal dialog, scroll to end, close, reopen; verify keyboard does not hide email/action; start/pause/resume a fictitious workout; relaunch and check persistence. Record iOS/device/build and pass/fail. Repeat on Android Chrome and installed PWA when a device becomes available. Never send codes or personal training backups.

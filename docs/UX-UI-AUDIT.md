# UX/UI audit · 3 November 2026

## Scope and evidence

Repository review: App, shared fields/dialogs, onboarding, exercise library,
workout editor, planning, player, progress/insights, Space, account, sync panel,
installation/update help, beta guide and static legal pages.

Isolated browser origin: `http://127.0.0.1:5190/`. Existing user data at 5186
was not changed. A fictional exercise and one-set workout were created and
completed in the isolated guest store. No email, account data or invitation was
submitted. Responsive browser testing is not physical-device testing.

Reference: [W3C WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/),
especially target size and focus visibility. This review is not a conformance
certification.

## Prioritized findings and changes

| Priority | Finding                                                               | Resolution                                                                                  |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| High     | Help panels precede the main task and consume the first mobile screen | Moved below main content; hidden during training, with update component kept mounted        |
| High     | Empty exercise collection described as a failed search                | Added first-exercise explanation and direct create action                                   |
| High     | Onboarding says accounts and sync are not implemented                 | Replaced with guest/account distinction and configuration-aware guidance                    |
| High     | Progress page exceeds 320px viewport                                  | Positioned scroll container so absolutely positioned accessible table labels stay inside it |
| High     | Mobile navigation ignores home-indicator height                       | Safe-area height and content clearance aligned                                              |
| Medium   | Icon controls and small buttons have inconsistent hit areas           | Shared 44px control token and mobile overrides                                              |
| Medium   | Mobile labels shrink to 7–10px                                        | Raised navigation, captions, field labels and explanatory copy                              |
| Medium   | Long translated action labels can crowd rows                          | Wrapped action rows, modal actions and section headings                                     |
| Medium   | Long dialogs lose their close action                                  | Sticky dialog header with local scroll containment                                          |
| Medium   | English calendar accessibility label says “frei”                      | Translated the fallback label                                                               |
| Medium   | Progress summaries contain German fragments                           | Translated incomplete, work-step and time/load captions                                     |
| Low      | Guide defaults to German regardless of app language                   | Follow interface language unless guide preference was saved                                 |
| Low      | Timer digit width changes during training                             | Tabular numeric glyphs                                                                      |

## Flow checks

- Entry: empty guest area, introduction, primary workout action and settings.
- Library: empty state, creation form, save, search and selected exercise card.
- Editor: one-set configuration, zero rest, draft notice, save and saved feedback.
- Player: start, actual repetitions, completion and resulting progress record.
- Planning: week navigation, empty schedule, template and contextual actions inspected.
- Progress: one saved result, trend controls, table and history inspected.
- Space: weekly review, reflection selector, source links and disconnected integrations inspected.
- Settings: language switch, account section, local-sync boundary, backup controls and optional audio inspected.
- Language: German and English interface; separate Greek beta guide retained.
- Dialog semantics: native modal dialog, accessible close name and cancel handling retained.
- Offline/legal navigation: existing worker regression test retained; static legal pages remain precached.
- Auth/sync: implementations unchanged; existing automated tests cover account boundaries and reconciliation. No new live OTP or two-client cloud acceptance was performed in this UI pass.

## Responsive evidence

At 320px, Today, Planning, Library, Progress and Space have document width equal
to viewport width after the table fix. Mobile screenshots inspected at 375px and
360px; desktop breakpoint inspected at 1280px. Actual keyboard, VoiceOver,
landscape and physical Android acceptance require a device session.

## Deliberately preserved and limitations

No database schema/RLS, auth, sync protocol, workout calculation, destructive reset,
Vercel configuration or external integration was changed. Existing olive/paper
branding, reduced-motion rules, visible focus and native form controls retained.

The interface remains DE/EN, while the guide is DE/EN/EL. Earlier claims that the
entire app supports Greek were inaccurate. Full Greek UI localization and some
existing dynamic English analytics prose require a dedicated localization pass.
No complete three-language acceptance is claimed. No legal text was invented.

## First usability session

Ask testers to create an exercise, build and reorder a workout, choose a timer,
complete one session, locate its result, change language and find backup/help.
Observe missed taps, hesitation, scrolling and misunderstanding before explaining
the interface. Test iPhone keyboard/safe areas and a physical Android separately.

# Layout and spacing · 3 November 2026

## Ownership

The page container owns the horizontal gutter. The support stack uses the same
gutter and maximum width as main content. Panels own internal padding; the support
stack owns the gap between its cards. Onboarding has a bottom section gap rather
than the unrelated generic top-gap class.

Tokens in `src/styles.css` are the source of truth:

| Relationship                             | Value                     |
| ---------------------------------------- | ------------------------- |
| Page gutter, phone ≤560px                | 20px                      |
| Page gutter, tablet ≤1200px              | 32px                      |
| Page gutter, desktop                     | 48px                      |
| Maximum content container                | 1440px                    |
| Independent sections / onboarding bottom | 32px                      |
| Card gap                                 | 16px phone / 24px desktop |
| Card padding                             | 20px phone / 24px desktop |
| Form field separation                    | 16px                      |
| Label to field                           | 8px                       |
| Text group separation                    | 12px                      |
| Shared control target                    | 44px                      |

The sidebar is outside the content container. A 768px viewport therefore has its
content edge at x=112 (80px sidebar + 32px gutter). At 1280px the edge is x=272
(224px sidebar + 48px gutter). These offsets are intentional.

## Corrections

- Removed independent clamped margins from support panels.
- Replaced help panel margin variants with parent-owned grid spacing.
- Aligned main content, onboarding, guide and installation help.
- Consolidated panel, field, heading, grid and dialog spacing into tokens.
- Kept the update component mounted while hiding support during training.
- Kept dialog header offset tied to dialog padding.

Nested exercise prescriptions, compact calendar cells and the training timer keep
their specialized layouts. They do not represent peer-level white panels.

## Browser verification

Current source served at 5190 (development server; no production worker registered
by the app). Automated DOM geometry checks performed through the browser for all
five screens at 320, 375, 390, 768 and 1280px: 25 combinations.

Results: document width equals viewport width throughout; main and support content
edges match throughout. Onboarding-to-heading gap measures 32px at every width.
Mobile screenshot confirms the original touching-text issue is removed.
Settings dialog and language selector inspected at 390px.

Previous full functional UI pass is documented in UX-UI-AUDIT.md. This spacing pass
does not claim a new physical-device or live-cloud acceptance. Existing automated
account, sync, editor, timer and worker tests are rerun with the layout changes.

## Maintenance

Add future peer cards to the shared container or stack; do not add per-card page
margins. Use section-space for independent sections, card-gap inside groups and
field-gap within forms. Introduce a specialized exception only for a documented
component need. Avoid combining a parent gap and child margins for one relation.

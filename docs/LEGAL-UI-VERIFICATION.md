# Legal UI verification — 4 November 2026

Implemented: shared in-app legal dialogs across settings, beta guide and installation help; complete German source document in dialog; full English privacy translation; branded standalone pages; focus restoration; isolated nested Escape handling; consent and email submit guards; visible initial HTML fallback and delayed reload action.

Observed in browser: app starts on fresh localhost origin; full German privacy content is visible; imprint opens in styled dialog; Escape leaves settings open and restores focus to Imprint; privacy acknowledgement enables participation checkbox while request-code remains disabled. No OTP mail requested.

Automated: 111 tests in 20 files pass, including regression for nested cancellation and complete privacy sections. TypeScript, production/PWA build, formatting and diff checks passed before final packaging.

Cache finding: existing port 5186 origin displayed an earlier cached document while a fresh port 5190 origin displayed the current build. This proves stale local content, not the cause of the earlier blank Vercel view. Existing safe update policy waits for all old clients to close, preserving active sessions and lazy assets. Do not clear user storage to update.

Limits: exact responsive viewport emulation requested through browser capability did not affect screenshot dimensions in this session; four-size visual acceptance is not claimed. Physical device and full offline/two-build browser acceptance remain unverified. The original blank Vercel state was not reproduced or causally resolved. Legal documents themselves explicitly retain unresolved legal basis/retention review; technical work is not legal approval.

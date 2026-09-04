---
agent: playwright-flaky-stabilizer
description: Fix a flaky test
---

Stabilize `tests/app/e2e/add-book-to-collection.spec.ts` — it's been failing intermittently.
Confirm the flake, find the root cause, fix it, and verify with repeated runs.

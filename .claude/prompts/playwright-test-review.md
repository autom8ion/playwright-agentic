---
agent: playwright-test-reviewer
description: Semantic review of freshly written/changed test code (what the hook can't see)
---

Review the working-tree changes under `tests/`, `pages/`, `test-data/`, `enums/` — or these files:

- `tests/app/functional/webtables-edit-record.spec.ts`
- `pages/WebTablesPage.ts`

Rank findings BLOCKER / SHOULD-FIX / NIT with `file:line`. The orchestrator runs this
automatically at the end of coverage and heal mode; call it directly for a hand-written change.

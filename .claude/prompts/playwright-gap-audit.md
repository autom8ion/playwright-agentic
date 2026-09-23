---
agent: playwright-orchestrator
description: Find app pages/sections with no or thin coverage and get ready-to-run /coverage lines
---

Mode: gap-audit.
Seed: `tests/app/seed.spec.ts`
Output: `specs/coverage-gaps.md`

The orchestrator makes one #playwright-test-planner call in gap-audit mode: it walks the app's
left-nav (the sections `GroupMenuComponent` exposes), compares every reachable page against
`Routes` in `enums/endpoints.ts`, the `pages/` directory, and spec titles under `tests/app/`, and
writes a ranked gap list where each entry is a paste-ready `/coverage <…>` line. No spec files
are written.
